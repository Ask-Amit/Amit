// ══════════════════════════════════════════════
// Hub — Get Mobile Link (for Amit Mobile's "Connect Your Phone" QR flow)
//
// Solves the exact same problem AmitBooks already solved for AmitScan:
// getting a phone signed in with zero retyping, for the common case where
// the phone and the screen showing the QR code are in the same room.
// Reuses Supabase's OWN magic-link mechanism — the same one that already
// emails a sign-in link — except instead of emailing it, we hand the
// generated link straight back to the caller (who's already signed in on
// the Hub) to render as a QR code. Scanning it opens Amit Mobile already
// authenticated, no different from clicking an emailed link, just
// delivered by camera instead of by inbox.
//
// This has to run server-side because generating that link requires the
// service-role key, which must never reach the browser.
//
// IMPORTANT — Redirect URL allowlist (this is the leading suspect for
// the "scanning the QR doesn't actually sign the phone in" bug, 2026-09-05):
// Supabase's Auth settings only honor `redirectTo` when that exact URL (or
// a matching wildcard) is present in Authentication → URL Configuration →
// Redirect URLs. If AMIT_MOBILE_URL below is not in that allowlist,
// Supabase silently ignores redirectTo and sends the browser to the
// project's default Site URL instead — which never processes the
// #access_token hash, so the phone lands looking exactly like a fresh,
// signed-out visitor. Before assuming any code is broken, confirm this
// exact URL (and the old Hub URL, since AmitBooks' proven-working
// AMITSCAN_URL is a different path) is listed there, or add a wildcard
// covering `https://ask-amit.github.io/Amit/**`.
//
// Deploy via the Supabase Dashboard (no CLI needed):
//   1. supabase.com/dashboard → your project → Edge Functions → Deploy a new function
//   2. Name it exactly: get-mobile-link
//   3. Paste this entire file's contents into the code editor
//   4. Deploy
// ══════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Points at Amit Mobile, not the Hub — "Connect Your Phone" exists to get
// someone into Amit Mobile (the phone-first dashboard), not just reopen
// the Hub on a small screen. Changed 2026-09-05.
const AMIT_MOBILE_URL = "https://ask-amit.github.io/Amit/AmitMobile/AmitMobile.html";

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not signed in." }, 401, cors);

    // Client scoped to the CALLER's own JWT — used only to find out who
    // they are, never to write anything.
    const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !caller || !caller.email) {
      return json({ error: "Could not verify who's calling this." }, 401, cors);
    }

    // Service-role client — the only place this key is ever touched.
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: caller.email,
      options: { redirectTo: AMIT_MOBILE_URL },
    });
    if (error || !data?.properties?.action_link) {
      return json({ error: error?.message || "Could not generate a link." }, 400, cors);
    }

    return json({ link: data.properties.action_link }, 200, cors);
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
