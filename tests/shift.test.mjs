// Tests for The Next Shift (v5 game). Run: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { newRun, choose, advance, nextWeek, changePolicy, currentEvent, normalizePolicy, checkRules, rulesPass, endingFor, forecast, weeklyItems, personView, whereNow, policySummary, summarizeRun, validRun } from '../dist/shift-engine.mjs';
import { DIALS, PRESETS, ALIGNED, EVENTS, WEEKS, ENDINGS, ENDING_ORDER, METER_IDS, RULES, PEOPLE } from '../dist/shift-content.mjs';
import { createServer } from '../server.mjs';

const tone = { good: 0, mixed: 1, bad: 2 };
function play(policy, pick, between) {
  let s = newRun(policy);
  for (let guard = 0; s.phase !== 'ending' && guard < 100; guard++) {
    if (s.phase === 'event') s = choose(s, pick(currentEvent(s), s).id);
    else if (s.phase === 'outcome') s = advance(s);
    else { if (between) s = between(s); s = nextWeek(s); }
  }
  return s;
}
const best = (ev) => [...ev.choices].sort((a, b) => tone[a.tone] - tone[b.tone])[0];
const worst = (ev) => [...ev.choices].sort((a, b) => tone[b.tone] - tone[a.tone])[0];
const keepPolicy = (ev) => { const k = ev.choices.filter((c) => !c.set); return k.find((c) => c.tone === 'good') ?? k.find((c) => c.tone === 'mixed') ?? k[0] ?? ev.choices[0]; };
const allPolicies = () => {
  const out = new Map();
  (function rec(i, p) { if (i === DIALS.length) { const n = normalizePolicy(p); out.set(JSON.stringify(n), n); return; } for (const o of DIALS[i].options) rec(i + 1, { ...p, [DIALS[i].id]: o.id }); })(0, {});
  return [...out.values()];
};

test('the same rulebook and decisions always produce the same warehouse', () => {
  const a = play(PRESETS[1].policy, best), b = play(PRESETS[1].policy, best);
  assert.deepEqual(a.meters, b.meters);
  assert.deepEqual(a.log, b.log);
  assert.equal(a.ending, b.ending);
});

test('a run lasts five weeks with two decisions per week unless a meter collapses', () => {
  const s = play(ALIGNED, best);
  assert.equal(s.log.filter((e) => e.kind === 'choice').length, 10);
  assert.equal(s.history.length, 6);
  const crash = play(PRESETS[0].policy, worst);
  assert.ok(crash.collapse, 'max-output preset with harmful choices collapses');
  assert.ok(crash.history.length < 6);
  assert.ok(METER_IDS.some((m) => crash.meters[m] === 0));
});

test('the aligned rulebook with good decisions wins the Fair Shift', () => {
  const s = play(ALIGNED, best);
  assert.equal(s.ending, 'fair');
  assert.ok(METER_IDS.every((m) => s.meters[m] >= 50));
  assert.ok(rulesPass(s.policy, s.flags));
});

test('no rulebook wins unless it ends up passing all four rules', () => {
  for (const p of allPolicies()) for (const pick of [best, keepPolicy]) {
    const s = play(p, pick);
    if (s.ending === 'fair') assert.ok(rulesPass(s.policy, s.flags), JSON.stringify(p));
  }
});

test('if the rulebook never changes, only the aligned rulebook can win', () => {
  for (const p of allPolicies()) {
    const s = play(p, keepPolicy);
    if (s.ending === 'fair') assert.deepEqual(normalizePolicy(s.startPolicy), ALIGNED);
  }
});

test('presets lead to different, non-winning endings with good decisions that keep the rulebook', () => {
  const endings = PRESETS.map((pr) => play(pr.policy, keepPolicy).ending);
  for (const e of endings) assert.notEqual(e, 'fair');
  assert.equal(new Set(endings).size, endings.length, endings.join());
});

test('changing the rulebook between weeks can turn a losing run around', () => {
  const stuck = play(PRESETS[0].policy, keepPolicy);
  assert.notEqual(stuck.ending, 'fair');
  const fixed = play(PRESETS[0].policy, keepPolicy, (s) => (s.week === 1 ? changePolicy(s, ALIGNED) : s));
  assert.ok(METER_IDS.reduce((a, m) => a + fixed.meters[m], 0) > METER_IDS.reduce((a, m) => a + stuck.meters[m], 0));
});

test('every ending is reachable', () => {
  const found = new Set();
  let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pickR = (a) => a[Math.floor(rnd() * a.length)];
  const randomPolicy = () => Object.fromEntries(DIALS.map((d) => [d.id, pickR(d.options).id]));
  const minOutput = (ev) => [...ev.choices.filter((c) => !c.set?.tracking)].sort((a, b) => (a.fx.output ?? 0) - (b.fx.output ?? 0))[0] ?? ev.choices[0];
  found.add(play(PRESETS[2].policy, minOutput).ending);
  for (let i = 0; i < 6000 && found.size < ENDING_ORDER.length; i++) found.add(play(randomPolicy(), (ev) => pickR(ev.choices), rnd() < 0.3 ? (s) => (rnd() < 0.4 ? changePolicy(s, randomPolicy()) : s) : null).ending);
  assert.deepEqual([...found].sort(), [...ENDING_ORDER].sort());
});

test('every event and every choice can appear, and all text is filled in', () => {
  const seen = new Set(), seenChoice = new Set();
  let seed = 3; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = 0; i < 4000; i++) {
    const p = Object.fromEntries(DIALS.map((d) => [d.id, d.options[Math.floor(rnd() * 3)].id]));
    play(p, (ev, s) => {
      seen.add(ev.id);
      for (const x of [ev.title, ev.text, ...ev.choices.flatMap((c) => [c.label, c.out, c.why])]) assert.ok(typeof x === 'string' && x.length > 3 && !/undefined/.test(x), `${ev.id}: ${x}`);
      assert.ok(PEOPLE[ev.who], ev.id);
      const c = ev.choices[Math.floor(rnd() * ev.choices.length)]; seenChoice.add(`${ev.id}:${c.id}`);
      return c;
    });
  }
  assert.deepEqual([...seen].sort(), Object.keys(EVENTS).sort());
  assert.ok(seenChoice.size >= 60);
});

test('meters stay between 0 and 100 and every change is explained', () => {
  let s = newRun(PRESETS[0].policy);
  while (s.phase !== 'ending') {
    if (s.phase === 'event') s = choose(s, worst(currentEvent(s)).id);
    else if (s.phase === 'outcome') s = advance(s);
    else s = nextWeek(s);
    for (const m of METER_IDS) assert.ok(s.meters[m] >= 0 && s.meters[m] <= 100);
  }
  for (const e of s.log) { assert.ok(e.source && e.label); assert.ok(Object.keys(e.fx).every((k) => METER_IDS.includes(k))); }
});

test('the live leaderboard needs name tracking and switching tracking off removes it', () => {
  assert.equal(normalizePolicy({ ...ALIGNED, targets: 'ranking' }).targets, 'team');
  assert.equal(normalizePolicy({ ...PRESETS[0].policy }).targets, 'ranking');
});

test('the Fair Shift check reflects both the rulebook and lasting problems', () => {
  assert.ok(checkRules(ALIGNED).every((r) => r.status === 'pass'));
  assert.equal(checkRules(PRESETS[0].policy).filter((r) => r.status === 'fail').length, 4);
  assert.equal(checkRules(PRESETS[2].policy).find((r) => r.id === 2).status, 'partial');
  assert.equal(checkRules(ALIGNED, { linkable: true }).find((r) => r.id === 2).status, 'fail');
  assert.equal(checkRules(ALIGNED, { hidLeak: true }).find((r) => r.id === 4).status, 'fail');
  assert.equal(RULES.length, 4);
});

test('Tim, Priya and Tom’s situations appear in the run that creates them', () => {
  const s = play(PRESETS[0].policy, (ev) => ev.choices[0]);
  const ids = s.log.filter((e) => e.kind === 'choice').map((e) => e.eventId);
  assert.ok(ids.includes('leaderboard'), 'Tim under a leaderboard');
  assert.ok(ids.includes('nearmiss'), 'Priya’s near-miss');
  const t = play(PRESETS[0].policy, keepPolicy);
  assert.ok(t.log.some((e) => e.eventId === 'firing'), 'Tom’s firing when individual data is kept');
  const a = play(ALIGNED, best);
  assert.ok(a.log.some((e) => e.eventId === 'tomask'), 'Tom asks instead when no profile exists');
});

test('people, summaries and the forecast are readable', () => {
  const s = play(ALIGNED, best);
  for (const id of ['tim', 'priya', 'tom', 'kofi', 'ana']) { const v = personView(id, s); assert.ok(v.thought && v.logged.length && v.knows); }
  const w = whereNow(s); assert.ok(w.tim && w.priya && w.tom);
  assert.match(policySummary(ALIGNED), /team and zone totals/);
  const f = forecast(ALIGNED); assert.equal(f.output, weeklyItems(ALIGNED).reduce((a, i) => a + (i.fx.output ?? 0), 0));
  assert.ok(validRun(s)); assert.equal(summarizeRun(s).ending, 'fair');
  for (const id of ENDING_ORDER) assert.ok(ENDINGS[id].title && ENDINGS[id].story);
  assert.equal(WEEKS.length, 5);
});

test('actions out of order are rejected', () => {
  const s = newRun(ALIGNED);
  assert.throws(() => advance(s));
  assert.throws(() => nextWeek(s));
  assert.throws(() => changePolicy(s, ALIGNED));
  assert.throws(() => choose(s, 'not-a-choice'));
});

test('the local server supplies the game, the v4 story and fonts, but no project files', async () => {
  const server = createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const u = `http://127.0.0.1:${server.address().port}`;
    assert.match(await (await fetch(u)).text(), /shift-app\.mjs/);
    for (const name of ['shift.css', 'shift-app.mjs', 'shift-engine.mjs', 'shift-content.mjs', 'shift-floor.mjs', 'shift-art.mjs', 'story.html', 'favicon.svg', 'fonts/barlow-condensed-latin-800-normal.woff2'])
      assert.equal((await fetch(`${u}/${name}`)).status, 200, name);
    for (const name of ['package.json', 'server.mjs', '_dev/floor.html', '../server.mjs']) assert.equal((await fetch(`${u}/${name}`)).status, 404, name);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
});
