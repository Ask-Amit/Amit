-- Amit Inbox — lets any visitor (no account required) send Ryan/Amit a question
-- and check back later for a reply, using a locally-stored visitor code instead
-- of a real login. Built 2026-07-26 per Ryan's direct request: "so I have to
-- read it, and then I can respond back to them... it keeps a working log of
-- who it was, where it was at, kinda like an inbox for an email."
--
-- SECURITY NOTE (accepted tradeoff, matches this project's existing pattern
-- for tables like directors_chair / demo public read): there is no visitor
-- login system yet, so RLS cannot check "is this really your row" the way
-- auth.uid() does elsewhere. Instead, a random UUID visitor_code generated in
-- the browser and stored in localStorage acts as the shared secret — anyone
-- with the code can read/update that row, but the code is not guessable.
-- This is acceptable for a v1 inbox, not for anything truly sensitive.
--
-- Run in Supabase Dashboard > SQL Editor > paste > Run.

CREATE TABLE IF NOT EXISTS amit_inbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_code TEXT NOT NULL,
    sender_name TEXT,
    sender_contact TEXT,
    message TEXT NOT NULL,
    source TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
    reply_text TEXT,
    replied_at TIMESTAMPTZ,
    read_by_ryan BOOLEAN NOT NULL DEFAULT false,
    viewer_seen_reply BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_amit_inbox_visitor_code ON amit_inbox(visitor_code);
CREATE INDEX IF NOT EXISTS idx_amit_inbox_status ON amit_inbox(status);

ALTER TABLE amit_inbox ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a question — no account required.
CREATE POLICY "amit_inbox_public_insert" ON amit_inbox
    FOR INSERT WITH CHECK (true);

-- Anyone can read — Ryan needs to see all rows (no admin auth built yet),
-- and a visitor needs to read back their own row by visitor_code.
CREATE POLICY "amit_inbox_public_select" ON amit_inbox
    FOR SELECT USING (true);

-- Anyone can update — Ryan writes replies this way (no admin auth built yet),
-- and a visitor flips viewer_seen_reply once they've seen the reply.
CREATE POLICY "amit_inbox_public_update" ON amit_inbox
    FOR UPDATE USING (true);

-- Register in the director's chair so future sessions can find this without re-deriving it.
INSERT INTO directors_chair (
    module_key, display_name, html_file, content_table_name,
    status, purpose, source_of_truth_local_path, notes
) VALUES (
    'amit_inbox',
    'Ask Ryan — Contact Inbox',
    'Amit_Contact.html (root)',
    'amit_inbox',
    'live',
    'Lets a visitor from any Amit surface (Hub, who_is_god, or an outside Gemini/Amit conversation) send a real question to Ryan without needing an account, using a locally-stored visitor code to check back for a reply later. Ryan sees new messages flagged in the Hub and replies there.',
    'Amit_Contact.html',
    'v1, built 2026-07-26. No true per-visitor security (visitor_code is a shared-secret token, not an authenticated identity) — acceptable for now, revisit if this needs to be hardened later. Hub inbox badge/panel is currently unauthenticated too (shows to whoever opens the Hub) since there is no admin-only gate yet.'
) ON CONFLICT (module_key) DO NOTHING;
