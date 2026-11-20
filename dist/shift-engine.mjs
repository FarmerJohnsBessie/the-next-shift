// The Next Shift — deterministic game engine. Pure functions, no randomness:
// the same rulebook and the same decisions always produce the same warehouse.
import { METERS, METER_IDS, START, WIN_LINE, WEEKS_TOTAL, GROWTH, DIALS, WEEKS, EVENTS, RIPPLES, ENDINGS, PEOPLE, ALIGNED } from './shift-content.mjs';

export const VERSION = 5;
const clamp = (n) => Math.max(0, Math.min(100, n));
const clone = (x) => (typeof structuredClone === 'function' ? structuredClone(x) : JSON.parse(JSON.stringify(x)));
export const dial = (id) => DIALS.find((d) => d.id === id);
export const option = (dialId, optId) => dial(dialId)?.options.find((o) => o.id === optId);

export function normalizePolicy(p) {
  const out = {};
  for (const d of DIALS) out[d.id] = d.options.some((o) => o.id === p?.[d.id]) ? p[d.id] : d.options[1].id;
  if (out.targets === 'ranking' && out.tracking !== 'individual') out.targets = 'team';
  return out;
}
export function optionLocked(policy, dialId, optId) {
  const o = option(dialId, optId);
  if (!o?.needs) return null;
  return Object.entries(o.needs).every(([k, v]) => policy[k] === v) ? null : o.lock;
}

// Per-week effects of a rulebook, itemised so every change can be explained.
export function weeklyItems(policy, flags = {}) {
  const items = DIALS.map((d) => {
    const o = option(d.id, policy[d.id]);
    return { kind: 'rule', source: `Rulebook · ${d.name}`, label: o.name, fx: { ...o.fx } };
  });
  items.push({ kind: 'growth', source: 'Demand', label: GROWTH.label, fx: { ...GROWTH.fx }, why: GROWTH.why });
  for (const r of RIPPLES) if (flags[r.flag]) items.push({ kind: 'ripple', source: 'Still felt', label: r.label, fx: { ...r.fx } });
  return items;
}
export function sumFx(items) {
  const t = Object.fromEntries(METER_IDS.map((m) => [m, 0]));
  for (const i of items) for (const [k, v] of Object.entries(i.fx)) t[k] += v;
  return t;
}
export const forecast = (policy) => sumFx(weeklyItems(normalizePolicy(policy)));

export function newRun(policy) {
  const p = normalizePolicy(policy);
  const s = {
    v: VERSION,
    week: 1,
    slot: 0,
    phase: 'event',
    policy: p,
    startPolicy: { ...p },
    meters: Object.fromEntries(METER_IDS.map((m) => [m, START])),
    weekStart: null,
    flags: { everIndividual: p.tracking === 'individual' },
    log: [],
    history: [],
    collapse: null,
    ending: null,
    policyChanges: [],
  };
  s.weekStart = { ...s.meters };
  s.history.push({ week: 0, meters: { ...s.meters } });
  enterEvent(s);
  return s;
}

export function eventIdFor(s) {
  const w = WEEKS[s.week - 1];
  if (!w) return null;
  return w.slots[s.slot].find((id) => !EVENTS[id].when || EVENTS[id].when(s)) ?? null;
}
export function currentEvent(s) {
  if (s.phase !== 'event' && s.phase !== 'outcome') return null;
  const id = s.phase === 'outcome' ? s.lastOutcome.eventId : eventIdFor(s);
  const e = EVENTS[id];
  return { id, who: e.who, with: e.with ?? null, title: e.title, text: e.text(s), choices: e.choices(s), impact: s.currentImpact ?? null, week: s.week, slot: s.slot };
}

function applyFx(s, fx) {
  for (const [k, v] of Object.entries(fx)) if (k in s.meters) s.meters[k] = clamp(s.meters[k] + v);
}
function checkCollapse(s) {
  if (s.collapse) return;
  for (const id of ['trust', 'health', 'safety', 'privacy', 'output']) if (s.meters[id] <= 0) {
    s.collapse = Object.keys(ENDINGS).find((k) => ENDINGS[k].meter === id);
    return;
  }
}
function setPolicyInPlace(s, patch, reason) {
  const before = { ...s.policy };
  s.policy = normalizePolicy({ ...s.policy, ...patch });
  const changed = DIALS.filter((d) => before[d.id] !== s.policy[d.id]).map((d) => ({ dial: d.id, from: before[d.id], to: s.policy[d.id] }));
  if (changed.length) s.policyChanges.push({ week: s.week, reason, changed });
  if (s.policy.tracking === 'individual') s.flags.everIndividual = true;
  return changed;
}
function enterEvent(s) {
  s.currentImpact = null;
  const id = eventIdFor(s);
  const e = EVENTS[id];
  if (e?.impact) {
    const imp = e.impact(s);
    applyFx(s, imp.fx);
    s.currentImpact = imp;
    s.log.push({ kind: 'impact', week: s.week, eventId: id, source: e.title, label: imp.why, fx: imp.fx });
    checkCollapse(s);
  }
}

export function choose(state, choiceId) {
  if (state.phase !== 'event') throw new Error('There is no open decision.');
  const s = clone(state);
  const ev = currentEvent(s);
  const ch = ev.choices.find((x) => x.id === choiceId);
  if (!ch) throw new Error('That choice isn’t available.');
  const before = { ...s.meters };
  applyFx(s, ch.fx);
  for (const f of [].concat(ch.flag ?? [])) s.flags[f] = true;
  if (ch.unflag) delete s.flags[ch.unflag];
  const changed = ch.set ? setPolicyInPlace(s, ch.set, ev.title) : [];
  const entry = { kind: 'choice', week: s.week, slot: s.slot, eventId: ev.id, who: ev.who, source: ev.title, choiceId: ch.id, label: ch.label, fx: { ...ch.fx }, out: ch.out, why: ch.why, tone: ch.tone, rule: ch.rule, policyChanged: changed };
  s.log.push(entry);
  checkCollapse(s);
  s.phase = 'outcome';
  s.lastOutcome = { eventId: ev.id, choiceId: ch.id, before, after: { ...s.meters }, entry };
  return s;
}

// Move past an outcome: to the next event, or to the end of the week.
export function advance(state) {
  if (state.phase !== 'outcome') throw new Error('Nothing to continue.');
  const s = clone(state);
  if (s.collapse) return finishRun(s);
  if (s.slot < WEEKS[s.week - 1].slots.length - 1) {
    s.slot += 1;
    s.phase = 'event';
    enterEvent(s);
    if (s.collapse) return finishRun(s);
    return s;
  }
  return endWeek(s);
}

function endWeek(s) {
  const items = weeklyItems(s.policy, s.flags);
  for (const i of items) s.log.push({ ...i, week: s.week });
  applyFx(s, sumFx(items));
  checkCollapse(s);
  s.history.push({ week: s.week, meters: { ...s.meters } });
  s.report = { week: s.week, start: { ...s.weekStart }, end: { ...s.meters }, final: s.week >= WEEKS_TOTAL || Boolean(s.collapse) };
  s.phase = 'report';
  return s;
}

// From the week report: optionally change the rulebook, then start the next week (or finish).
export function changePolicy(state, policy) {
  if (state.phase !== 'report') throw new Error('The rulebook can only change between weeks.');
  const s = clone(state);
  setPolicyInPlace(s, policy, s.report.final ? 'Handover rulebook' : `Before week ${s.week + 1}`);
  return s;
}
export function nextWeek(state) {
  if (state.phase !== 'report') throw new Error('Finish the week first.');
  const s = clone(state);
  if (s.report.final) return finishRun(s);
  s.week += 1;
  s.slot = 0;
  s.weekStart = { ...s.meters };
  s.report = null;
  s.phase = 'event';
  enterEvent(s);
  if (s.collapse) return finishRun(s);
  return s;
}

export function checkRules(policy, flags = {}) {
  const p = normalizePolicy(policy);
  const r1 =
    p.tracking === 'individual' ? ['fail', 'Workers are still logged by name.']
    : p.targets === 'ranking' ? ['fail', 'Workers are still ranked against each other.']
    : flags.autoWarnings ? ['fail', 'Automatic warnings are still switched on.']
    : ['pass', 'No one has a pace, ranking or location profile.'];
  const r2 =
    p.tracking === 'individual' ? ['fail', 'Operations run on named data instead of team totals.']
    : flags.linkable ? ['fail', 'The “anonymous” dashboard can still be traced to Tim.']
    : p.tracking === 'off' ? ['partial', 'Allowed, but with no team totals the warehouse can’t find jams or plan staffing.']
    : ['pass', 'Robots steer safely and managers plan with team totals.'];
  const r3 =
    p.incident === 'staged' ? ['pass', 'Robot logs first; minimum ID data only through a reviewer.']
    : p.incident === 'robotOnly' ? ['partial', 'Private, but some safety questions can never be answered.']
    : ['fail', 'Anyone investigating can open a worker’s whole history.'];
  const r4 =
    flags.hidLeak ? ['fail', 'A data leak is still being kept from workers.']
    : p.notice === 'rights' && p.retention === 'shift' ? ['pass', 'Workers are told, can check and appeal, and links are erased nightly.']
    : p.notice === 'none' ? ['fail', 'Workers aren’t told what’s collected.']
    : p.retention === 'forever' ? ['fail', 'Data about people is kept forever.']
    : ['partial', [p.notice !== 'rights' && 'workers can’t see or appeal their records', p.retention !== 'shift' && 'data is kept for 90 days'].filter(Boolean).join(' and ').replace(/^./, (x) => x.toUpperCase()) + '.'];
  return [r1, r2, r3, r4].map(([status, note], i) => ({ id: i + 1, status, note }));
}
export const rulesPass = (policy, flags) => checkRules(policy, flags).every((r) => r.status === 'pass');
export const isAligned = (policy) => DIALS.every((d) => normalizePolicy(policy)[d.id] === ALIGNED[d.id]);

export function endingFor(s) {
  if (s.collapse) return s.collapse;
  const m = s.meters;
  const allAbove = METER_IDS.every((k) => m[k] >= WIN_LINE);
  if (allAbove) return rulesPass(s.policy, s.flags) ? 'fair' : 'fragile';
  if (m.privacy >= 55 && (m.output < WIN_LINE || m.safety < WIN_LINE)) return 'blind';
  if (m.output >= 55 && (m.privacy < WIN_LINE || m.trust < WIN_LINE || m.health < WIN_LINE)) return 'paper';
  return 'scraping';
}
function finishRun(s) {
  s.phase = 'ending';
  s.ending = endingFor(s);
  return s;
}

// What each person thinks, and what the system logs about them right now.
export function personView(id, s) {
  const p = s.policy, f = s.flags, m = s.meters;
  const logged =
    p.tracking === 'individual' ? ['Every pick, pause and step, under my employee ID']
    : p.tracking === 'aggregate' ? ['My current task, until it’s done', 'My picks count toward the zone total — no name']
    : ['Nothing. The robots just steer around me'];
  if (p.tracking !== 'off') logged.push({ forever: 'Kept forever', ninety: 'Kept 90 days', shift: 'Erased when the shift ends' }[p.retention]);
  const knows = p.notice === 'none' && !f.told ? 'Nobody told me any of this' : p.notice === 'rights' ? 'I can see my records and appeal' : 'There’s a notice by the time clock';
  let mood = m.trust < 25 || m.health < 25 ? 'upset' : m.trust < 45 || m.health < 45 ? 'worried' : m.trust > 70 && m.health > 65 ? 'happy' : 'ok';
  let thought = { happy: 'Good shift. People are looking out for each other.', ok: 'Busy, but fine.', worried: 'Keep your head down.', upset: 'I don’t know how much longer I can do this.' }[mood];
  if (id === 'tim') {
    if (p.targets === 'ranking') { mood = m.health > 60 ? 'worried' : 'upset'; thought = 'If I stop for water, I drop on the board.'; }
    else if (f.blamedTim) { mood = mood === 'happy' ? 'ok' : mood; thought = 'I got written up for a jammed aisle.'; }
    else if (f.linkable) thought = 'Robot 07’s numbers are my numbers. Everyone knows it.';
    else if (f.boardDown) thought = 'Board’s gone. I’ve got time to help Ana now.';
  } else if (id === 'priya') {
    if (f.sentHistory) { mood = 'upset'; thought = 'I reported a robot. I got a meeting about my pace.'; }
    else if (f.patched) { mood = mood === 'upset' ? 'worried' : 'happy'; thought = 'They actually fixed the robot I reported.'; }
    else if (f.halfPatched) thought = 'They patched it. I think. I still step back.';
    else if (s.log.some((e) => e.eventId === 'nearmiss')) thought = 'Nobody ever explained why that robot moved.';
    else if (p.tracking === 'individual') thought = 'I can feel the clock on every tote.';
    else if (m.trust >= 45 && m.health >= 45) thought = 'The robots are quick. I just watch my hands.';
  } else if (id === 'tom') {
    if (f.firedTom) { mood = 'upset'; thought = '(Tom no longer works here.)'; }
    else if (f.tomRights) { mood = 'ok'; thought = 'I finally saw what they had on me. And I got to explain.'; }
    else if (f.tomScared) { mood = 'worried'; thought = 'They say the robots rate us. I’m skipping breaks to be safe.'; }
    else if (f.tomTold) thought = 'I asked what the robots know about me. The answer fit on one page.';
    else if (p.notice === 'none' && !f.told && p.tracking === 'individual') thought = 'The robots help us pick. That’s all they do, right?';
    else if (p.tracking === 'individual') thought = 'At least I know they’re counting. I just don’t know what they do with it.';
    else if (s.week <= 2) thought = 'Still learning where the robots turn.';
  } else if (id === 'kofi') {
    if (f.hrFishing) { mood = 'upset'; thought = 'HR had a map of my bathroom trips.'; }
    else if (f.deniedKofi) { mood = 'upset'; thought = 'My back is wrecked and the data says I wasn’t there.'; }
    else if (f.committee) thought = 'Our committee checks who opens what. That helps.';
  } else if (id === 'ana') {
    if (p.targets === 'ranking' && !f.boardDown) { mood = 'worried'; thought = 'Nobody has time to show me anything.'; }
    else if (f.boardDown || s.week >= 3) thought = 'Tim showed me the handoff. I’m getting faster.';
  }
  return { id, ...PEOPLE[id], mood, thought, logged, knows };
}

export function whereNow(s) {
  const p = s.policy, f = s.flags;
  const tim = p.targets === 'ranking' ? 'Tim’s shoulder needed physio. He still checks the leaderboard before he drinks water.'
    : f.boardDown ? 'The leaderboard came down. Tim takes his water breaks and has trained three new hires.'
    : f.blamedTim ? 'Tim got blamed for a jammed aisle. He hasn’t volunteered for anything since.'
    : f.linkable ? 'Tim’s “anonymous” robot numbers still come up in meetings.'
    : 'Tim takes his breaks, helps new hires, and has stopped thinking about rankings.';
  const priya = f.sentHistory ? 'Priya’s near-miss turned into a meeting about her pace. She hasn’t filed a report since.'
    : f.patched ? 'Priya’s report fixed a bug in every robot. She got a thank-you, not a meeting.'
    : f.halfPatched ? 'The robots got a best-guess patch. Priya still steps back when one pulls up.'
    : s.log.some((e) => e.eventId === 'nearmiss') ? 'Priya’s report was closed without a fix. She watches every robot that stops near her.'
    : 'Priya never got the chance to see how a near-miss would be handled.';
  const tom = f.firedTom ? 'Tom is looking for work. He still doesn’t know exactly what the report measured.'
    : f.tomRights ? 'Tom saw his record, explained the jam and the training, and kept his job.'
    : f.tomContext ? 'Tom kept his job once someone looked at the context. He never saw the report himself.'
    : f.tomScared ? 'Tom still thinks the robots are rating him. He skips breaks, just in case.'
    : f.tomTold ? 'Tom asked what the robots know about him. The answer fit on one page.'
    : 'Tom is still learning the floor.';
  return { tim, priya, tom };
}

export function meterInfo(id) {
  return METERS.find((m) => m.id === id);
}

// Why did a meter change this week? Returns contributions with nonzero effect.
export function explain(s, meter, week = s.week) {
  return s.log.filter((e) => e.week === week && e.fx[meter]).map((e) => ({ amount: e.fx[meter], kind: e.kind, source: e.source, label: e.label }));
}

export function policySummary(policy) {
  const p = normalizePolicy(policy);
  const a = {
    individual: 'Robots log every pick, pause and location by name',
    aggregate: 'Robots log team and zone totals, no names',
    off: 'Robots log nothing about people',
  }[p.tracking];
  const b = { ranking: 'a live leaderboard ranks everyone', team: 'the shift shares one target', fixed: 'everyone works to fair, fixed standards' }[p.targets];
  const c = { everything: 'Near-miss investigators can open anyone’s full history', staged: 'Near-misses start with robot logs; a reviewer unlocks only what’s needed', robotOnly: 'Near-misses never identify anyone' }[p.incident];
  const d = { none: 'Workers aren’t told', notice: 'A notice is posted', rights: 'Workers are told and can check and appeal' }[p.notice];
  const e = { forever: 'data is kept forever', ninety: 'data is kept 90 days', shift: 'personal links are erased every night' }[p.retention];
  return `${a}, and ${b}. ${c}. ${d}; ${e}.`;
}

// Persistence helpers --------------------------------------------------------
export function validRun(s) {
  return Boolean(s && s.v === VERSION && s.meters && s.policy && WEEKS[s.week - 1] && ['event', 'outcome', 'report', 'ending'].includes(s.phase));
}
export function summarizeRun(s) {
  return {
    at: Date.now(),
    ending: s.ending,
    meters: { ...s.meters },
    policy: { ...s.policy },
    startPolicy: { ...s.startPolicy },
    weeks: s.history.length - 1,
    good: s.log.filter((e) => e.kind === 'choice' && e.tone === 'good').length,
    bad: s.log.filter((e) => e.kind === 'choice' && e.tone === 'bad').length,
  };
}
export { WEEKS, EVENTS, ENDINGS, METERS, DIALS, PEOPLE };
