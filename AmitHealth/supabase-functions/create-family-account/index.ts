// ══════════════════════════════════════════════
// Amit Health — Create Family Account (password-based, no email needed)
//
// REVISED 2026-09-19: this function now does ONLY account creation and
// the family link — nothing health-specific. Health-specific setup
// (biometrics, goals) happens later, inside Amit Health itself, once
// this account already exists. Account/family creation belongs at the
// Hub level (About Me), not inside any one app.
//
// Solves the real gap: a parent adding a child to Amit shouldn't need
// the child to have their own real, working email address. Magic-link
// sign-in (used everywhere else in Amit) requires a real inbox to click
// a link from — a young child usually doesn't have one. This creates a
// REAL Supabase login for the child directly, with a password the
// parent sets on their behalf, fully activated immediately — no email
// sent, no magic link needed until the child adds their own real email
// later ("graduation" — zero data migration, since everything was
// already tied to this same login ID).
//
// This does NOT replace magic-link sign-in for anyone else. Both
// methods exist side by side in the same Supabase project.
//
// Flow:
//   1. Verify the caller is signed in (this is the parent/guardian).
//   2. Create a brand-new auth.users row with the given email +
//      password, pre-confirmed (no verification email sent), with the
//      display name stored on the account itself.
//   3. Insert a row into Hea_Family_Links connecting the parent's
//      user_id to the child's new user_id, so the parent's own session
//      can read/write the child's data going forward (enforced by RLS
//      on Hea_Profiles and every future health-data table).
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

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not signed in." }, 401, cors);

    const { email, password, display_name, relationship } = await req.json();

    if (!email || !password || !display_name) {
      return json({ error: "email, password, and display_name are required." }, 400, cors);
    }

    const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: guardian }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !guardian) {
      return json({ error: "Could not verify who's calling this." }, 401, cors);
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

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
