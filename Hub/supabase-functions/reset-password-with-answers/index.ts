// ══════════════════════════════════════════════
// Reset Password With Answers — step 2 of the no-email password reset
// flow (Ryan's direct instruction, 2026-09-08).
//
// Takes {email, answer_1, answer_2, new_password}. Re-computes the same
// salted SHA-256 hash the app used at signup (see AmitMobile.html's
// amHashRecoveryAnswer()) and compares against what's stored. Only if
// BOTH answers match does it actually reset the password — using
// admin.updateUserById(), which requires the service-role key and can
// only run server-side. Never reveals which specific answer was wrong,
// or whether the email exists at all, on failure.
//
// Deploy via the Supabase Dashboard (no CLI needed):
//   1. supabase.com/dashboard → your project → Edge Functions → Deploy a new function
//   2. Name it exactly: reset-password-with-answers
//   3. Paste this entire file's contents into the code editor
//   4. Deploy
// ══════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Must exactly match the client-side hashing in AmitMobile.html.
async function hashAnswer(answer: string, salt: string): Promise<string> {
  const normalized = answer.trim().toLowerCase();
  const data = new TextEncoder().encode(salt + ":" + normalized);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { email, answer_1, answer_2, new_password } = await req.json();
    if (!email || !answer_1 || !answer_2 || !new_password) {
      return json({ error: "Missing fields." }, 400, cors);
    }
    if (new_password.length < 6) {
      return json({ error: "Password must be at least 6 characters." }, 400, cors);
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let userId: string | null = null;
    let page = 1;
    while (!userId) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return json({ error: error.message }, 400, cors);
      const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (found) { userId = found.id; break; }
      if (data.users.length < 200) break;
      page++;
    }
    if (!userId) return json({ error: "Those answers don't match our records." }, 401, cors);

    const { data: rq, error: rqErr } = await adminClient
      .from("user_recovery_questions")
      .select("answer_1_hash, answer_2_hash")
      .eq("user_id", userId)
      .maybeSingle();
    if (rqErr || !rq) return json({ error: "Those answers don't match our records." }, 401, cors);

    // Stored hash format: "<salt>:<hash>" — see amHashRecoveryAnswer().
    const [salt1, hash1] = rq.answer_1_hash.split(":");
    const [salt2, hash2] = rq.answer_2_hash.split(":");
    const check1 = await hashAnswer(answer_1, salt1);
    const check2 = await hashAnswer(answer_2, salt2);
    if (check1 !== hash1 || check2 !== hash2) {
      return json({ error: "Those answers don't match our records." }, 401, cors);
    }

    const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, { password: new_password });
    if (updateErr) return json({ error: updateErr.message }, 400, cors);

    return json({ success: true }, 200, cors);
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
