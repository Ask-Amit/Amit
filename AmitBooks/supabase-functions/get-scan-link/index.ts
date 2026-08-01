// ══════════════════════════════════════════════
// AmitBooks/Hub — Get Scan Link (for the "Connect Scan" QR flow)
//
// Solves: getting a phone signed into AmitScan with zero typing and zero
// SMS cost, for the common case where the phone and the screen showing the
// QR code are in the same room. Reuses Supabase's OWN magic-link
// mechanism — the same one that already emails a sign-in link — except
// instead of emailing it, we hand the generated link straight back to the
// caller (who's already signed in) to render as a QR code. Scanning it
// opens AmitScan already authenticated, no different from clicking an
// emailed link, just delivered by camera instead of by inbox.
//
// This has to run server-side because generating that link requires the
// service-role key, which must never reach the browser.
//
// Deploy via the Supabase Dashboard (no CLI needed):
//   1. supabase.com/dashboard → your project → Edge Functions → Deploy a new function
//   2. Name it exactly: get-scan-link
//   3. Paste this entire file's contents into the code editor
//   4. Deploy
// ══════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AMITSCAN_URL = "https://ask-amit.github.io/Amit/AmitBooks/AmitScan/AmitScan.html";

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
      options: { redirectTo: AMITSCAN_URL },
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
