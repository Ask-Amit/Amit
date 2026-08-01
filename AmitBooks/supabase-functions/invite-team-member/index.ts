// ══════════════════════════════════════════════
// AmitBooks — Invite Team Member by Email
//
// Solves the real gap: a client-side page can't look up or invite a
// user by email — that needs elevated (service-role) access, which must
// never touch the browser. This function runs server-side on Supabase's
// own infrastructure, holds the service-role key safely (as a Supabase
// secret, never shipped in AmitBooks.html), and sends the invite through
// Supabase's OWN existing email pipeline — the same one that already
// sends magic-link sign-in emails today. No new email service needed.
//
// Flow:
//   1. Verify the caller is signed in and actually owns the book.
//   2. Ask Supabase Auth to invite the email (creates a pending user if
//      they don't have an account yet, sends Supabase's built-in invite
//      email; if they already have an account, this looks them up
//      instead of erroring).
//   3. Insert (or update) the book_members row with the resolved user's
//      real id and the requested role.
//
// Deploy via the Supabase Dashboard (no CLI needed):
//   1. supabase.com/dashboard → your project → Edge Functions → Deploy a new function
//   2. Name it exactly: invite-team-member
//   3. Paste this entire file's contents into the code editor
//   4. Deploy
//   5. Confirm SUPABASE_SERVICE_ROLE_KEY is available — Supabase sets this
//      automatically for every Edge Function, no extra secret needed.
// ══════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  // CORS — AmitBooks calls this from the browser directly.
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Not signed in." }, 401, cors);
    }

    const { email, book_id, role, can_view_payroll } = await req.json();
    if (!email || !book_id || !role) {
      return json({ error: "email, book_id, and role are required." }, 400, cors);
    }

    // Client scoped to the CALLER's own JWT — used only to verify who
    // they are and that they actually own this book, never to write.
    const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !caller) {
      return json({ error: "Could not verify who's calling this." }, 401, cors);
    }

    // Service-role client — the only place in this whole system that
    // ever touches this key. Never exposed to any browser.
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: book, error: bookErr } = await adminClient
      .from("books")
      .select("id,user_id,name")
      .eq("id", book_id)
      .single();
    if (bookErr || !book) return json({ error: "That book doesn't exist." }, 404, cors);
    if (book.user_id !== caller.id) {
      return json({ error: "Only the book's owner can invite team members." }, 403, cors);
    }

    // Ask Supabase Auth to invite this email — creates a pending user and
    // sends Supabase's own invite email (same pipeline as magic-link
    // sign-in) if they don't have an account yet.
    let targetUserId: string | null = null;
    const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { invited_to_book: book.name },
    });
    if (inviteErr) {
      // Most common real case: they already have an account. Look them
      // up instead of treating that as a failure.
      if (inviteErr.message?.toLowerCase().includes("already") || inviteErr.status === 422) {
        const { data: existingList } = await adminClient.auth.admin.listUsers();
        const existing = existingList?.users?.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );
        if (existing) targetUserId = existing.id;
      }
      if (!targetUserId) {
        return json({ error: inviteErr.message || "Could not send the invite." }, 400, cors);
      }
    } else {
      targetUserId = inviteData.user.id;
    }

    // Add (or update) their row on this book's team — real membership,
    // enforced the same way as every other row in AmitBooks.
    const { error: memberErr } = await adminClient
      .from("book_members")
      .upsert(
        { book_id, user_id: targetUserId, role, can_view_payroll: !!can_view_payroll },
        { onConflict: "book_id,user_id" }
      );
    if (memberErr) return json({ error: memberErr.message }, 400, cors);

    return json({ success: true, invited_email: email, user_id: targetUserId }, 200, cors);
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
