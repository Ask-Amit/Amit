// ══════════════════════════════════════════════
// Get Recovery Questions — step 1 of the no-email password reset flow
// (Ryan's direct instruction, 2026-09-08, replacing the magic-link/OTP
// sign-in that proved unreliable on iOS installed home-screen apps).
//
// Takes a plain email address (the person isn't signed in yet — that's
// the whole point), looks them up, and returns ONLY their two recovery
// question TEXTS (never the answers, never hashed or otherwise) so the
// app can show "what's your recovery question 1" before they type an
// answer. Runs server-side because looking up another user by email
// requires the service-role key, which must never reach the browser.
//
// Deploy via the Supabase Dashboard (no CLI needed):
//   1. supabase.com/dashboard → your project → Edge Functions → Deploy a new function
//   2. Name it exactly: get-recovery-questions
//   3. Paste this entire file's contents into the code editor
//   4. Deploy
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
    const { email } = await req.json();
    if (!email) return json({ error: "Email required." }, 400, cors);

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Find the user by email — admin.listUsers doesn't filter server-side
    // by email directly in all versions, so page through until found.
    // Fine at this project's real scale; revisit if the user base grows
    // large enough for this to matter.
    let userId: string | null = null;
    let page = 1;
    while (!userId) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return json({ error: error.message }, 400, cors);
      const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (found) { userId = found.id; break; }
      if (data.users.length < 200) break; // no more pages
      page++;
    }
    // Deliberately vague on failure — never reveal whether an email
    // exists in the system to an unauthenticated caller.
    if (!userId) return json({ error: "No account found, or no recovery questions set for it." }, 404, cors);

    const { data: rq, error: rqErr } = await adminClient
      .from("user_recovery_questions")
      .select("question_1, question_2, password_hint")
      .eq("user_id", userId)
      .maybeSingle();
    if (rqErr || !rq) return json({ error: "No account found, or no recovery questions set for it." }, 404, cors);

    return json({ question_1: rq.question_1, question_2: rq.question_2, password_hint: rq.password_hint || null }, 200, cors);
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
