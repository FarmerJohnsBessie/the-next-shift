// The Next Shift — interface controller.
import { newRun, choose, advance, nextWeek, changePolicy, currentEvent, normalizePolicy, optionLocked, forecast, weeklyItems, checkRules, rulesPass, personView, whereNow, policySummary, summarizeRun, validRun, option, dial } from './shift-engine.mjs';
import { METERS, DIALS, PRESETS, RULES, CRITIQUES, SOURCES, PEOPLE, WEEKS, ENDINGS, ENDING_ORDER, ENDING_HINTS, WIN_LINE, WEEKS_TOTAL } from './shift-content.mjs';
import { portrait, icon } from './shift-art.mjs';
import { createFloor } from './shift-floor.mjs';

const KEY = 'team12-next-shift-v5';
const app = document.getElementById('app');
const sheet = document.getElementById('sheet');
const sheetBody = document.getElementById('sheet-body');
const announcer = document.getElementById('announcer');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sign = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
const FLOOR_PEOPLE = ['tim', 'priya', 'tom', 'ana', 'kofi', 'dana', 'lin'];
const GENERIC = { sam: { name: 'Sam', role: 'Order picker' }, lee: { name: 'Lee', role: 'Order picker' }, jo: { name: 'Jo', role: 'Packer' } };
const CREW_IDS = ['tim', 'priya', 'tom', 'kofi', 'ana'];

// ------------------------------------------------------------- storage
let storageOk = true;
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (d && d.v === 5) return { v: 5, run: validRun(d.run) ? d.run : null, endings: Array.isArray(d.endings) ? d.endings.filter((e) => ENDINGS[e]) : [], history: Array.isArray(d.history) ? d.history.slice(-12) : [], tutorial: Boolean(d.tutorial), lastPolicy: d.lastPolicy ?? null };
  } catch { storageOk = false; }
  return { v: 5, run: null, endings: [], history: [], tutorial: false, lastPolicy: null };
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { storageOk = false; }
}
let store = load();

// ------------------------------------------------------------- ui state
let screen = 'title';
let floor = null;
let timers = [];
const ui = { view: 'floor', draft: null, rbMode: 'start', cardHidden: false, stage: 'idle', bannerWeek: 0, shown: null, openRows: new Set(), prevScreen: 'title' };
const later = (fn, ms) => { const id = setTimeout(fn, reduced ? Math.min(ms, 60) : ms); timers.push(id); return id; };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
const say = (msg) => { announcer.textContent = ''; requestAnimationFrame(() => (announcer.textContent = msg)); };

function go(next) {
  clearTimers();
  floor?.destroy(); floor = null;
  ui.prevScreen = screen;
  screen = next;
  ({ title: renderTitle, rulebook: renderRulebook, play: renderPlay, ending: renderEnding, collection: renderCollection })[next]();
  window.scrollTo(0, 0);
}

// ------------------------------------------------------------- floor model
function dataLevel(s) {
  const base = { individual: 1, aggregate: 0.45, off: 0.06 }[s.policy.tracking];
  const keep = { forever: 1, ninety: 0.7, shift: 0.22 }[s.policy.retention];
  let lv = base * keep * (0.45 + 0.13 * s.week);
  for (const f of ['sentHistory', 'hrFishing', 'paperProfile']) if (s.flags[f]) lv += 0.08;
  return Math.max(0.04, Math.min(1, lv));
}
function bubbleFor(id, v, s) {
  const f = s.flags;
  if (id === 'tim' && s.policy.targets === 'ranking') return 'drop';
  if (id === 'priya' && f.sentHistory) return 'cloud';
  if (id === 'priya' && f.patched) return 'heart';
  if (id === 'tom' && f.tomScared) return 'eye';
  if (id === 'tom' && !f.tomTold && !f.told && s.policy.notice === 'none') return 'question';
  if (id === 'kofi' && (f.hrFishing || f.deniedKofi)) return 'cloud';
  if (s.policy.tracking === 'individual' && v.mood !== 'happy') return 'eye';
  return { happy: 'heart', ok: 'ok', worried: 'drop', upset: 'alarm' }[v.mood];
}
function floorModel(s, extra = {}) {
  const people = {};
  for (const id of CREW_IDS) { const v = personView(id, s); people[id] = { mood: v.mood, bubble: bubbleFor(id, v, s) }; }
  return { policy: s.policy, meters: s.meters, flags: s.flags, week: s.week, view: ui.view, spotlight: [], people, scene: null, tv: null, dataLevel: dataLevel(s), fill: 0.3 + s.week * 0.12, ...extra };
}
function eventSpot(ev) {
  if (!ev) return { spotlight: [], tv: null };
  return { spotlight: [ev.who, ev.with].filter((x) => x && FLOOR_PEOPLE.includes(x)), tv: ev.who === 'hale' ? 'hale' : null };
}
function refreshFloor(extra) {
  if (!floor || !store.run) return;
  const s = store.run;
  const ev = s.phase === 'event' || s.phase === 'outcome' ? currentEvent(s) : null;
  floor.setModel(floorModel(s, { ...eventSpot(['incoming', 'event', 'outcome'].includes(ui.stage) ? ev : null), ...extra }));
  const crew = app.querySelector('#crew'); if (crew) crew.innerHTML = crewHTML(s);
}

// ------------------------------------------------------------- title
function renderTitle() {
  const run = store.run && store.run.phase !== 'ending' ? store.run : null;
  app.innerHTML = `<main id="main" class="title-screen">
    <div class="title-floor"><canvas aria-hidden="true"></canvas></div>
    <div class="title-shade"></div>
    <div class="title-card"><div class="title-inner">
      <div class="title-plate"><h1>The Next Shift</h1><div class="hazard" aria-hidden="true"></div></div>
      <p class="title-lede">Run a robot warehouse for five weeks. You decide what the robots record about the people working next to them — and live with what that does to Tim, Priya and Tom.</p>
      <div class="title-actions">
        ${run ? `<button class="btn btn-primary" data-act="resume">${icon('play')} Continue week ${run.week}</button><button class="btn btn-dark" data-act="new">Start over</button>` : `<button class="btn btn-primary" data-act="new">${icon('play')} Start your first shift</button>`}
      </div>
      <div class="title-links">
        <button data-act="how">How to play</button>
        <button data-act="collection">Endings found: ${store.endings.length} of ${ENDING_ORDER.length}</button>
        <button data-act="rules">The Fair Shift rules</button>
        <a href="${new URL('./story.html', import.meta.url).href}">Read the long-form story (v4)</a>
      </div>
    </div></div>
    <p class="title-foot">Team 12 · Ethics &amp; Policy Issues in Computing · Authored fiction based on three real concerns about warehouse robots</p>
  </main>`;
  const canvas = app.querySelector('canvas');
  document.fonts.ready.then(() => {
    if (screen !== 'title') return;
    floor = createFloor(canvas, { interactive: false });
    floor.setModel({ policy: { tracking: 'individual', targets: 'ranking', incident: 'everything', notice: 'none', retention: 'forever' }, meters: { output: 70, safety: 55, health: 45, privacy: 40, trust: 50 }, flags: {}, week: 3, view: 'floor', spotlight: [], people: {}, scene: null, tv: null, dataLevel: 0.6, fill: 0.7 });
  });
}

// ------------------------------------------------------------- rulebook
function fxPills(fx) {
  return Object.entries(fx).filter(([, v]) => v).map(([k, v]) => `<span class="${v > 0 ? 'up' : 'down'}" title="${esc(METERS.find((m) => m.id === k).name)} ${sign(v)} per week">${icon(k, { size: 13 })}${esc(METERS.find((m) => m.id === k).name)} ${sign(v)}</span>`).join('');
}
function forecastHTML(p) {
  const f = forecast(p);
  return `<div class="forecast">${METERS.map((m) => {
    const v = f[m.id], w = Math.min(50, Math.abs(v) * 3.2);
    return `<div class="fc-row">${icon(m.id, { size: 18 })}<span>${m.name}</span><span class="fc-bar"><i style="${v >= 0 ? `left:50%;width:${w}%;background:var(--go)` : `left:${50 - w}%;width:${w}%;background:var(--stop)`}"></i></span><span class="fc-num ${v > 0 ? 'up' : v < 0 ? 'down' : 'flat'}">${sign(v)}</span></div>`;
  }).join('')}</div><p class="fc-note">Per week, before incidents. Includes demand growth (Orders −5 every week).</p>`;
}
function checksHTML(p, flags = {}) {
  const res = checkRules(p, flags);
  return `<div class="checks">${res.map((r) => `<div class="check"><span class="status ${r.status}" aria-label="${r.status}">${icon(r.status === 'pass' ? 'check' : r.status === 'fail' ? 'cross' : 'partial', { size: 14 })}</span><div><strong>${r.id}. ${esc(RULES[r.id - 1].short)}</strong>${esc(r.note)}</div></div>`).join('')}</div>`;
}
function renderRulebook() {
  const mode = ui.rbMode;
  const s = store.run;
  const p = ui.draft ?? (mode === 'start' ? store.lastPolicy ?? PRESETS[1].policy : s.policy);
  ui.draft = normalizePolicy(p);
  const unlocked = store.history.length > 0;
  const title = mode === 'start' ? 'Write your rulebook' : s?.report?.final ? 'The rulebook you hand over' : `Rulebook for week ${s.week + 1}`;
  const lede = mode === 'start'
    ? 'Five decisions about what the robots record and who gets to use it. Start from a preset or choose each one. You can change it between weeks.'
    : s?.report?.final ? 'Your five weeks are done. The next manager inherits whatever rulebook you leave here.' : 'Changes start next week. The numbers show what each choice does every week.';
  const presetOn = PRESETS.find((pr) => DIALS.every((d) => pr.policy[d.id] === ui.draft[d.id]))?.id;
  app.innerHTML = `${topbar(mode === 'start' ? null : s)}<main id="main" class="rulebook">
    <div class="rb-head"><div><h1>${title}</h1><p>${lede}</p></div>
      <div class="presets" role="group" aria-label="Presets"><span>Start from</span>${PRESETS.map((pr) => `<button class="preset" data-act="preset" data-id="${pr.id}" aria-pressed="${presetOn === pr.id}"><strong>${pr.name}</strong><small>${pr.desc}</small></button>`).join('')}</div>
    </div>
    <div class="dials">${DIALS.map((d) => `<fieldset class="dial"><legend><span class="dial-q"><span class="badge">${icon(d.icon, { size: 20 })}</span><span><strong>${d.name}</strong><small>${d.q}</small></span></span></legend>
      <div class="opts">${d.options.map((o) => { const lock = optionLocked(ui.draft, d.id, o.id); const on = ui.draft[d.id] === o.id; return `<label class="opt ${on ? 'on' : ''} ${lock ? 'locked' : ''}"><input type="radio" name="${d.id}" value="${o.id}" ${on ? 'checked' : ''} ${lock ? 'disabled' : ''}><span class="opt-name">${o.name}</span><span class="opt-desc">${o.desc}</span>${lock ? `<span class="opt-lock">${icon('privacy', { size: 14 })}${lock}</span>` : ''}<span class="fx">${fxPills(o.fx)}</span></label>`; }).join('')}</div></fieldset>`).join('')}</div>
    <aside class="rb-side">
      <section class="side-card"><h2>In plain words</h2><p class="plain" id="rb-plain">${esc(policySummary(ui.draft))}</p></section>
      <section class="side-card"><h2>Every week, this rulebook…</h2><div id="rb-forecast">${forecastHTML(ui.draft)}</div></section>
      <section class="side-card"><h2>Fair Shift check</h2><div id="rb-checks">${unlocked ? checksHTML(ui.draft, s?.flags) : `<div class="locked-teaser">${icon('privacy', { size: 22 })}<span>Finish one run to unlock a live check against Team 12’s four rules.</span></div>`}</div></section>
      <div class="rb-go">${mode === 'start' ? `<button class="btn btn-primary" data-act="clockin">${icon('play')} Clock in for week 1</button><button class="btn btn-ghost btn-small" data-act="home">Back</button>` : `<button class="btn btn-primary" data-act="apply-rules">${icon('check')} ${s.report?.final ? 'Hand it over' : 'Use this rulebook'}</button><button class="btn btn-ghost btn-small" data-act="cancel-rules">Keep the current one</button>`}</div>
    </aside>
    <div class="rb-mobilebar">${mode === 'start' ? `<button class="btn btn-primary" data-act="clockin">${icon('play')} Clock in for week 1</button>` : `<button class="btn btn-primary" data-act="apply-rules">${icon('check')} ${s.report?.final ? 'Hand it over' : 'Use this rulebook'}</button>`}</div>
  </main>`;
}
function updateRulebook() {
  app.querySelectorAll('.opt').forEach((lab) => {
    const inp = lab.querySelector('input');
    const lock = optionLocked(ui.draft, inp.name, inp.value);
    inp.checked = ui.draft[inp.name] === inp.value; inp.disabled = Boolean(lock);
    lab.classList.toggle('on', inp.checked); lab.classList.toggle('locked', Boolean(lock));
    lab.querySelector('.opt-lock')?.remove();
    if (lock) lab.querySelector('.opt-desc').insertAdjacentHTML('afterend', `<span class="opt-lock">${icon('privacy', { size: 14 })}${lock}</span>`);
  });
  app.querySelector('#rb-plain').textContent = policySummary(ui.draft);
  app.querySelector('#rb-forecast').innerHTML = forecastHTML(ui.draft);
  if (store.history.length) app.querySelector('#rb-checks').innerHTML = checksHTML(ui.draft, store.run?.flags);
  const on = PRESETS.find((pr) => DIALS.every((d) => pr.policy[d.id] === ui.draft[d.id]))?.id;
  app.querySelectorAll('.preset').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === on)));
}

// ------------------------------------------------------------- play
function topbar(s) {
  const weekName = s ? WEEKS[s.week - 1]?.name : '';
  return `<header class="topbar"><button class="brand" data-act="home" aria-label="Back to the title screen"><span class="brand-mark" aria-hidden="true">N</span><span>The Next Shift</span></button>
    <div class="weekbar">${s ? `<span class="week-label">Week ${s.week} <span>· ${esc(weekName)}</span></span><div class="week-track" aria-hidden="true">${WEEKS.map((w, i) => `<span class="week-seg ${i < s.week - 1 ? 'done' : ''}"><i style="width:${i === s.week - 1 ? weekProgress(s) : i < s.week - 1 ? 100 : 0}%"></i></span>`).join('')}</div>` : ''}</div>
    <nav class="top-actions">${s ? `<button class="top-btn" data-act="journal">${icon('journal', { size: 18 })}<span>Journal</span></button>` : ''}<button class="top-btn" data-act="rules">${icon('rules', { size: 18 })}<span>Rules</span></button><button class="top-btn" data-act="how">${icon('info', { size: 18 })}<span>How to play</span></button></nav></header>`;
}
function weekProgress(s) {
  if (s.phase === 'report' || s.phase === 'ending') return 100;
  return Math.round(((s.slot + (s.phase === 'outcome' ? 1 : 0.5)) / 2) * 92);
}
function meterClass(v) { return v <= 20 ? 'danger' : v < WIN_LINE ? 'warn' : ''; }
function railHTML(s) {
  return `<aside class="rail" aria-label="Status">
    <section class="rail-block meters-block"><div class="rail-head"><h2>Meters</h2><small>Don’t let any hit 0</small></div>
      <div class="meters">${METERS.map((m) => `<button class="meter ${meterClass(s.meters[m.id])}" data-act="meter" data-id="${m.id}" id="meter-${m.id}" aria-label="${m.long}: ${s.meters[m.id]} of 100. Show why it changed."><span class="meter-icon">${icon(m.id, { size: 18 })}</span><span class="meter-name">${m.name}</span><span class="meter-val">${s.meters[m.id]}</span><span class="meter-bar"><i style="width:${s.meters[m.id]}%"></i><b></b></span><span class="dot"></span></button>`).join('')}</div>
      <p class="win-note"><i></i>The line is 50. End week 5 above it on all five to win.</p></section>
    <section class="rail-block crew-block"><div class="rail-head"><h2>The crew</h2><small>Tap to check in</small></div><div class="crew" id="crew">${crewHTML(s)}</div></section>
    <section class="rail-block rules-block"><div class="rail-head"><h2>Your rulebook</h2></div><div class="mini-rules" id="mini-rules">${miniRules(s.policy)}</div><button class="btn btn-ghost btn-small" data-act="view-rules">${icon('book', { size: 18 })} Open rulebook</button></section>
  </aside>`;
}
function viewCaption(s) {
  if (ui.view === 'manager') return { individual: 'The dashboard shows every person, by name', aggregate: 'The dashboard shows team & zone totals — no names', off: 'The dashboard shows robots only — nothing about people' }[s.policy.tracking];
  if (ui.view === 'workers') return 'What people are thinking right now';
  return '';
}
function crewHTML(s) {
  const ev = ['incoming', 'event', 'outcome'].includes(ui.stage) && (s.phase === 'event' || s.phase === 'outcome') ? currentEvent(s) : null;
  return CREW_IDS.map((id) => { const v = personView(id, s); const spot = ev && [ev.who, ev.with].includes(id); return `<button class="crew-btn ${spot ? 'spot' : ''}" data-act="person" data-id="${id}" aria-label="${PEOPLE[id].name}, feeling ${v.mood}">${portrait(id, v.mood, { size: 42, label: false })}${PEOPLE[id].name}</button>`; }).join('');
}
function miniRules(p) {
  return DIALS.map((d) => `<div class="mini-rule">${icon(d.icon, { size: 18 })}<span><b>${d.name}:</b> ${option(d.id, p[d.id]).name}</span></div>`).join('');
}
function renderPlay() {
  const s = store.run;
  ui.shown = { ...s.meters };
  app.innerHTML = `<div class="shell">${topbar(s)}<main id="main" class="play">${railHTML(s)}
    <section class="stage" id="stage" aria-label="The warehouse floor">
      <div class="progress" aria-hidden="true"><i id="progress" style="width:${weekProgress(s)}%"></i></div>
      <canvas id="floor" role="img" aria-label="Animated warehouse floor. Robots carry totes between pickers and the handoff station. Use the crew buttons to check on people."></canvas>
      <div class="stage-tools"><div class="seg" role="group" aria-label="Floor view">${[['floor', 'Floor', 'robot'], ['manager', 'Manager view', 'chart'], ['workers', 'Worker view', 'person']].map(([v, l, ic]) => `<button data-act="view" data-v="${v}" aria-pressed="${ui.view === v}">${icon(ic, { size: 16 })}${l}</button>`).join('')}</div><p class="view-cap" id="view-cap">${viewCaption(s)}</p></div>
      <div class="stage-right" id="stage-right"></div>
      <div id="overlay"></div>
    </section></main></div>`;
  document.fonts.ready.then(() => {
    if (screen !== 'play') return;
    floor = createFloor(app.querySelector('#floor'), { onPick: inspect });
    refreshFloor();
    if (!store.tutorial) startTutorial(); else step();
  });
}
function updateRail() {
  const s = store.run;
  const prev = ui.shown ?? s.meters;
  for (const m of METERS) {
    const el = app.querySelector(`#meter-${m.id}`); if (!el) continue;
    const v = s.meters[m.id], d = v - prev[m.id];
    el.className = `meter ${meterClass(v)}`;
    el.querySelector('.meter-bar i').style.width = `${v}%`;
    el.setAttribute('aria-label', `${m.long}: ${v} of 100. Show why it changed.`);
    tweenNumber(el.querySelector('.meter-val'), prev[m.id], v);
    if (d) { el.querySelectorAll('.delta').forEach((x) => x.remove()); el.insertAdjacentHTML('beforeend', `<span class="delta ${d > 0 ? 'up' : 'down'}">${sign(d)}</span>`); const dl = el.querySelector('.delta:last-of-type'); setTimeout(() => dl?.remove(), 1700); if (d < 0) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); } }
  }
  ui.shown = { ...s.meters };
  const crew = app.querySelector('#crew'); if (crew) crew.innerHTML = crewHTML(s);
  const mr = app.querySelector('#mini-rules'); if (mr) mr.innerHTML = miniRules(s.policy);
  const top = app.querySelector('.topbar'); if (top) top.outerHTML = topbar(s);
  const pr = app.querySelector('#progress'); if (pr) pr.style.width = `${weekProgress(s)}%`;
}
function tweenNumber(el, from, to) {
  if (from === to || reduced) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 650;
  const tick = (now) => { const k = Math.min(1, (now - t0) / dur); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
const overlay = (html) => { const o = app.querySelector('#overlay'); if (o) o.innerHTML = html; };
const stageRight = (html) => { const o = app.querySelector('#stage-right'); if (o) o.innerHTML = html; };

// The flow of a week: banner → floor runs → incoming call → decision card → outcome → … → report.
function step() {
  const s = store.run;
  clearTimers();
  if (!s) return go('title');
  if (s.phase === 'ending') return later(() => go('ending'), 900);
  if (s.phase === 'report') { ui.stage = 'report'; refreshFloor(); stageRight(''); return later(showReport, 700); }
  if (s.phase === 'outcome') { ui.stage = 'outcome'; refreshFloor(); return showOutcome(); }
  // event
  if (s.slot === 0 && ui.bannerWeek !== s.week) return showWeekBanner();
  ui.stage = 'running';
  refreshFloor({ spotlight: [], tv: null });
  overlay(`<div class="hint-bar">${icon('info', { size: 16 })} Click anyone on the floor to see what’s recorded about them</div>`);
  stageRight(`<button class="chip-btn" data-act="skip">${icon('skip', { size: 16 })}<span>Skip ahead</span></button>`);
  animateProgress(s);
  later(showIncoming, 2600);
}
function animateProgress(s) {
  const pr = app.querySelector('#progress'); if (!pr) return;
  pr.style.transition = 'width 2.4s linear'; pr.style.width = `${Math.round(((s.slot + 0.5) / 2) * 92)}%`;
  const seg = app.querySelectorAll('.week-seg')[s.week - 1]?.querySelector('i'); if (seg) { seg.style.transition = 'width 2.4s linear'; seg.style.width = pr.style.width; }
}
function showWeekBanner() {
  const s = store.run, w = WEEKS[s.week - 1];
  ui.bannerWeek = s.week; ui.stage = 'banner';
  overlay(`<div class="week-banner" data-act="banner-go" role="status"><div class="week-plate"><small>Week ${s.week} of ${WEEKS_TOTAL}</small><strong>${esc(w.name)}</strong><p>${esc(w.line)}</p></div></div>`);
  say(`Week ${s.week}: ${w.name}. ${w.line}`);
  later(step, 2100);
}
function showIncoming() {
  const s = store.run, ev = currentEvent(s);
  ui.stage = 'incoming';
  refreshFloor();
  const p = PEOPLE[ev.who];
  overlay(`<button class="incoming" data-act="open-card">${portrait(ev.who, 'ok', { size: 44, label: false })}<span><strong>${esc(p.name)}</strong><span>${ev.who === 'hale' ? 'calling from HQ' : 'needs you'}</span></span><span class="ring" aria-hidden="true"></span></button>`);
  stageRight(`<button class="chip-btn" data-act="open-card">${icon('next', { size: 16 })}<span>Answer</span></button>`);
  say(`${p.name} needs a decision.`);
  later(showEvent, 1300);
}
function showEvent() {
  const s = store.run, ev = currentEvent(s);
  ui.stage = 'event'; ui.cardHidden = false;
  refreshFloor(); stageRight('');
  const p = PEOPLE[ev.who];
  const mood = ev.who === 'priya' || ev.who === 'tim' ? 'worried' : ev.who === 'hale' || ev.who === 'dana' ? 'ok' : personView(ev.who, s)?.mood ?? 'ok';
  overlay(`<div class="veil"><article class="card" id="ev-card" tabindex="-1" role="dialog" aria-modal="false" aria-labelledby="ev-title"><div class="card-stripe" aria-hidden="true"></div><div class="card-body">
    ${miniMeters(s)}<div class="speaker">${portrait(ev.who, mood, { size: 72 })}<div><strong>${esc(p.name)}</strong><span>${esc(p.role)} · Week ${s.week}, call ${s.slot + 1} of 2</span></div></div>
    <h2 id="ev-title">${esc(ev.title)}</h2><p class="story">${esc(ev.text)}</p>
    ${ev.impact ? `<p class="impact">${icon('alert', { size: 18 })}${esc(ev.impact.why)} ${chipsInline(ev.impact.fx)}</p>` : ''}
    <div class="choices" role="group" aria-label="Your options">${ev.choices.map((c, i) => `<button class="choice" data-act="choose" data-id="${c.id}" data-fx='${JSON.stringify(c.fx)}'><kbd>${i + 1}</kbd><span>${esc(c.label)}</span></button>`).join('')}</div>
    <div class="card-foot"><span><span class="hint-hover">Hover an option to see which meters it touches. Keys <kbd>1</kbd>–<kbd>${ev.choices.length}</kbd> also work.</span><span class="hint-touch">Tap an option to choose it. You’ll see exactly what it changed.</span></span><button class="peek" data-act="peek">${icon('eye', { size: 16 })} Look at the floor first</button></div>
  </div></article></div>`);
  app.querySelector('#ev-card')?.focus({ preventScroll: true });
}
function miniMeters(s) {
  return `<div class="card-meters" aria-hidden="true">${METERS.map((m) => `<span class="mm ${meterClass(s.meters[m.id])}" id="mm-${m.id}">${icon(m.id, { size: 14 })}${s.meters[m.id]}<i></i></span>`).join('')}</div>`;
}
function chipsInline(fx) { return Object.entries(fx).map(([k, v]) => `<b>${METERS.find((m) => m.id === k).name} ${sign(v)}</b>`).join(' '); }
function previewMeters(fx) {
  for (const m of METERS) for (const el of [app.querySelector(`#meter-${m.id}`), app.querySelector(`#mm-${m.id}`)]) { if (!el) continue; el.classList.remove('preview-sm', 'preview-lg'); const v = fx?.[m.id]; if (v) el.classList.add(Math.abs(v) >= 6 ? 'preview-lg' : 'preview-sm'); }
}
function doChoose(id) {
  const before = { ...store.run.meters };
  store.run = choose(store.run, id); save();
  previewMeters(null);
  updateRail();
  const e = store.run.lastOutcome.entry;
  say(`You chose: ${e.label}. ${e.out} ${Object.entries(e.fx).map(([k, v]) => `${METERS.find((m) => m.id === k).name} ${sign(v)}`).join(', ')}.`);
  void before;
  showOutcome();
}
function showOutcome() {
  const s = store.run, o = s.lastOutcome, e = o.entry;
  ui.stage = 'outcome';
  refreshFloor();
  const rule = e.rule ? RULES[e.rule - 1] : null;
  const changed = e.policyChanged?.length ? `<p class="policy-note">${icon('book', { size: 18 })} Rulebook updated: ${e.policyChanged.map((c) => `${dial(c.dial).name} → ${option(c.dial, c.to).name}`).join('; ')}</p>` : '';
  const collapse = s.collapse ? `<p class="alert">${icon('alert', { size: 20 })} ${esc(ENDINGS[s.collapse].line)} The run is over.</p>` : '';
  overlay(`<div class="veil"><article class="card" role="dialog" aria-modal="false" aria-labelledby="out-title"><div class="card-body">
    ${miniMeters(s)}<div class="speaker">${portrait(e.who, outcomeMood(e), { size: 72 })}<div><strong>${esc(PEOPLE[e.who].name)}</strong><span>${esc(e.source)}</span></div></div>
    <p class="chosen"><small>You chose</small><span>${esc(e.label)}</span></p>
    <p class="outcome-text" id="out-title">${esc(e.out)}</p>
    <div class="chips">${Object.entries(e.fx).filter(([, v]) => v).map(([k, v]) => `<span class="chip ${v > 0 ? 'up' : 'down'}">${icon(k, { size: 16 })}${METERS.find((m) => m.id === k).name} ${sign(v)}</span>`).join('')}</div>
    ${changed}
    <div class="lesson">${icon('lightbulb', { size: 20 })}<div><p>${esc(e.why)}</p>${rule ? `<span class="rule-tag">Rule ${rule.id} · ${esc(rule.short)}</span>` : ''}</div></div>
    ${collapse}
    <div class="card-foot"><span><kbd>Enter</kbd> to continue</span><button class="btn btn-primary" data-act="continue">${s.collapse ? 'See what happened' : s.slot === 1 ? 'Finish the week' : 'Back to the floor'} ${icon('next')}</button></div>
  </div></article></div>`);
  app.querySelector('[data-act="continue"]')?.focus({ preventScroll: true });
}
function outcomeMood(e) { return e.tone === 'good' ? 'happy' : e.tone === 'bad' ? 'upset' : 'worried'; }
function doContinue() {
  store.run = advance(store.run); save();
  ui.stage = 'idle'; overlay('');
  updateRail();
  if (store.run.phase === 'report') say(`Week ${store.run.week} is over.`);
  step();
}
function showReport() {
  const s = store.run, r = s.report;
  ui.stage = 'report';
  const rows = METERS.map((m) => {
    const a = r.start[m.id], b = r.end[m.id], d = b - a;
    const items = s.log.filter((e) => e.week === r.week && e.fx[m.id]);
    const open = ui.openRows.has(m.id);
    const lo = Math.min(a, b), hi = Math.max(a, b);
    return `<div class="rrow ${open ? 'open' : ''}"><button class="rrow-head" data-act="why" data-id="${m.id}" aria-expanded="${open}">${icon(m.id, { size: 20 })}<strong>${m.name}</strong><span class="rbar"><i class="base" style="width:${lo}%"></i><i class="${d >= 0 ? 'gain' : 'loss'}" style="left:${lo}%;width:${hi - lo}%"></i><b></b></span><span class="rnum">${a} → ${b} <span class="${d > 0 ? 'up' : d < 0 ? 'down' : 'flat'}">(${sign(d)})</span></span>${icon('next', { size: 16, cls: 'chev' })}</button>
      ${open ? `<ul class="why-list">${items.length ? items.map((e) => `<li><span class="amt ${e.fx[m.id] > 0 ? 'up' : 'down'}">${sign(e.fx[m.id])}</span><span>${esc(e.label)}<small>${esc(e.source)}</small></span></li>`).join('') : '<li><span></span><span>Nothing changed this meter this week.</span></li>'}</ul>` : ''}</div>`;
  }).join('');
  const voices = ['tim', 'priya', 'tom'].map((id) => { const v = personView(id, s); return `<div class="voice">${portrait(id, v.mood, { size: 44, label: false })}<p><b>${PEOPLE[id].name}</b>“${esc(v.thought.replace(/^\(|\)$/g, ''))}”</p></div>`; }).join('');
  const nextW = WEEKS[s.week];
  const collapse = s.collapse ? `<p class="alert">${icon('alert', { size: 20 })} ${esc(ENDINGS[s.collapse].line)}</p>` : '';
  overlay(`<div class="veil full"><article class="card report" role="dialog" aria-modal="false" aria-labelledby="rep-title"><div class="card-stripe" aria-hidden="true"></div><div class="card-body">
    <h2 id="rep-title">Week ${r.week} wrap-up</h2><p class="story">Your rulebook, two decisions and this week’s demand all moved the meters. Tap any row to see exactly why.</p>
    <div class="report-rows">${rows}</div>
    ${collapse}
    <div class="voices">${voices}</div>
    ${!r.final ? `<div class="next-up"><strong>Next: ${esc(nextW.name)}</strong><span>${esc(nextW.line)}</span></div>` : !s.collapse ? `<div class="next-up"><strong>That was week 5</strong><span>You can still change the rulebook the next manager inherits.</span></div>` : ''}
    <div class="report-actions">${s.collapse ? `<button class="btn btn-primary" data-act="next-week">See what happened ${icon('next')}</button>` : `<button class="btn btn-ghost" data-act="edit-rules">${icon('book', { size: 18 })} ${r.final ? 'Edit the handover rulebook' : 'Change the rulebook'}</button><button class="btn btn-primary" data-act="next-week">${r.final ? 'See how it ends' : `Start week ${s.week + 1}`} ${icon('next')}</button>`}</div>
  </div></article></div>`);
  app.querySelector('[data-act="next-week"]')?.focus({ preventScroll: true });
}

// ------------------------------------------------------------- ending
function renderEnding() {
  const s = store.run;
  const id = s.ending, E = ENDINGS[id];
  if (!s.recorded) {
    s.recorded = true;
    if (!store.endings.includes(id)) store.endings.push(id);
    store.history.push(summarizeRun(s)); store.history = store.history.slice(-12);
    save();
  }
  const prev = store.history.length > 1 ? store.history[store.history.length - 2] : null;
  const now = whereNow(s);
  const checks = checkRules(s.policy, s.flags);
  const kindLabel = { win: `${icon('trophy', { size: 18 })} You won`, near: `${icon('ribbon', { size: 18 })} So close`, loss: 'Ending', collapse: `${icon('alert', { size: 18 })} Game over` }[E.kind];
  const choices = s.log.filter((e) => e.kind === 'choice');
  app.innerHTML = `<div class="shell">${topbar(null)}<main id="main" class="ending">
    <section class="ending-hero scene-${id}"><div class="floorwrap"><canvas aria-hidden="true"></canvas></div><div class="ending-title"><span class="stamp ${E.kind}">${kindLabel}</span><h1>${esc(E.title)}</h1><p>${esc(E.line)}</p></div></section>
    <div class="ending-grid">
      <section class="panel"><h2>What happened</h2><p class="ending-story">${esc(E.story)}</p>
        <h3>Where they are now</h3><div class="people">${['tim', 'priya', 'tom'].map((pid) => `<div class="who">${portrait(pid, personView(pid, s).mood, { size: 56 })}<div><b>${PEOPLE[pid].name}</b><p>${esc(now[pid])}</p></div></div>`).join('')}</div>
      </section>
      <section class="panel"><h2>Final meters</h2><div class="final-meters">${METERS.map((m) => `<div class="fm">${icon(m.id, { size: 18 })}<span>${m.name}</span><span class="rbar"><i class="${s.meters[m.id] >= WIN_LINE ? 'gain' : 'loss'}" style="left:0;width:${s.meters[m.id]}%"></i><b></b></span><span>${s.meters[m.id]}</span></div>`).join('')}</div>
        <h3>Your rulebook vs. the Fair Shift rules</h3>${checksHTML(s.policy, s.flags)}
        ${E.kind !== 'win' ? `<div class="tip">${icon('lightbulb', { size: 20 })}<p>${esc(tipFor(s, checks))}</p></div>` : ''}
        ${prev ? `<h3>Compared with your last run</h3><div class="compare">${METERS.map((m) => `<div class="cmp">${icon(m.id, { size: 16 })}<span>${m.name}</span><span class="rbar"><i class="base" style="width:${prev.meters[m.id]}%"></i></span><span class="rbar"><i class="${s.meters[m.id] >= prev.meters[m.id] ? 'gain' : 'loss'}" style="left:0;width:${s.meters[m.id]}%"></i></span></div>`).join('')}<p class="fine">Left: last run (${esc(ENDINGS[prev.ending]?.title ?? '')}). Right: this run.</p></div>` : ''}
      </section>
    </div>
    <section class="panel"><h2>Your ${choices.length} decisions</h2><div class="legend"><span><i class="tone good" style="display:inline-block;width:10px;height:10px;border-radius:50%"></i>Fits the Fair Shift rules</span><span><i class="tone mixed" style="display:inline-block;width:10px;height:10px;border-radius:50%"></i>Half-measure</span><span><i class="tone bad" style="display:inline-block;width:10px;height:10px;border-radius:50%"></i>Broke a rule or caused harm</span></div>
      <div class="timeline">${choices.map((e) => `<div class="tl"><small>Week ${e.week}</small><span class="tone ${e.tone}" aria-label="${e.tone}"></span><span><b>${esc(e.label)}</b><em>${esc(e.source)} — ${esc(e.why)}</em></span><span class="tl-amt chips" style="margin:0">${Object.entries(e.fx).filter(([, v]) => v).slice(0, 3).map(([k, v]) => `<span class="chip ${v > 0 ? 'up' : 'down'}" style="font-size:13px;padding:2px 8px 2px 5px">${icon(k, { size: 13 })}${sign(v)}</span>`).join('')}</span></div>`).join('')}</div>
    </section>
    <div class="ending-actions"><button class="btn btn-primary" data-act="replay-edit">${icon('replay')} Try a different rulebook</button><button class="btn btn-dark" data-act="replay-same">Replay with the same start</button><button class="btn btn-ghost" data-act="collection">Endings found: ${store.endings.length} of ${ENDING_ORDER.length}</button><button class="btn btn-ghost" data-act="home">Title screen</button></div>
  </main></div>`;
  const canvas = app.querySelector('canvas');
  document.fonts.ready.then(() => {
    if (screen !== 'ending') return;
    floor = createFloor(canvas, { interactive: false });
    floor.setModel(floorModel(s, { scene: id, view: id === 'glass' || id === 'paper' ? 'manager' : 'floor', week: 5 }));
  });
  say(`${E.title}. ${E.line}`);
  if (E.kind === 'win') confetti();
}
function tipFor(s, checks) {
  const failing = checks.filter((c) => c.status !== 'pass');
  const low = METERS.filter((m) => s.meters[m.id] < WIN_LINE).map((m) => m.name.toLowerCase());
  if (s.ending === 'fragile') return `Your meters cleared 50, so the calls you made worked. To win, fix ${failing.map((c) => `Rule ${c.id}`).join(' and ')} in the handover rulebook so the next manager can’t undo them.`;
  if (failing.length && low.length) return `Your ${low.join(', ')} ended below 50, and the rulebook misses ${failing.map((c) => `Rule ${c.id}`).join(', ')}. Try changing those dials — open the rulebook between weeks, not just at the start.`;
  if (low.length) return `The rulebook passes, but ${low.join(', ')} ended below 50. Look at the decisions marked red or yellow above.`;
  return 'Try a rulebook that passes all four rules, then keep every meter above 50.';
}
function confetti() {
  if (reduced) return;
  const box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
  const cols = ['#F2C230', '#EA6A2A', '#2F5F8F', '#2F8A50', '#F5F3EE'];
  for (let i = 0; i < 90; i++) { const c = document.createElement('i'); c.style.left = `${Math.random() * 100}%`; c.style.background = cols[i % cols.length]; c.style.animationDelay = `${Math.random() * 0.8}s`; c.style.animationDuration = `${2.2 + Math.random() * 1.6}s`; box.appendChild(c); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 4800);
}

// ------------------------------------------------------------- collection
function renderCollection() {
  app.innerHTML = `<div class="shell">${topbar(null)}<main id="main" class="collection"><h1>Endings</h1><p>${store.endings.length} of ${ENDING_ORDER.length} found in this browser. Locked endings show a hint.</p>
    <div class="end-grid">${ENDING_ORDER.map((id) => { const E = ENDINGS[id], got = store.endings.includes(id); return `<article class="end-tile ${E.kind} ${got ? '' : 'locked'}"><span class="ico">${icon(got ? E.icon : 'privacy', { size: 24 })}</span><h2>${got ? esc(E.title) : 'Not found yet'}</h2><p>${got ? esc(E.line) : esc(ENDING_HINTS[id])}</p></article>`; }).join('')}</div>
    <p style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" data-act="new">${icon('play')} Play a new run</button><button class="btn btn-ghost" data-act="home">Title screen</button></p></main></div>`;
}

// ------------------------------------------------------------- sheets
function openSheet(title, body, { wide = false } = {}) {
  sheet.classList.toggle('wide', wide);
  sheetBody.innerHTML = `<div class="sheet-head"><h2 id="sheet-title">${title}</h2><button class="sheet-close" data-act="close-sheet" aria-label="Close">${icon('cross', { size: 20 })}</button></div><div class="sheet-body">${body}</div>`;
  if (!sheet.open) sheet.showModal();
  sheetBody.querySelector('.sheet-close')?.focus();
}
function howToPlay(first = false) {
  openSheet(first ? 'Before you clock in' : 'How to play', `<ol class="steps">
    <li><span class="num">1</span><div><strong>Write the rulebook</strong><p>Five choices decide what the robots record about people, how output is pushed, and who can open the data.</p></div></li>
    <li><span class="num">2</span><div><strong>Run five weeks</strong><p>Each week two people call with a problem. Pick a response with a click or the keys <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd>.</p></div></li>
    <li><span class="num">3</span><div><strong>Watch the five meters</strong><p>Orders, Safety, Health, Privacy and Trust. If any hits zero, the run ends. Tap a meter to see why it moved.</p></div></li>
    <li><span class="num">4</span><div><strong>Win the Fair Shift</strong><p>Finish week 5 with every meter at 50 or more, and hand over a rulebook that protects people after you leave.</p></div></li>
  </ol><div class="tip">${icon('lightbulb', { size: 20 })}<p>Switch between <b>Manager view</b> and <b>Worker view</b> on the floor. The same data looks very different from each side. Click anyone to see what’s recorded about them.</p></div>
  ${first ? `<div class="confirm-actions"><button class="btn btn-primary" data-act="close-sheet">Got it — write the rulebook ${icon('next')}</button></div>` : ''}`);
}
function rulesSheet() {
  openSheet('The Fair Shift rules', `<p class="fine">Team 12’s alignment strategy for warehouse robots. It allows what the warehouse needs to run safely and blocks what turns robots into a surveillance system.</p>
    <div class="rules-list" style="margin-top:14px">${RULES.map((r) => `<article class="rule-card"><span class="n">${r.id}</span><div><h3>${esc(r.short)}</h3><small>${esc(r.title)}</small><p>${esc(r.text)}</p></div></article>`).join('')}</div>
    <section class="sheet-section"><h3>How the rules hold up</h3><div class="qa">${CRITIQUES.map((c) => `<details><summary>${esc(c.q)}</summary><p>${esc(c.a)}</p></details>`).join('')}</div></section>
    <section class="sheet-section"><h3>Real-world anchors</h3><ul class="sources">${SOURCES.map((x) => `<li><a href="${x.url}" target="_blank" rel="noopener">${esc(x.title)}</a><small>${esc(x.note)}</small></li>`).join('')}</ul></section>
    <section class="sheet-section"><h3>About this game</h3><p class="fine">Bamazon, its people, events and every number are authored fiction. The meters are game mechanics chosen by the team to show tradeoffs; they don’t predict real outcomes. The game is deterministic: the same rulebook and decisions always give the same result, so runs can be compared fairly. Progress is saved only in this browser.</p></section>`, { wide: true });
}
function journalSheet() {
  const s = store.run;
  const entries = s.log.filter((e) => e.kind === 'choice' || e.kind === 'impact');
  openSheet('Shift journal', `<div class="journal">${entries.length ? entries.map((e) => `<article class="jentry"><span class="tone ${e.tone ?? 'bad'}"></span><div><small>Week ${e.week} · ${esc(e.source)}</small><p><b>${esc(e.label)}</b></p>${e.out ? `<p>${esc(e.out)}</p>` : ''}<div class="chips" style="margin-top:8px">${Object.entries(e.fx).filter(([, v]) => v).map(([k, v]) => `<span class="chip ${v > 0 ? 'up' : 'down'}">${icon(k, { size: 14 })}${METERS.find((m) => m.id === k).name} ${sign(v)}</span>`).join('')}</div></div></article>`).join('') : '<p class="empty">No decisions yet. Your choices and their effects will be listed here.</p>'}</div>`);
}
function meterSheet(id) {
  const s = store.run, m = METERS.find((x) => x.id === id);
  const items = s.log.filter((e) => e.fx[id] && (e.week === s.week || (s.phase === 'report' && e.week === s.week)));
  const last = s.log.filter((e) => e.fx[id] && e.week === s.week - 1);
  const weekly = weeklyItems(s.policy, s.flags).filter((i) => i.fx[id]);
  const list = (arr) => arr.length ? `<ul class="why-list" style="padding:0">${arr.map((e) => `<li><span class="amt ${e.fx[id] > 0 ? 'up' : 'down'}">${sign(e.fx[id])}</span><span>${esc(e.label)}<small>${esc(e.source)}</small></span></li>`).join('')}</ul>` : '<p class="empty">Nothing yet.</p>';
  openSheet(`${m.long}: ${s.meters[id]}`, `<p>${esc(m.hint)}</p>
    <section class="sheet-section"><h3>This week so far</h3>${list(items)}</section>
    ${last.length ? `<section class="sheet-section"><h3>Last week</h3>${list(last)}</section>` : ''}
    <section class="sheet-section"><h3>At the end of every week</h3>${list(weekly)}</section>`);
}
function inspect(hit) {
  const s = store.run; if (!s) return;
  if (hit.type === 'person') return personSheet(hit.id);
  const p = s.policy;
  const recorded = {
    individual: ['Who picked each item, when, and how fast', 'Where each worker stood, all shift', 'Every pause longer than a minute'],
    aggregate: ['Which zone each pick came from', 'Its own route, speed, battery and stops', 'The worker on the current task, until the task closes'],
    off: ['Its own route, speed, battery and stops', 'Nothing about people. It senses them only to steer around them'],
  }[p.tracking];
  const sees = { individual: 'Supervisors, HR and HQ: anyone with a dashboard login', aggregate: 'Managers see zone totals for groups of five or more', off: 'Fleet engineers see robot health' }[p.tracking];
  const kept = { forever: 'Forever', ninety: '90 days', shift: 'Links to people erased when the shift ends' }[p.retention];
  const inv = { everything: 'Investigators can open any worker’s full history', staged: 'Robot logs first; a reviewer can unlock the minimum ID data for one incident', robotOnly: 'Robot logs only, never anyone’s identity' }[p.incident];
  if (hit.type === 'robot') {
    return openSheet(`Robot ${String(hit.id + 1).padStart(2, '0')}`, `<div class="inspect"><span class="robot-badge">${icon('robot', { size: 48 })}</span><div><p class="quote">An autonomous mobile robot. It brings a tote to each picker and carries it to Priya at the handoff.</p>
      <div class="facts"><div class="fact"><b>What it records</b><ul>${recorded.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div><div class="fact"><b>Who can see it</b>${esc(sees)}</div><div class="fact"><b>How long it’s kept</b>${esc(kept)}</div><div class="fact"><b>After a near-miss</b>${esc(inv)}</div></div></div></div>`);
  }
  if (hit.type === 'cabinet') {
    const f = s.flags, files = [];
    files.push({ individual: 'Named pick-rate and location histories for every worker', aggregate: 'Zone and shift totals', off: 'Robot maintenance logs only' }[p.tracking]);
    if (f.paperProfile) files.push('A hand-made spreadsheet of Tim’s pick rate');
    if (f.sentHistory) files.push('Priya’s full shift history, forwarded to Dana');
    if (f.hrFishing) files.push('A map of Kofi’s bathroom trips');
    if (f.linkable) files.push('Robot 07’s totals — which everyone knows are Tim’s');
    if (f.autoWarnings) files.push('Automatic warning records');
    if (f.firedTom) files.push('The report used to fire Tom');
    if (f.hidLeak) files.push('A copy of these logs, still sitting in a leaked vendor folder');
    if (f.patched) files.push('The closed incident file for Priya’s near-miss (robot logs only)');
    return openSheet('Records', `<p class="quote">Everything the system keeps ends up here. The fuller it gets, the more there is to misuse, leak or repurpose.</p><div class="facts"><div class="fact"><b>On file right now</b><ul>${files.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div><div class="fact"><b>How long it’s kept</b>${esc(kept)}</div></div>`);
  }
  if (hit.type === 'tv') {
    const t = { ranking: 'A live leaderboard: names, ranks, a bonus line and a warning line. Everyone can see it.', team: 'One shared progress bar. No names, but everyone’s bonus depends on everyone else.', fixed: 'Today’s notes. No rankings, no countdown.' }[p.targets];
    return openSheet('The floor screen', `<p class="quote">${esc(t)}</p><p class="fine" style="margin-top:10px">What a screen rewards is what people optimise for, including skipping water and not helping new hires.</p>`);
  }
  if (hit.type === 'office') {
    return openSheet('Your office', `<p class="quote">Your dashboard shows: ${esc({ individual: 'every worker by name, with pick rates and a live map.', aggregate: 'zone totals and a heat map, no names.', off: 'robot status only. Nothing about people.' }[p.tracking])}</p><p class="fine" style="margin-top:10px">Switch to Manager view on the floor to see it for yourself.</p>`);
  }
  if (hit.type === 'break') {
    const t = p.targets === 'ranking' && !s.flags.boardDown ? 'Under the leaderboard, Tim and Ana barely come in. Every minute here costs them a rank.' : p.targets === 'team' ? 'People come for water, but some check the team target first.' : 'People come and go on schedule. Breaks never count against anyone.';
    const board = { none: 'The notice board has a lunch menu and nothing about the robots.', notice: 'A poster explains what the robots record and why.', rights: 'Posters explain what’s recorded, and how to see your own records and appeal.' }[p.notice];
    return openSheet('Break room', `<p class="quote">${esc(t)}</p><p style="margin-top:10px">${esc(board)}</p>`);
  }
}
function personSheet(id) {
  const s = store.run;
  if (id === 'dana' || id === 'lin') {
    const p = s.policy;
    const t = id === 'dana' ? `Shift supervisor. Under your rulebook she can see ${({ individual: 'every worker’s pace, location and breaks', aggregate: 'zone totals, no names', off: 'robot status only' })[p.tracking]}.` : `Data engineer. She keeps the robot logs running. Under your rulebook, people data is ${({ forever: 'kept forever', ninety: 'kept 90 days', shift: 'erased every night' })[p.retention]}.`;
    return openSheet(`${PEOPLE[id].name} · ${PEOPLE[id].role}`, `<div class="inspect">${portrait(id, 'ok', { size: 96 })}<div><p class="quote">${esc(t)}</p></div></div>`);
  }
  const g = GENERIC[id];
  const v = personView(id, s);
  const name = g ? g.name : PEOPLE[id].name, role = g ? g.role : PEOPLE[id].role;
  const art = g ? `<span class="robot-badge">${icon('person', { size: 48 })}</span>` : portrait(id, v.mood, { size: 96 });
  openSheet(`${esc(name)} · ${esc(role)}`, `<div class="inspect">${art}<div><p class="quote">“${esc(v.thought.replace(/^\(|\)$/g, ''))}”</p>
    <div class="facts"><div class="fact"><b>What the system records about ${esc(name)}</b><ul>${v.logged.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div><div class="fact"><b>Does ${esc(name)} know?</b>${esc(v.knows)}</div></div></div></div>`);
}
function confirmSheet(title, text, act, label) {
  openSheet(title, `<p>${esc(text)}</p><div class="confirm-actions"><button class="btn btn-ghost" data-act="close-sheet">Cancel</button><button class="btn btn-primary" data-act="${act}">${label}</button></div>`);
}

// ------------------------------------------------------------- tutorial
const COACH = [
  { sel: '.meters-block', title: 'Five meters', text: 'Orders, Safety, Health, Privacy and Trust. If any hits zero, the run is over. Finish week 5 with all five above the 50 line to win.' },
  { sel: '.stage-tools', title: 'Two sides of the same data', text: 'Manager view shows what the dashboard sees. Worker view shows what people are thinking. Click anyone or anything on the floor to inspect it.' },
  { sel: '.crew-block', title: 'The crew', text: 'Tim, Priya and Tom are the three stories this game is built on. Watch how your rulebook changes their weeks.' },
];
function startTutorial(i = 0) {
  document.querySelector('.coach')?.remove();
  if (i >= COACH.length) { store.tutorial = true; save(); return step(); }
  const c = COACH[i], el = app.querySelector(c.sel);
  if (!el) return startTutorial(i + 1);
  el.scrollIntoView({ block: 'nearest' });
  const r = el.getBoundingClientRect();
  const box = document.createElement('div'); box.className = 'coach'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', c.title);
  const right = r.right + 360 < innerWidth;
  const tipX = right ? r.right + 16 : Math.max(12, Math.min(innerWidth - 352, r.left));
  const tipY = right ? Math.max(12, Math.min(innerHeight - 220, r.top)) : Math.min(innerHeight - 220, r.bottom + 14);
  box.innerHTML = `<div class="coach-hole" style="left:${r.left - 6}px;top:${r.top - 6}px;width:${r.width + 12}px;height:${r.height + 12}px"></div><div class="coach-tip" style="left:${tipX}px;top:${tipY}px"><strong>${c.title}</strong><p>${c.text}</p><div class="row"><small>${i + 1} of ${COACH.length}</small><button class="btn btn-primary btn-small" data-coach="${i + 1}">${i + 1 === COACH.length ? 'Clock in' : 'Next'}</button></div></div>`;
  document.body.appendChild(box);
  box.querySelector('button').focus();
  box.addEventListener('click', (e) => { const b = e.target.closest('[data-coach]'); if (b) startTutorial(Number(b.dataset.coach)); });
}

// ------------------------------------------------------------- actions
function startRun(policy) {
  store.lastPolicy = normalizePolicy(policy);
  store.run = { ...newRun(policy), id: Date.now() };
  ui.bannerWeek = 0; ui.view = 'floor'; ui.openRows.clear();
  save();
  go('play');
}
function act(a, d, el) {
  switch (a) {
    case 'new':
      if (store.run && store.run.phase !== 'ending') return confirmSheet('Start over?', 'Your current run will be replaced. Endings you’ve found stay saved.', 'new-confirm', 'Start over');
      ui.rbMode = 'start'; ui.draft = null;
      if (!store.history.length && !store.tutorial) { go('rulebook'); return howToPlay(true); }
      return go('rulebook');
    case 'new-confirm': sheet.close(); store.run = null; save(); ui.rbMode = 'start'; ui.draft = null; return go('rulebook');
    case 'resume': ui.bannerWeek = store.run.week; return go('play');
    case 'home': if (sheet.open) sheet.close(); return go('title');
    case 'how': return howToPlay();
    case 'rules': return rulesSheet();
    case 'journal': return journalSheet();
    case 'collection': if (sheet.open) sheet.close(); return go('collection');
    case 'close-sheet': return sheet.close();
    case 'preset': ui.draft = normalizePolicy(PRESETS.find((p) => p.id === d.id).policy); return updateRulebook();
    case 'clockin': return startRun(ui.draft);
    case 'apply-rules': store.run = changePolicy(store.run, ui.draft); save(); ui.draft = null; ui.bannerWeek = store.run.week; go('play'); return;
    case 'cancel-rules': ui.draft = null; ui.bannerWeek = store.run.week; return go('play');
    case 'view-rules': if (store.run.phase === 'report') { ui.rbMode = 'edit'; ui.draft = null; return go('rulebook'); } return rulebookReadOnly();
    case 'edit-rules': ui.rbMode = 'edit'; ui.draft = null; return go('rulebook');
    case 'view': ui.view = d.v; app.querySelectorAll('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === ui.view))); refreshFloor(); { const cap = app.querySelector('#view-cap'); if (cap) cap.innerHTML = viewCaption(store.run); } say(`${el.textContent.trim()}. ${app.querySelector('#view-cap')?.textContent ?? ''}`); return;
    case 'skip': clearTimers(); return showIncoming();
    case 'banner-go': clearTimers(); return step();
    case 'open-card': clearTimers(); return showEvent();
    case 'choose': return doChoose(d.id);
    case 'continue': return doContinue();
    case 'peek': ui.cardHidden = true; overlay(`<button class="btn btn-dark peek-pill" data-act="unpeek">${icon('back', { size: 18 })} Back to the call</button>`); return;
    case 'unpeek': return store.run.phase === 'event' ? showEvent() : showOutcome();
    case 'why': ui.openRows.has(d.id) ? ui.openRows.delete(d.id) : ui.openRows.add(d.id); return showReport();
    case 'next-week': store.run = nextWeek(store.run); save(); ui.openRows.clear(); overlay(''); updateRail(); return step();
    case 'meter': return meterSheet(d.id);
    case 'person': return personSheet(d.id);
    case 'replay-edit': ui.rbMode = 'start'; ui.draft = normalizePolicy(store.run.policy); store.run = null; save(); return go('rulebook');
    case 'replay-same': return startRun(store.run.startPolicy);
  }
}
function rulebookReadOnly() {
  const s = store.run;
  openSheet('Your rulebook', `<p class="fine">You can change it at the end of each week.</p><div class="facts">${DIALS.map((d) => { const o = option(d.id, s.policy[d.id]); return `<div class="fact"><b>${d.name} · ${esc(d.q)}</b><strong>${o.name}</strong> — ${esc(o.desc)}<div class="fx">${fxPills(o.fx)}</div></div>`; }).join('')}</div><p class="plain" style="margin-top:14px">${esc(policySummary(s.policy))}</p>`);
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (b && !b.disabled) act(b.dataset.act, b.dataset, b);
});
document.addEventListener('change', (e) => {
  if (screen === 'rulebook' && e.target.matches('.opt input')) { ui.draft = normalizePolicy({ ...ui.draft, [e.target.name]: e.target.value }); updateRulebook(); }
});
document.addEventListener('pointerover', (e) => { const c = e.target.closest('.choice'); if (c) previewMeters(JSON.parse(c.dataset.fx)); });
document.addEventListener('pointerout', (e) => { if (e.target.closest('.choice')) previewMeters(null); });
document.addEventListener('focusin', (e) => { const c = e.target.closest('.choice'); previewMeters(c ? JSON.parse(c.dataset.fx) : null); });
document.addEventListener('keydown', (e) => {
  if (sheet.open || document.querySelector('.coach') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (screen !== 'play' || !store.run) return;
  if (ui.stage === 'event' && !ui.cardHidden && /^[1-3]$/.test(e.key)) { const btn = app.querySelectorAll('.choice')[Number(e.key) - 1]; if (btn) { e.preventDefault(); btn.click(); } }
  else if (e.key === 'Enter' && ['running', 'incoming', 'banner'].includes(ui.stage) && !e.target.closest('button')) { e.preventDefault(); clearTimers(); showEvent(); }
});
sheet.addEventListener('close', () => { if (screen === 'rulebook' && !store.tutorial && !store.history.length) app.querySelector('.preset')?.focus(); });

if (!storageOk) console.info('Progress can’t be saved in this browser. The game still works for this visit.');
go('title');
