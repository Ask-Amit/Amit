-- ══════════════════════════════════════════════
-- AmitBooks — the real, persistent, checkable Master Build Order. Global
-- (not book-scoped) since this tracks the product roadmap itself, not
-- any one book's data. Read by everyone using the app so the roadmap is
-- transparent; status updates allowed by any signed-in user since this
-- is a small single-developer tool right now, not sensitive financial
-- data — same trust model as the rest of this early-stage app.
-- ══════════════════════════════════════════════
create table if not exists amitbooks_roadmap (
  id uuid primary key default gen_random_uuid(),
  item_number integer not null,
  title text not null,
  category text,
  status text not null default 'not_started' check (status in ('not_started','in_progress','partial','done','blocked')),
  priority_tier integer not null default 5,
  blocked_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table amitbooks_roadmap enable row level security;
drop policy if exists "amitbooks_roadmap_read_all" on amitbooks_roadmap;
create policy "amitbooks_roadmap_read_all" on amitbooks_roadmap for select using (true);
drop policy if exists "amitbooks_roadmap_write_authenticated" on amitbooks_roadmap;
create policy "amitbooks_roadmap_write_authenticated" on amitbooks_roadmap for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

-- ── SEED: the real 45-item Master Build Order, reprioritized by actual
-- dependency rather than brainstorm order. Tier 1 = foundation, mostly
-- already real. Tier 2 = quick, high-leverage, buildable now with the
-- schema that already exists. Tier 3 = real new subsystems, no external
-- blocker. Tier 4 = needs an external account/API/decision Ryan has to
-- provide before real functionality is possible. Tier 5 = explicitly
-- held per Ryan's own standing decision (Tim's conversation) or blocked
-- on another Amit project existing first. Idempotent: safe to re-run —
-- clears and reloads every time rather than silently duplicating rows.
-- ══════════════════════════════════════════════
delete from amitbooks_roadmap;
insert into amitbooks_roadmap (item_number, title, category, status, priority_tier, blocked_reason) values
(1,'Core schema — books, chart_of_accounts, contacts, items, tags, invoices_bills, journal, documents, audit_log, fixed_assets','Core','done',1,null),
(4,'"Which book?" picker + real sign-in gate','Access','done',1,null),
(17,'Warranty tracking','Assets','done',1,null),
(18,'Service agreements','Contracts','done',1,null),
(27,'Purchase order system','Purchasing','done',1,null),
(34,'Mileage tracking','Assets','done',1,null),
(35,'Repairs / maintenance log','Assets','done',1,null),
(39,'Subscription billing','Billing','done',1,null),
(2,'Tax-form skeleton tables (sales_tax_jurisdictions, employees, contractors_1099)','Tax','partial',1,null),
(3,'book_members + roles, payroll/sensitive-data gating','Access','partial',1,null),
(29,'Quotes vs. estimates — clarify and build','Sales','not_started',2,null),
(9,'Cash vs. accrual basis setting per book','Core','not_started',2,null),
(20,'Classes & Locations tagging dimension','Setup','not_started',2,null),
(45,'Audit forensics — real query/reconstruction layer over audit_log','Audit','not_started',2,null),
(6,'Legacy import — full QuickBooks IIF + vendor-mapping into operational bills/invoices','Import','partial',2,'Journal CSV import exists (posts to ledger only) — does not yet create Bills/Invoices/Contacts records'),
(8,'Industry-aware bill categories — templates beyond construction','Setup','partial',2,'Construction/CSI template only so far'),
(28,'Inventory control — reorder points, COGS automation','Inventory','partial',2,'Movement ledger exists; no reorder points or COGS automation yet'),
(30,'Standard report suite — Cash Flow, AR/AP Aging, Sales Tax Liability, 1099 Summary','Reports','partial',2,'Trial Balance, P&L, Balance Sheet done — 4 of 7 reports remain'),
(42,'CapEx + investments','Assets','partial',2,'Investments table/screen exists; explicit CapEx tie-in to fixed_assets not built'),
(7,'Statement reconciliation — manual/CSV-based matching against bills on file','Banking','not_started',3,null),
(10,'Sales tax nexus tracking','Tax','not_started',3,null),
(14,'Customer financing / payment plans on receivables','Receivables','not_started',3,null),
(15,'Cash flow analysis + forecast engine','Reports','not_started',3,null),
(16,'Job costing per line item + percent-complete + AIA billing documents','Jobs','partial',3,'Tags/jobs exist; no percent-complete or AIA billing yet'),
(21,'Custom dashboards + personalized KPIs + report builder','Reports','not_started',3,null),
(26,'Amit''s Expense Claim Helper — plain-language IRS-aware guidance','AI','not_started',3,null),
(32,'CRM — lead/pipeline tracking, sales stages','CRM','partial',3,'Communication/activity log exists; no pipeline or lead stages'),
(38,'Revenue recognition engine','Accounting','not_started',3,null),
(40,'Milestone / progress payments','Billing','not_started',3,'Ties to job costing (item 16)'),
(23,'Excel sync + batch invoice/expense entry + backup/restore + guided onboarding wizard','Utility','not_started',3,'Four distinct sub-features bundled in the original spec'),
(5,'Bill capture + OCR + vendor auto-match','Capture','not_started',4,'Needs OCR engine decision (Claude Vision vs Google Vision) — open question in the spec'),
(12,'Hub integration — bills as calendar chips, jobs as pursuits','Integration','not_started',4,'Cross-app — needs Hub-side changes too'),
(13,'Amit Bookkeeper Mode / vendor memory / proactive notifications','AI','not_started',4,null),
(19,'Employee scheduling + self-service mobile timesheets','HR','not_started',4,null),
(22,'Workflow automation — user-defined "when X, do Y" rules','Automation','not_started',4,null),
(24,'AI auto-creates projects and allocates costs from bill patterns','AI','not_started',4,null),
(25,'Point of sale integration','Integration','not_started',4,'Needs a real POS partner/API'),
(31,'Employment management application — onboarding, benefits, PTO, reviews','HR','not_started',4,null),
(33,'Payment processor integration — Square, Stripe','Integration','not_started',4,'Needs real merchant account/API credentials'),
(36,'Cash App / Venmo / P2P payment integration','Integration','not_started',4,'Needs real API access; these platforms rarely offer one'),
(41,'Manufacturing job costing — activity-based costing + bill of materials','Jobs','not_started',4,'Second industry template, real new subsystem'),
(43,'GST / international tax-jurisdiction awareness','Tax','not_started',4,'Depends on nexus tracking (item 10) existing first'),
(11,'Trial balance / GL / entity-specific IRS form output','Reports','blocked',5,'Held until Tim''s chart-of-accounts conversation, per standing rule'),
(44,'Corporate tax output — 1120/1120-S/1065','Tax','blocked',5,'Held until Tim''s conversation, same as item 11'),
(37,'Estimating software tie-in (likely BOSStimator)','Integration','blocked',5,'Pending Ryan confirming this is BOSStimator, and BOSStimator existing to connect to');
