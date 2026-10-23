/* amit_data_tools.js  v1.01  -  how Amit looks at a person's OWN records, in any app, on that person's behalf.

   v1.01 (Ryan, 2026-10-23): the gate is not per app. db.query asks for specific records of any table; it runs HERE, signed in as the person, so the app's own row security decides what comes
   back. Nothing is written per app. The named reports below are optional shortcuts for things that need adding up (a balance sheet).

   HOW IT WORKS (Ryan's rules, 2026-10-23): Amit holds no one's login and the team never has anyone's credentials. When a person asks Amit about their own information
   (their books, their Hub), Amit asks for a named report. THIS file runs in that person's own browser, signed in as that person, so the database's own row
   security decides what it can see (a book member sees that book; an accountant the owner added sees it too; a stranger sees nothing). The result goes back
   through cha_data_fulfil, Amit reads it once, and it is wiped. Nothing here is a way around any app's own security: if the person is not signed in, or lacks the
   role, the report simply comes back empty or "denied", and Amit says what is needed.

   USE: <script src="../amit_data_tools.js"></script>  ...  AmitData.fulfilPending(db)   (the chat engine calls it while a question is waiting)
   TO ADD AN APP: add its reports to TOOLS and to AmitChat\answerer\data_manifest.json (a test checks the two lists match). Never add a report that returns
   passwords, PINs, SSNs, payroll or anything the app itself keeps behind a PIN. */
(function (w) {
  'use strict';
  const MAX_ROWS = 50000, MAX_CHARS = 150000;
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = () => ymd(new Date());
  const num = v => { const n = Number(v); return isFinite(n) ? n : 0; };
  const round2 = n => Math.round(n * 100) / 100;
  const isDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const isUuid = s => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  class Denied extends Error {}

  /* never let these through, whatever a report returns: keys that look like secrets, and anything shaped like a Social Security number */
  const SECRET_KEY = /(ssn|social_?sec|tax_?id|\bein\b|password|passphrase|\bpin\b|secret|token|api_?key|encrypted|\biv\b|salt)/i;
  function clean(v) {
    if (Array.isArray(v)) return v.map(clean);
    if (v && typeof v === 'object') { const o = {}; Object.keys(v).forEach(k => { if (!SECRET_KEY.test(k)) o[k] = clean(v[k]); }); return o; }
    if (typeof v === 'string') return v.replace(/\b(\d{3})[- ]?(\d{2})[- ]?(\d{4})\b/g, '***-**-$3');
    return v;
  }

  async function myBookRole(db, user, bookId) {
    if (!isUuid(bookId)) throw new Denied('That is not a valid book.');
    const r = await db.from('book_members').select('role,can_view_payroll,books(id,name,entity_type,accounting_basis)').eq('book_id', bookId).eq('user_id', user.id).maybeSingle();
    if (r.error) throw new Error(r.error.message);
    if (!r.data) throw new Denied('You are not a member of that book.');
    return r.data;
  }
  async function pageAll(build) {            // PostgREST returns 1000 rows at a time
    const out = []; for (let from = 0; from < MAX_ROWS; from += 1000) {
      const r = await build().range(from, from + 999); if (r.error) throw new Error(r.error.message);
      out.push.apply(out, r.data || []); if (!r.data || r.data.length < 1000) return out;
    }
    throw new Error('That book has too many entries to read in one go. Ask for a shorter date range.');
  }
  const TYPE = t => { t = String(t || '').toLowerCase(); if (/^asset/.test(t)) return 'asset'; if (/^liab/.test(t)) return 'liability'; if (/^(equity|capital)/.test(t)) return 'equity'; if (/^(income|revenue|sales)/.test(t)) return 'income'; if (/^(expense|cogs|cost)/.test(t)) return 'expense'; return 'other'; };

  async function ledger(db, bookId, from, to) {      // every account in the book with its debits and credits (posted entries only) in the date window
    const accts = await pageAll(() => db.from('chart_of_accounts').select('id,account_number,account_name,account_type').eq('book_id', bookId).order('account_number', { ascending: true }));
    const lines = await pageAll(() => {
      let q = db.from('journal_lines').select('account_id,debit,credit,journal_entries!inner(book_id,entry_date,status)').eq('journal_entries.book_id', bookId).eq('journal_entries.status', 'posted');
      if (to) q = q.lte('journal_entries.entry_date', to); if (from) q = q.gte('journal_entries.entry_date', from); return q;
    });
    const sums = {}; lines.forEach(l => { const s = sums[l.account_id] || (sums[l.account_id] = { d: 0, c: 0 }); s.d += num(l.debit); s.c += num(l.credit); });
    return accts.map(a => { const s = sums[a.id] || { d: 0, c: 0 }; return { number: a.account_number || '', name: a.account_name, type: TYPE(a.account_type), debit: round2(s.d), credit: round2(s.c) }; });
  }

  /* ---- the generic tool: any table, any filters, read only. Checked again here even though the answering side checks too. ---- */
  const DENY_TABLE = /^(cha_|pg_)|^(amit_pin_encrypted_fields|user_recovery_questions|amit_coder_credentials)$/;
  const IDENT = /^[a-z_][a-z0-9_]*$/;
  const OPS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in'];
  const scalar = v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
  async function dbQuery(db, user, p) {
    const table = String(p.table || '');
    if (!IDENT.test(table) || DENY_TABLE.test(table)) throw new Denied('That information is not available.');
    const asked = Array.isArray(p.columns) ? p.columns.map(String).filter(c => IDENT.test(c)).slice(0, 40) : [];
    const cols = asked.filter(c => !SECRET_KEY.test(c)), dropped = asked.filter(c => SECRET_KEY.test(c));
    if (!cols.length) throw new Error('No readable columns were asked for.');
    const filters = Array.isArray(p.filters) ? p.filters.slice(0, 8) : [];
    let q = db.from(table).select(cols.join(','));
    for (const f of filters) {
      if (!Array.isArray(f) || f.length < 3) throw new Error('A filter must be [column, operator, value].');
      const col = String(f[0]), op = String(f[1]), val = f[2];
      if (!IDENT.test(col) || OPS.indexOf(op) < 0) throw new Error('That filter is not allowed.');
      if (op === 'in') { if (!Array.isArray(val) || val.length > 50 || !val.every(scalar)) throw new Error('"in" needs a short list.'); q = q.in(col, val); }
      else if (op === 'is') { const v = String(val).toLowerCase(); if (['null', 'true', 'false'].indexOf(v) < 0) throw new Error('"is" needs null, true or false.'); q = q.is(col, v === 'null' ? null : v === 'true'); }
      else { if (!scalar(val)) throw new Error('A filter value must be text, a number or true/false.'); q = q[op](col, val); }
    }
    if (p.order && IDENT.test(String(p.order.col || ''))) q = q.order(String(p.order.col), { ascending: String(p.order.dir || 'asc').toLowerCase() !== 'desc' });
    const limit = Math.min(Math.max(parseInt(p.limit, 10) || 100, 1), 200);
    const r = await q.limit(limit + 1);
    if (r.error) throw new Error(r.error.message);
    const rows = r.data || [];
    return { table, columns: cols, columns_left_out_for_safety: dropped.length ? dropped : undefined, count: Math.min(rows.length, limit), more_records_exist: rows.length > limit, rows: rows.slice(0, limit) };
  }

  const TOOLS = {
    db: { query: dbQuery },
    hub: {
      pursuits: async (db, user, p) => {
        const r = await db.from('hub_entries').select('title,due_date,priority,purpose,focus,starred,notes').eq('user_id', user.id).eq('kind', 'pursuit').eq('done', false).order('due_date', { ascending: true, nullsFirst: false }).limit(Math.min(Math.max(parseInt(p.limit, 10) || 40, 1), 100));
        if (r.error) throw new Error(r.error.message);
        return { count: (r.data || []).length, pursuits: (r.data || []).map(x => Object.assign({}, x, { notes: x.notes ? String(x.notes).slice(0, 300) : null })) };
      },
      memories: async (db, user, p) => {
        const r = await db.from('hub_entries').select('title,notes,due_date,completed_date,purpose,focus').eq('user_id', user.id).eq('kind', 'memory').order('created_at', { ascending: false }).limit(Math.min(Math.max(parseInt(p.limit, 10) || 20, 1), 60));
        if (r.error) throw new Error(r.error.message);
        return { count: (r.data || []).length, memories: (r.data || []).map(x => Object.assign({}, x, { notes: x.notes ? String(x.notes).slice(0, 400) : null })) };
      }
    },
    books: {
      list: async (db, user) => {
        const r = await db.from('book_members').select('role,books(id,name,entity_type,accounting_basis)').eq('user_id', user.id);
        if (r.error) throw new Error(r.error.message);
        return { books: (r.data || []).filter(x => x.books).map(x => ({ book_id: x.books.id, name: x.books.name, entity_type: x.books.entity_type, accounting_basis: x.books.accounting_basis, your_role: x.role })) };
      },
      trial_balance: async (db, user, p) => {
        const m = await myBookRole(db, user, p.book_id); const asOf = isDate(p.as_of) ? p.as_of : today();
        const rows = (await ledger(db, p.book_id, null, asOf)).filter(a => a.debit || a.credit).map(a => Object.assign({}, a, { balance: round2(a.debit - a.credit) }));
        return { book: m.books.name, as_of: asOf, basis: m.books.accounting_basis, accounts: rows, total_debits: round2(rows.reduce((s, a) => s + a.debit, 0)), total_credits: round2(rows.reduce((s, a) => s + a.credit, 0)) };
      },
      balance_sheet: async (db, user, p) => {
        const m = await myBookRole(db, user, p.book_id); const asOf = isDate(p.as_of) ? p.as_of : today();
        const all = await ledger(db, p.book_id, null, asOf);
        const grp = t => all.filter(a => a.type === t && (a.debit || a.credit));
        const assets = grp('asset').map(a => ({ number: a.number, name: a.name, amount: round2(a.debit - a.credit) }));
        const liabilities = grp('liability').map(a => ({ number: a.number, name: a.name, amount: round2(a.credit - a.debit) }));
        const equity = grp('equity').map(a => ({ number: a.number, name: a.name, amount: round2(a.credit - a.debit) }));
        const income = grp('income').reduce((s, a) => s + a.credit - a.debit, 0), expense = grp('expense').reduce((s, a) => s + a.debit - a.credit, 0);
        const earnings = round2(income - expense);
        const tA = round2(assets.reduce((s, a) => s + a.amount, 0)), tL = round2(liabilities.reduce((s, a) => s + a.amount, 0)), tE = round2(equity.reduce((s, a) => s + a.amount, 0) + earnings);
        const other = grp('other').map(a => ({ number: a.number, name: a.name, debit: a.debit, credit: a.credit }));
        return { book: m.books.name, as_of: asOf, basis: m.books.accounting_basis, assets, total_assets: tA, liabilities, total_liabilities: tL, equity, current_earnings_included_in_equity: earnings, total_equity: tE,
                 total_liabilities_and_equity: round2(tL + tE), balanced: Math.abs(tA - round2(tL + tE)) < 0.01, accounts_with_unrecognised_type: other };
      },
      profit_and_loss: async (db, user, p) => {
        const m = await myBookRole(db, user, p.book_id); const to = isDate(p.to) ? p.to : today(), from = isDate(p.from) ? p.from : to.slice(0, 4) + '-01-01';
        const all = await ledger(db, p.book_id, from, to);
        const income = all.filter(a => a.type === 'income' && (a.debit || a.credit)).map(a => ({ number: a.number, name: a.name, amount: round2(a.credit - a.debit) }));
        const expenses = all.filter(a => a.type === 'expense' && (a.debit || a.credit)).map(a => ({ number: a.number, name: a.name, amount: round2(a.debit - a.credit) }));
        const tI = round2(income.reduce((s, a) => s + a.amount, 0)), tX = round2(expenses.reduce((s, a) => s + a.amount, 0));
        return { book: m.books.name, from, to, basis: m.books.accounting_basis, income, total_income: tI, expenses, total_expenses: tX, net_income: round2(tI - tX) };
      }
    }
  };

  const AmitData = { version: '1.01', tools: TOOLS };
  AmitData.manifest = function () { const o = []; Object.keys(TOOLS).forEach(a => Object.keys(TOOLS[a]).forEach(r => o.push(a + '.' + r))); return o; };

  /* run one report as the signed-in person. Returns { status: 'ready', result } or { status: 'denied' | 'failed', note } */
  AmitData.run = async function (db, user, app, report, params) {
    if (!db || !user) return { status: 'denied', note: 'You are not signed in.' };
    const fn = TOOLS[app] && TOOLS[app][report]; if (!fn) return { status: 'failed', note: 'That report is not available.' };
    try {
      let result = clean(await fn(db, user, params || {}));
      let text = JSON.stringify(result); if (text.length > MAX_CHARS) { result = { note: 'The report was too large to send in full.', truncated: true, preview: text.slice(0, MAX_CHARS - 2000) }; }
      return { status: 'ready', result };
    } catch (e) { return e instanceof Denied ? { status: 'denied', note: e.message } : { status: 'failed', note: 'The report could not be read: ' + String(e && e.message || e).slice(0, 160) }; }
  };

  /* run whatever Amit has asked for on behalf of this person and hand the results back; returns how many were handled */
  let busy = false;
  AmitData.fulfilPending = async function (db) {
    if (busy || !db) return 0; busy = true;
    try {
      const u = await db.auth.getUser(); const user = u && u.data && u.data.user; if (!user) return 0;
      const p = await db.rpc('cha_data_pending'); if (p.error || !Array.isArray(p.data) || !p.data.length) return 0;
      let n = 0;
      for (const rq of p.data) {
        const o = await AmitData.run(db, user, rq.app, rq.report, rq.params);
        await db.rpc('cha_data_fulfil', { p_req: rq.id, p_status: o.status, p_result: o.status === 'ready' ? o.result : null, p_note: o.note || null }); n++;
      }
      return n;
    } catch (e) { return 0; } finally { busy = false; }
  };
  w.AmitData = AmitData;
})(window);
