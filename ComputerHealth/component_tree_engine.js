// Amit Computer Health — component drill-down tree engine
// Ryan's direct request 2026-07-17/18: one Computer gauge that drills into
// major components (CPU/GPU/Motherboard/RAM/Storage/Network/Software),
// each of which drills into category gauges (Temperature/Voltage/Clock/
// Power/Utilization/etc.), each of which drills into individual sensors,
// with a raw spreadsheet as the deepest layer. The tree shape itself comes
// from amit_component_registry (data-driven, so a second GPU or dual CPUs
// classify automatically instead of needing new JS code), and every
// composite score at every level uses the same formula: worst sub-score
// counts for 75% of the parent, second-worst for 10%, everything else
// averaged for the remaining 15% - "one failing part still means the
// whole thing is going to fail, no matter how good the rest are."

// ---- 1. Composite scoring formula (Ryan's exact spec, confirmed 2026-07-17) ----
function compositeScore(subScores) {
    const valid = subScores.filter(s => s !== null && s !== undefined && !isNaN(s));
    if (valid.length === 0) return null;
    const sorted = [...valid].sort((a, b) => a - b); // ascending: worst first
    if (sorted.length === 1) return round1(sorted[0]);
    if (sorted.length === 2) return round1(sorted[0] * 0.75 + sorted[1] * 0.25);
    const worst = sorted[0];
    const second = sorted[1];
    const rest = sorted.slice(2);
    const restAvg = rest.reduce((a, b) => a + b, 0) / rest.length;
    return round1(worst * 0.75 + second * 0.10 + restAvg * 0.15);
}
function round1(n) { return Math.round(n * 10) / 10; }

function gradeLetter(score) {
    if (score == null) return '—';
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 55) return 'C';
    if (score >= 35) return 'D';
    return 'F';
}

// ---- 2. Per-sensor health score (0-100) from a raw metric row + its known limit ----
// Reuses the same domain knowledge the existing report-card analysis uses
// (amit_hardware_specs for temps, category-specific rules for latency/
// queue length/etc.) rather than inventing a second scoring system.
function scoreSensor(row, limit, category) {
    const avg = row.avg_value, max = row.max_value;
    if (limit != null && (category === 'Temperature' || category === 'Power')) {
        // Distance below the redline, scaled: at or past limit = 0,
        // comfortably under (<=70% of limit) = 100, linear between.
        const frac = max / limit;
        if (frac >= 1) return 0;
        if (frac <= 0.70) return 100;
        return round1(100 - ((frac - 0.70) / 0.30) * 100);
    }
    if (category === 'Longevity' && row.metric_name && /percentage used/i.test(row.metric_name)) {
        // "Percentage Used" - value IS the used-up fraction (0-100).
        // Ryan's own example: 10% life left = F. remaining = 100 - used.
        const remaining = 100 - avg;
        return round1(Math.max(0, Math.min(100, remaining)));
    }
    if (category === 'Longevity' && row.metric_name && /^life$/i.test(row.metric_name)) {
        // Real bug caught live 2026-07-18 (Ryan, cross-checked against real
        // manufacturer lifespan data): unlike "Percentage Used", the "Life"
        // sensor LibreHardwareMonitor reports is ALREADY a remaining-life
        // percentage (100 = full life left), not a used-up fraction. Scoring
        // it the same way as Percentage Used inverted a healthy 100 into a
        // false 0 (100% "used") - exactly the false F Ryan caught on RAM
        // that was actually fine. Score it directly, no inversion.
        return round1(Math.max(0, Math.min(100, avg)));
    }
    if (category === 'Capacity' && /free space %/i.test(row.metric_name || '')) {
        return round1(Math.max(0, Math.min(100, avg)));
    }
    if (category === 'Performance' && /latency/i.test(row.metric_name || '')) {
        // ms latency - under 10ms excellent, over 30ms poor (SSD/NVMe context).
        if (avg <= 10) return 100;
        if (avg >= 30) return 0;
        return round1(100 - ((avg - 10) / 20) * 100);
    }
    // No known limit and no special rule - neutral/healthy by default
    // (matches the gauge dashboard's "no rated limit" = informational,
    // not a penalty).
    return 85;
}

// Real per-stick RAM health, from data that actually exists (Ryan's direct
// request 2026-07-18, after confirming DDR sticks report NO Power-On-Hours
// or Life sensor on this hardware - that telemetry genuinely doesn't exist
// for RAM the way it does for SSDs, so a fabricated "hours used" gauge
// would just be lying with a straight face). What every RAM stick DOES
// report is a set of timing values (CAS latency, refresh delays, etc.) -
// these are fixed by the stick's own SPD chip and should never drift
// during a session. Any nonzero stddev on a timing reading is a real
// signal-integrity/compatibility flag, not noise, so it becomes the
// stick's "Timing Stability" score - a synthetic gauge-worthy instance
// built from the raw stddev/avg ratio across every timing row for that
// physical stick, folded in alongside Capacity as the honest replacement
// for the lifespan gauge that can't be built from real sensors here.
function buildRamTimingStability(rawTimingRowsByTitle) {
    const out = {};
    Object.entries(rawTimingRowsByTitle).forEach(([title, rows]) => {
        let worstPenalty = 0;
        rows.forEach(r => {
            if (!r.avg_value) return;
            const driftPct = Math.abs(r.stddev_value / r.avg_value) * 100;
            worstPenalty = Math.max(worstPenalty, driftPct);
        });
        // Any real drift on a value that should be constant is treated
        // seriously - 1% drift already costs half the score, 2%+ is 0.
        const score = round1(Math.max(0, 100 - worstPenalty * 50));
        out[title] = score;
    });
    return out;
}

// ---- 3. Build the tree from a registry + a set of raw session rows ----
// registry: array of {raw_component, raw_metric_name, major_group, category, instance_label, gauge_worthy}
// rows: array of {component, metric_name, title, min_value, max_value, avg_value, stddev_value} for one session/event
// limitsLookup(majorGroup, category, title): optional fn returning a numeric limit or null
function buildComponentTree(registry, rows, limitsLookup) {
    const regIndex = new Map();
    registry.forEach(r => regIndex.set(r.raw_component + '|' + r.raw_metric_name, r));

    const unclassified = [];
    const tree = {}; // majorGroup -> category -> instanceLabel -> {row, reg, score}
    const ramTimingRowsByTitle = {}; // title -> [raw timing rows], for the synthetic stability score below

    rows.forEach(row => {
        const key = row.component + '|' + row.metric_name;
        const reg = regIndex.get(key);
        if (!reg) {
            unclassified.push({ component: row.component, metric_name: row.metric_name });
            return;
        }
        const limit = limitsLookup ? limitsLookup(reg.major_group, reg.category, reg.instance_label) : null;
        const score = scoreSensor({ ...row, metric_name: reg.raw_metric_name }, limit, reg.category);

        // Multiple physical instances (two RAM sticks, two drives) can
        // share the same raw metric_name ("Capacity" on stick #2 and #3
        // alike) - when the row carries a title that distinguishes them,
        // fold it into the instance key for RAM/Storage so each physical
        // device gets its own gauge instead of silently overwriting the
        // other's reading under one shared key.
        const needsTitleSplit = row.title && (reg.major_group === 'RAM' || reg.major_group === 'Storage');
        const instanceKey = needsTitleSplit ? reg.instance_label + ' — ' + row.title : reg.instance_label;

        if (reg.major_group === 'RAM' && reg.category === 'Timing' && row.title) {
            (ramTimingRowsByTitle[row.title] = ramTimingRowsByTitle[row.title] || []).push(row);
        }

        if (!tree[reg.major_group]) tree[reg.major_group] = {};
        if (!tree[reg.major_group][reg.category]) tree[reg.major_group][reg.category] = {};
        // Multiple raw rows can collapse to the same instance (Core #1 /
        // Core #1 (Effective) / Core #1 (SMU)) - only the gauge-worthy one
        // becomes the instance's score; others are kept for the raw
        // spreadsheet view only, not double-counted in aggregation.
        if (reg.gauge_worthy || !tree[reg.major_group][reg.category][instanceKey]) {
            tree[reg.major_group][reg.category][instanceKey] = {
                row, reg, score, gaugeWorthy: reg.gauge_worthy
            };
        }
    });

    // Fold the synthetic per-stick Timing Stability score in as its own
    // gauge-worthy instance, alongside the raw (non-gauge-worthy) timing
    // rows already sitting there for the spreadsheet view.
    const stabilityScores = buildRamTimingStability(ramTimingRowsByTitle);
    Object.entries(stabilityScores).forEach(([title, score]) => {
        if (!tree.RAM) tree.RAM = {};
        if (!tree.RAM.Timing) tree.RAM.Timing = {};
        tree.RAM.Timing['Timing Stability — ' + title] = {
            row: { min_value: score, max_value: score, avg_value: score, title },
            reg: { instance_label: 'Timing Stability', category: 'Timing' },
            score, gaugeWorthy: true
        };
    });

    // Roll instances up into category scores (75/10/15 across gauge-worthy instances only)
    const categoryScores = {};
    Object.entries(tree).forEach(([major, cats]) => {
        categoryScores[major] = {};
        Object.entries(cats).forEach(([cat, instances]) => {
            const scores = Object.values(instances).filter(i => i.gaugeWorthy).map(i => i.score);
            categoryScores[major][cat] = compositeScore(scores);
        });
    });

    // Roll categories up into major-group scores
    const majorScores = {};
    Object.entries(categoryScores).forEach(([major, cats]) => {
        majorScores[major] = compositeScore(Object.values(cats));
    });

    // Roll major groups up into the single Computer composite
    const computerScore = compositeScore(Object.values(majorScores));

    return { tree, categoryScores, majorScores, computerScore, unclassified };
}

if (typeof module !== 'undefined') {
    module.exports = { compositeScore, gradeLetter, scoreSensor, buildComponentTree };
}
