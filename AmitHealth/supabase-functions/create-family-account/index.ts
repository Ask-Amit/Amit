// ══════════════════════════════════════════════
// Amit Health — Create Family Account (password-based, no email needed)
//
// REVISED 2026-09-19 (first pass): this function does ONLY account
// creation and the family link — nothing health-specific. Health-specific
// setup (biometrics, goals) happens later, inside Amit Health itself, once
// this account already exists. Account/family creation belongs at the
// Hub level (About Me), not inside any one app.
//
// REVISED AGAIN 2026-09-19 (Ryan's direct instruction): the caller-supplied
// email field is gone entirely. Supabase Auth has no username-only mode —
// it always needs *something* shaped like an email as the identifier —
// but since email_confirm:true means nothing is ever actually sent to it,
// that string never needs to be real or reachable. This function now
// generates a synthetic login email itself, server-side, from the child's
// name, the relationship, AND the guardian's own real email — e.g.
// jacob.child.ryan_at_gmail.com@amit-internal.local — so the parent never
// sees, types, or thinks about an email field (just a name + password),
// but the address itself stays traceable back to exactly which account
// created it, on sight, in the Supabase dashboard, without a join.
//
// Solves the real gap: a parent adding a child to Amit shouldn't need
// the child to have their own real, working email address. Magic-link
// sign-in (used everywhere else in Amit) requires a real inbox to click
// a link from — a young child usually doesn't have one. This creates a
// REAL Supabase login for the child directly, with a password the
// parent sets on their behalf, fully activated immediately — no email
// sent, no magic link needed until the child adds their own real email
// later ("graduation" — zero data migration, since everything was
// already tied to this same login ID). Graduation would replace this
// synthetic address with the child's own real one via a normal Supabase
// email-change flow — not built yet, not needed until someone graduates.
//
// This does NOT replace magic-link sign-in for anyone else. Both
// methods exist side by side in the same Supabase project.
//
// Flow:
//   1. Verify the caller is signed in (this is the parent/guardian).
//   2. Generate a synthetic, never-emailed login address from the name.
//   3. Create a brand-new auth.users row with that address + the given
//      password, pre-confirmed (no verification email sent), with the
//      display name stored on the account itself.
//   4. Insert a row into hea_family_links connecting the parent's
//      user_id to the child's new user_id, so the parent's own session
//      can read/write the child's data going forward (enforced by RLS
//      on hea_profiles and every future health-data table).
//
// Deploy via the Supabase Dashboard (no CLI needed):
//   1. supabase.com/dashboard → your project → Edge Functions → Deploy a new function
//   2. Name it exactly: create-family-account
//   3. Paste this entire file's contents into the code editor
//   4. Deploy
//   5. Confirm SUPABASE_SERVICE_ROLE_KEY is available — Supabase sets this
//      automatically for every Edge Function, no extra secret needed.
// ══════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Synthetic login address — never emailed, never shown to the parent.
// Shape: <child name>.<relationship>.<guardian's real email, @ swapped
// for _at_>@amit-internal.local — so the address itself always shows,
// on sight, which real account created it and what the relationship was,
// under a domain Ryan doesn't need to own or configure since nothing is
// ever actually resolved against it. A random suffix guards against two
// same-named children under the same guardian colliding.
function slugPart(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || "x";
}
function makeSyntheticEmail(displayName: string, relationship: string, guardianEmail: string): string {
  const childSlug = slugPart(displayName);
  const relSlug = slugPart(relationship || "family");
  const guardianSlug = slugPart((guardianEmail || "unknown").replace("@", "_at_"));
  const suffix = crypto.randomUUID().split("-")[0];
  return `${childSlug}.${relSlug}.${guardianSlug}.${suffix}@amit-internal.local`;
}

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not signed in." }, 401, cors);

    const { password, display_name, relationship } = await req.json();

    if (!password || !display_name) {
      return json({ error: "password and display_name are required." }, 400, cors);
    }

    const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: guardian }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !guardian) {
      return json({ error: "Could not verify who's calling this." }, 401, cors);
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const email = makeSyntheticEmail(display_name, relationship, guardian.email || "");
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name },
    });
    if (createErr || !created?.user) {
      return json({ error: createErr?.message || "Could not create that account." }, 400, cors);
    }
    const childUserId = created.user.id;

    const { error: linkErr } = await adminClient.from("hea_family_links").insert({
      guardian_user_id: guardian.id,
      linked_user_id: childUserId,
      linked_display_name: display_name,
      relationship: relationship || "parent",
      active: true,
    });
    if (linkErr) {
      return json({ error: "Account created, but the family link failed: " + linkErr.message }, 400, cors);
    }

    return json({ success: true, child_user_id: childUserId, display_name }, 200, cors);
  } catch (e) {
    return json({ error: String(e) }, 500, cors);
  }
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
