// The Next Shift — the living warehouse floor (Canvas 2D, no assets).
// Purely illustrative: it reflects the game state but never changes it.
import { PEOPLE } from './shift-content.mjs';

const W = 1200, H = 720;
const C = {
  concrete: '#CEC9BE', concreteDark: '#C2BCB0', joint: 'rgba(120,110,95,.13)', wall: '#24313A', wallTop: '#33434E',
  paint: '#E9B92F', paintDim: 'rgba(233,185,47,.55)', upright: '#2D5C8C', beam: '#E7802D', deck: '#93A0A8',
  robotBase: '#2B363E', robotBody: '#F5F2EA', robotAccent: '#EA6A2A', ink: '#1E2B33', go: '#3FBF69', warn: '#F2B530', stop: '#E0483A',
  kraft: ['#C99B62', '#D9B27C', '#B8864E', '#CFA56E', '#3E7CB1', '#8C979E'], office: '#E2DCCF', glass: 'rgba(160,205,214,.35)',
  wood: '#E1CBA6', woodLine: 'rgba(150,110,60,.18)', data: '#4FB3E8', dataHot: '#F07A3A',
};
const FONT = (w, s) => `${w} ${s}px "Barlow Condensed", "Arial Narrow", sans-serif`;
const AISLES = [{ y: 180, name: 'AISLE 5' }, { y: 298, name: 'AISLE 6' }, { y: 416, name: 'AISLE 7' }];
const RACKS = [96, 214, 332, 450];
const RX0 = 392, RX1 = 1060;
const LEFT = 342, RIGHT = 1080, BOTTOM = 560, LANE = 13;
const HANDOFF_X = 960;
const CABINET = { x: 258, y: 62, w: 66, h: 132 };
const COOLER = { x: 64, y: 572 };
const BREAK_DOOR = { x: 300, y: 650 };

const CREW = [
  { id: 'tim', aisle: 2, x: 640 },
  { id: 'ana', aisle: 2, x: 812 },
  { id: 'tom', aisle: 1, x: 540 },
  { id: 'sam', aisle: 1, x: 900, look: { skin: '#8D5A3B', hair: 'crop', hairColor: '#161010', vest: true } },
  { id: 'kofi', aisle: 0, x: 720 },
  { id: 'lee', aisle: 0, x: 480, look: { skin: '#E8C09A', hair: 'long', hairColor: '#C9873F', vest: true } },
  { id: 'priya', station: { x: HANDOFF_X, y: 628 } },
  { id: 'jo', station: { x: 1084, y: 704 }, look: { skin: '#C48A60', hair: 'curly', hairColor: '#20140E', vest: true } },
  { id: 'dana', station: { x: 250, y: 246 }, staff: true },
  { id: 'lin', station: { x: 196, y: 246 }, staff: true },
];

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rr(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
const fillRR = (g, x, y, w, h, r, c) => { g.fillStyle = c; rr(g, x, y, w, h, r); g.fill(); };
const ell = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
const circ = (g, x, y, r, c) => ell(g, x, y, r, r, c);
function label(g, text, x, y, { size = 14, color = 'rgba(30,43,51,.55)', weight = 700, align = 'left', spacing = 1.2 } = {}) {
  g.font = FONT(weight, size); g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle';
  if ('letterSpacing' in g) g.letterSpacing = `${spacing}px`;
  g.fillText(text, x, y);
  if ('letterSpacing' in g) g.letterSpacing = '0px';
}

// ---------------------------------------------------------------- static layer
function drawStatic(g, m) {
  const r = rng(7);
  g.fillStyle = C.concrete; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(60,50,40,.06)'; const s = 1 + r() * 2.2; g.fillRect(r() * W, 44 + r() * (H - 44), s, s); }
  g.strokeStyle = C.joint; g.lineWidth = 1;
  for (let x = 0; x < W; x += 80) { g.beginPath(); g.moveTo(x + 0.5, 44); g.lineTo(x + 0.5, H); g.stroke(); }
  for (let y = 44; y < H; y += 80) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }

  // robot lanes and walkway paint
  g.strokeStyle = C.paintDim; g.lineWidth = 3; g.setLineDash([16, 12]);
  for (const a of AISLES) { g.beginPath(); g.moveTo(LEFT - 6, a.y + 13); g.lineTo(RIGHT + 6, a.y + 13); g.stroke(); }
  g.beginPath(); g.moveTo(LEFT + LANE, AISLES[0].y); g.lineTo(LEFT + LANE, BOTTOM + LANE * 2 + 10); g.stroke();
  g.beginPath(); g.moveTo(RIGHT + LANE, AISLES[0].y); g.lineTo(RIGHT + LANE, BOTTOM + LANE * 2 + 10); g.stroke();
  g.beginPath(); g.moveTo(LEFT, BOTTOM + LANE); g.lineTo(RIGHT + LANE * 2, BOTTOM + LANE); g.stroke();
  g.setLineDash([]);
  g.fillStyle = C.paint; g.fillRect(LEFT - 22, 196, 4, 420); g.fillRect(RIGHT + 44, 150, 4, 400); g.fillRect(LEFT - 22, BOTTOM + 52, 640, 4);
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(245,245,240,.55)'; g.fillRect(LEFT - 16 + i * 10, BOTTOM + 30, 6, 20); }
  for (const a of AISLES) label(g, a.name, LEFT + 54, a.y + 13, { size: 15, color: 'rgba(160,120,10,.75)', spacing: 2.5 });

  // top wall + windows
  g.fillStyle = C.wall; g.fillRect(0, 0, W, 44); g.fillStyle = C.wallTop; g.fillRect(0, 0, W, 6);
  for (let x = 860; x < 1180; x += 70) { fillRR(g, x, 12, 50, 18, 3, '#4D6472'); g.fillStyle = 'rgba(200,225,235,.35)'; g.fillRect(x + 4, 15, 20, 12); }
  label(g, 'BAMAZON  ·  PIT-7 FULFILLMENT', 24, 24, { size: 13, color: 'rgba(240,235,220,.55)', spacing: 3 });

  // office
  fillRR(g, 22, 54, 224, 156, 6, C.office);
  g.strokeStyle = 'rgba(30,43,51,.06)'; for (let x = 30; x < 244; x += 18) { g.beginPath(); g.moveTo(x, 56); g.lineTo(x, 208); g.stroke(); }
  fillRR(g, 64, 96, 120, 34, 5, '#B48A5A'); fillRR(g, 64, 126, 120, 6, 3, '#9B7448');
  fillRR(g, 98, 98, 40, 22, 3, C.ink); fillRR(g, 114, 120, 8, 6, 2, '#5B6770');
  fillRR(g, 150, 104, 22, 14, 2, '#F4F1EA');
  circ(g, 214, 76, 12, '#4E8B5B'); circ(g, 206, 70, 8, '#62A06E'); circ(g, 222, 82, 7, '#3E7A4B'); fillRR(g, 206, 82, 16, 12, 3, '#9C6B45');
  fillRR(g, 34, 160, 46, 34, 4, '#8D99A1'); fillRR(g, 36, 162, 42, 8, 2, '#A9B4BB');
  g.fillStyle = C.glass; g.fillRect(22, 54, 224, 156);
  g.strokeStyle = '#7FA9B3'; g.lineWidth = 3; g.beginPath(); g.moveTo(22, 54); g.lineTo(22, 210); g.lineTo(184, 210); g.moveTo(222, 210); g.lineTo(246, 210); g.lineTo(246, 54); g.stroke();
  label(g, 'OFFICE', 34, 200, { size: 12, color: 'rgba(30,43,51,.5)', spacing: 2 });

  // records cabinet
  const cb = CABINET;
  fillRR(g, cb.x + 4, cb.y + 6, cb.w, cb.h, 6, 'rgba(20,28,34,.22)');
  fillRR(g, cb.x, cb.y, cb.w, cb.h, 6, '#2B3A42'); fillRR(g, cb.x + 4, cb.y + 4, cb.w - 8, cb.h - 8, 4, '#33454F');
  label(g, 'RECORDS', cb.x + cb.w / 2, cb.y + cb.h + 12, { size: 12, align: 'center', color: 'rgba(30,43,51,.6)', spacing: 2 });
  if (m.dataLevel > 0.55) {
    const n = Math.round((m.dataLevel - 0.55) * 16);
    for (let i = 0; i < n; i++) { const bx = cb.x + cb.w + 6 + (i % 3) * 22, by = cb.y + cb.h - 18 - Math.floor(i / 3) * 16; fillRR(g, bx, by, 20, 15, 2, i % 2 ? '#C99B62' : '#D9B27C'); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(bx + 4, by + 5, 12, 3); }
  }

  // charging dock
  fillRR(g, 20, 250, 92, 220, 6, 'rgba(30,43,51,.08)');
  for (let i = 0; i < 4; i++) { fillRR(g, 30, 262 + i * 52, 72, 40, 5, '#B9B3A6'); g.strokeStyle = C.paint; g.lineWidth = 2; rr(g, 30, 262 + i * 52, 72, 40, 5); g.stroke(); g.fillStyle = 'rgba(160,120,10,.65)'; g.beginPath(); const lx = 92, ly = 270 + i * 52; g.moveTo(lx, ly); g.lineTo(lx - 5, ly + 9); g.lineTo(lx - 1, ly + 9); g.lineTo(lx - 4, ly + 17); g.lineTo(lx + 3, ly + 7); g.lineTo(lx - 1, ly + 7); g.closePath(); g.fill(); }
  label(g, 'CHARGING', 66, 484, { size: 12, align: 'center', color: 'rgba(30,43,51,.5)', spacing: 2 });

  // racks
  for (let i = 0; i < RACKS.length; i++) drawRack(g, RACKS[i], r, m.fill);

  // break room
  fillRR(g, 20, 520, 284, 192, 6, C.wood);
  g.strokeStyle = C.woodLine; g.lineWidth = 1; for (let y = 534; y < 712; y += 14) { g.beginPath(); g.moveTo(22, y); g.lineTo(302, y); g.stroke(); }
  g.fillStyle = '#7C8A92'; g.fillRect(20, 516, 284, 8); g.fillRect(300, 516, 6, 110); g.fillRect(300, 676, 6, 40);
  fillRR(g, 30, 532, 118, 26, 4, '#B9B1A2'); fillRR(g, 34, 535, 26, 20, 3, '#5F6B72'); circ(g, 47, 545, 4, '#2B363E');
  fillRR(g, COOLER.x - 12, COOLER.y - 4, 24, 26, 4, '#EDEAE2'); fillRR(g, COOLER.x - 9, COOLER.y - 24, 18, 22, 7, 'rgba(120,190,225,.85)'); fillRR(g, COOLER.x - 9, COOLER.y - 24, 18, 6, 3, 'rgba(90,160,200,.9)');
  ell(g, 170, 626, 54, 30, 'rgba(20,28,34,.12)'); ell(g, 168, 620, 52, 28, '#C2925F'); ell(g, 168, 617, 46, 23, '#CFA06C');
  for (const [cx, cy] of [[110, 620], [226, 620], [168, 580], [168, 662]]) { circ(g, cx, cy, 11, '#6D7A82'); circ(g, cx, cy - 2, 9, '#85929A'); }
  fillRR(g, 40, 676, 120, 26, 8, '#5F7A6A'); fillRR(g, 44, 672, 112, 12, 6, '#6E8A79');
  fillRR(g, 176, 527, 116, 4, 2, '#8D6B43');
  label(g, 'BREAK ROOM', 210, 700, { size: 12, color: 'rgba(90,60,30,.55)', spacing: 2 });

  // notice board posters
  fillRR(g, 182, 523, 104, 6, 2, '#B08654');
  if (m.notice !== 'none') { fillRR(g, 188, 509, 40, 18, 2, '#FBF8EE'); g.fillStyle = '#2F5F8F'; g.fillRect(192, 513, 32, 3); g.fillStyle = 'rgba(30,43,51,.4)'; g.fillRect(192, 519, 26, 2); g.fillRect(192, 523, 22, 2); }
  if (m.notice === 'rights') { fillRR(g, 236, 509, 40, 18, 2, '#FFF4C7'); g.fillStyle = '#3F9A5D'; g.fillRect(240, 513, 10, 10); g.fillStyle = 'rgba(30,43,51,.4)'; g.fillRect(254, 514, 18, 2); g.fillRect(254, 519, 14, 2); }

  // handoff + conveyor + shipping
  g.fillStyle = 'rgba(233,185,47,.25)'; g.fillRect(HANDOFF_X - 34, BOTTOM - 8, 68, LANE * 3 + 18);
  g.strokeStyle = C.paint; g.lineWidth = 2; g.strokeRect(HANDOFF_X - 34, BOTTOM - 8, 68, LANE * 3 + 18);
  label(g, 'HANDOFF', HANDOFF_X, BOTTOM - 18, { size: 12, align: 'center', color: 'rgba(160,120,10,.85)', spacing: 2 });
  fillRR(g, 990, 636, 124, 26, 5, '#56636B'); fillRR(g, 994, 640, 116, 18, 3, '#6B7880');
  fillRR(g, 996, 674, 66, 26, 4, '#B48A5A'); fillRR(g, 1004, 678, 18, 12, 2, '#D9B27C'); fillRR(g, 1030, 680, 22, 14, 2, '#C99B62');
  label(g, 'SHIPPING', 1172, 612, { size: 12, align: 'right', color: 'rgba(30,43,51,.5)', spacing: 2 });
  g.fillStyle = '#3C4A53'; g.fillRect(1192, 560, 8, 150);
  const pile = Math.round(m.output / 9);
  for (let i = 0; i < pile; i++) { const bx = 1124 + (i % 3) * 19 - (Math.floor(i / 3) % 2) * 5, by = 708 - Math.floor(i / 3) * 12; fillRR(g, bx, by - 12, 17, 12, 2, i % 2 ? '#C99B62' : '#D9B27C'); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(bx + 3, by - 8, 10, 2); }
}

function drawRack(g, y, r, fill) {
  const h = 40;
  g.fillStyle = 'rgba(20,28,34,.16)'; g.fillRect(RX0 + 4, y + 8, RX1 - RX0, h + 8);
  g.fillStyle = C.deck; g.fillRect(RX0, y, RX1 - RX0, h);
  const bays = 12, bw = (RX1 - RX0) / bays;
  for (let b = 0; b < bays; b++) {
    const bx = RX0 + b * bw;
    for (let s = 0; s < 3; s++) {
      if (r() > 0.42 + fill * 0.5) continue;
      const w = 12 + r() * 14, hh = 9 + r() * 4, ox = bx + 6 + r() * (bw - w - 12), oy = y + 4 + s * 12;
      const col = C.kraft[Math.floor(r() * C.kraft.length)];
      fillRR(g, ox, oy, w, hh, 2, col); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(ox + 1, oy + 1, w - 2, 2);
    }
  }
  g.fillStyle = C.beam; g.fillRect(RX0, y - 2, RX1 - RX0, 4); g.fillRect(RX0, y + h - 2, RX1 - RX0, 4);
  g.fillStyle = '#B5611F'; g.fillRect(RX0, y + h + 2, RX1 - RX0, 9);
  for (let b = 0; b <= bays; b++) { const bx = RX0 + b * bw - 3; g.fillStyle = C.upright; g.fillRect(bx, y - 4, 6, h + 15); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(bx + 1, y - 4, 1.5, h + 15); }
}

// ------------------------------------------------------------------- people
function lookFor(member) {
  if (member.look) return member.look;
  const p = PEOPLE[member.id];
  return { skin: p.skin, hair: p.hair, hairColor: p.hairColor, vest: Boolean(p.vest), top: p.top, glasses: p.glasses, beard: p.beard };
}
function drawPerson(g, x, y, look, o) {
  const t = o.t, walking = o.walking;
  const bob = walking ? Math.abs(Math.sin(t * 11)) * 1.6 : Math.sin(t * 2 + o.seed) * 0.5;
  const step = walking ? Math.sin(t * 11) * 2.6 : 0;
  ell(g, x, y + 1, 10, 3.6, 'rgba(20,28,34,.22)');
  if (o.ring) { g.strokeStyle = o.ring; g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y + 1, 15 + Math.sin(t * 5) * 1.5, 6, 0, 0, Math.PI * 2); g.stroke(); }
  const top = y - 31 - bob;
  if (o.sit) {
    fillRR(g, x - 7, y - 14, 14, 8, 3, '#39434D');
  } else {
    fillRR(g, x - 5, y - 11 + Math.max(0, step), 4, 11 - Math.max(0, step), 2, '#39434D');
    fillRR(g, x + 1, y - 11 + Math.max(0, -step), 4, 11 - Math.max(0, -step), 2, '#39434D');
    fillRR(g, x - 6, y - 1.5 + Math.max(0, step) * 0 - 0.5, 6, 3, 1.5, '#1F262C'); fillRR(g, x, y - 2, 6, 3, 1.5, '#1F262C');
  }
  const ty = o.sit ? y - 24 - bob : y - 24 - bob;
  const shirt = look.vest ? '#3A4651' : look.top ?? '#3A4651';
  // arms
  const sw = walking ? Math.sin(t * 11) * 2.5 : 0;
  if (o.reach > 0) {
    g.save(); g.translate(x + 6, ty + 3); g.rotate(-1.9 * o.reach); fillRR(g, -1.8, -1, 3.6, 11, 1.8, shirt); circ(g, 0, 10.5, 2.2, look.skin); g.restore();
  } else fillRR(g, x + 6, ty + 2 - sw, 3.4, 10, 1.7, shirt), circ(g, x + 7.7, ty + 12 - sw, 2, look.skin);
  fillRR(g, x - 9.4, ty + 2 + sw, 3.4, 10, 1.7, shirt); circ(g, x - 7.7, ty + 12 + sw, 2, look.skin);
  fillRR(g, x - 7, ty, 14, 15, 5, shirt);
  if (look.vest) {
    fillRR(g, x - 7, ty, 14, 14, 5, '#F2C230'); g.fillStyle = shirt; g.beginPath(); g.moveTo(x - 2.5, ty); g.lineTo(x, ty + 5); g.lineTo(x + 2.5, ty); g.fill();
    g.fillStyle = '#E8EAEC'; g.fillRect(x - 7, ty + 7, 14, 2.2);
  }
  if (o.tablet) { fillRR(g, x + 3, ty + 4, 9, 7, 1.5, '#1E2B33'); g.fillStyle = '#6FC3E8'; g.fillRect(x + 4.5, ty + 5.5, 6, 4); }
  // head
  const hx = x, hy = top;
  if (['long', 'bob', 'bobblack'].includes(look.hair)) fillRR(g, hx - 8, hy - 7, 16, look.hair === 'long' ? 18 : 14, 6, look.hairColor);
  circ(g, hx, hy, 7.2, look.skin);
  g.fillStyle = look.hairColor;
  if (look.hair === 'curly') { for (const [dx, dy] of [[-5, -4], [-2, -6.5], [2, -6.5], [5, -4], [-6.5, 0], [6.5, 0]]) circ(g, hx + dx, hy + dy, 3.3, look.hairColor); }
  else { g.beginPath(); g.ellipse(hx, hy - 1.5, 7.6, 6.3, 0, Math.PI, 0); g.fill(); if (look.hair === 'shaved') { /* close crop */ } }
  if (look.hair === 'bun') circ(g, hx, hy - 9, 3.6, look.hairColor);
  if (look.beard) { g.beginPath(); g.ellipse(hx, hy + 2.5, 6.4, 4.8, 0, 0, Math.PI); g.fill(); }
  g.fillStyle = '#1C1410'; circ(g, hx - 2.5, hy + 0.5, 1.05, '#1C1410'); circ(g, hx + 2.5, hy + 0.5, 1.05, '#1C1410');
  if (look.glasses) { g.strokeStyle = '#1E2B33'; g.lineWidth = 0.9; g.beginPath(); g.arc(hx - 2.5, hy + 0.5, 2, 0, 7); g.moveTo(hx + 4.5, hy + 0.5); g.arc(hx + 2.5, hy + 0.5, 2, 0, 7); g.stroke(); }
  g.strokeStyle = look.beard ? '#F3D6C2' : '#5A2E22'; g.lineWidth = 1.1; g.beginPath();
  if (o.mood === 'happy') g.arc(hx, hy + 2.8, 2, 0.2, Math.PI - 0.2);
  else if (o.mood === 'upset') g.arc(hx, hy + 5.6, 2, Math.PI + 0.3, -0.3);
  else { g.moveTo(hx - 1.6, hy + 4); g.lineTo(hx + 1.6, hy + 4); }
  g.stroke();
  if (o.sweat) { g.fillStyle = '#8EC5E0'; g.beginPath(); const sx = hx + 8, sy = hy - 3 + ((t * 18) % 8); g.moveTo(sx, sy - 3); g.quadraticCurveTo(sx + 2.2, sy + 1, sx, sy + 2); g.quadraticCurveTo(sx - 2.2, sy + 1, sx, sy - 3); g.fill(); }
}

function drawRobot(g, x, y, ang, o) {
  ell(g, x + 2, y + 8, 18, 7, 'rgba(20,28,34,.22)');
  if (o.ring) { g.strokeStyle = o.ring; g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y + 4, 22, 9, 0, 0, Math.PI * 2); g.stroke(); }
  g.save(); g.translate(x, y); g.rotate(ang);
  fillRR(g, -16, -12, 32, 24, 8, C.robotBase);
  fillRR(g, -13.5, -10, 27, 20, 6, C.robotBody);
  fillRR(g, 9, -10, 4.5, 20, 2, C.robotAccent);
  fillRR(g, 13, -6, 2.5, 12, 1, '#1A242A');
  g.restore();
  fillRR(g, x - 1.5, y - 26, 3, 20, 1.5, '#55626B');
  fillRR(g, x - 10, y - 12, 20, 12, 3, o.tote ?? '#3E7CB1'); fillRR(g, x - 8, y - 11, 16, 4, 2, 'rgba(255,255,255,.22)');
  if (o.items) for (let i = 0; i < o.items; i++) fillRR(g, x - 7 + i * 5, y - 14, 4.5, 4, 1, C.kraft[i % 3]);
  fillRR(g, x - 8, y - 36, 16, 11, 2.5, '#1E2B33');
  g.fillStyle = o.screen; g.fillRect(x - 6, y - 34, 12, 7);
  const glow = 0.55 + 0.45 * Math.sin(o.t * 6 + o.seed);
  circ(g, x + 9, y - 36, 2.6, o.light); g.globalAlpha = 0.25 * glow; circ(g, x + 9, y - 36, 6, o.light); g.globalAlpha = 1;
  if (o.tag) label(g, o.tag, x, y + 1, { size: 10, align: 'center', color: '#1E2B33', weight: 700, spacing: 0.5 });
}

// -------------------------------------------------------------- the floor
export function createFloor(canvas, { onPick, interactive = true } = {}) {
  const g = canvas.getContext('2d');
  const staticCanvas = document.createElement('canvas');
  const sg = staticCanvas.getContext('2d');
  let dpr = 1, raf = 0, last = 0, t = 0, running = true, staticKey = '', hover = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let model = { policy: { tracking: 'aggregate', targets: 'team', incident: 'staged', notice: 'notice', retention: 'ninety' }, meters: { output: 60, safety: 60, health: 60, privacy: 60, trust: 60 }, flags: {}, week: 1, view: 'floor', spotlight: [], people: {}, scene: null, tv: null, dataLevel: 0.2, fill: 0.5 };
  let robots = [], walkers = [], packets = [], flyers = [], trails = {};

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const scale = rect.width / W;
    canvas.width = Math.round(W * scale * dpr); canvas.height = Math.round(H * scale * dpr);
    staticCanvas.width = canvas.width; staticCanvas.height = canvas.height;
    staticKey = '';
    if (reduced) frame(performance.now());
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  function scale() { return canvas.width / W; }

  function buildRobots() {
    const n = model.scene === 'walkout' ? 0 : Math.min(8, 3 + model.week + (model.week >= 3 ? 1 : 0));
    const prev = robots;
    robots = [];
    for (let i = 0; i < n; i++) {
      const aisle = i % 3, k = Math.floor(i / 3);
      const path = loopPath(aisle);
      const old = prev[i];
      robots.push(old && old.aisle === aisle ? old : { id: i, aisle, path, s: (path.len * (k * 0.5 + aisle * 0.17)) % path.len, pause: 0, stopIdx: -1, items: 0, seed: i * 1.7 });
    }
  }
  function loopPath(a) {
    const y = AISLES[a].y + 13, l = LEFT + a * LANE, rgt = RIGHT + a * LANE, b = BOTTOM + a * LANE;
    const pts = [[l, y], [rgt, y], [rgt, b], [l, b], [l, y]];
    const seg = []; let len = 0;
    for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; const d = Math.hypot(x1 - x0, y1 - y0); seg.push({ x0, y0, x1, y1, d, at: len, ang: Math.atan2(y1 - y0, x1 - x0) }); len += d; }
    const pick = CREW.filter((c) => c.aisle === a).map((c) => ({ s: c.x - l - 4, kind: 'pick', who: c.id }));
    const hand = { s: (rgt - l) + (b - y) + (rgt - HANDOFF_X), kind: 'hand', who: 'priya' };
    return { seg, len, stops: [...pick, hand].sort((p, q) => p.s - q.s) };
  }
  function posOn(path, s) {
    for (const sg of path.seg) if (s <= sg.at + sg.d) { const f = (s - sg.at) / sg.d; return { x: sg.x0 + (sg.x1 - sg.x0) * f, y: sg.y0 + (sg.y1 - sg.y0) * f, ang: sg.ang }; }
    const sg = path.seg.at(-1); return { x: sg.x1, y: sg.y1, ang: sg.ang };
  }

  function buildWalkers() {
    walkers = CREW.map((c, i) => {
      const home = c.station ?? { x: c.x, y: AISLES[c.aisle].y - 10 };
      const old = walkers.find((w) => w.id === c.id);
      return old ? { ...old, member: c, home } : { id: c.id, member: c, home, x: home.x, y: home.y, path: null, wait: 0, nextBreak: 6 + i * 3.1, reach: 0, seed: i * 2.3, onBreak: false };
    });
  }

  function breakEvery(id) {
    const p = model.policy, m = model.meters;
    if (model.scene) return 9999;
    if (p.targets === 'ranking' && ['tim', 'ana', 'tom', 'kofi'].includes(id) && !model.flags.boardDown) return 9999;
    if (p.targets === 'team' && id === 'tim' && !model.flags.boardDown) return 60;
    return 26 + (m.health < 40 ? -6 : 0);
  }
  function breakPath(w) {
    const out = [];
    const aisleY = w.member.aisle != null ? AISLES[w.member.aisle].y - 10 : null;
    if (aisleY != null) out.push([LEFT - 30, aisleY], [LEFT - 30, BREAK_DOOR.y]);
    else if (w.id === 'priya') out.push([HANDOFF_X, BOTTOM + 58], [LEFT - 30, BOTTOM + 58], [LEFT - 30, BREAK_DOOR.y]);
    else out.push([w.home.x, BOTTOM + 58], [LEFT - 30, BOTTOM + 58], [LEFT - 30, BREAK_DOOR.y]);
    out.push([BREAK_DOOR.x - 20, BREAK_DOOR.y], [COOLER.x + 22, COOLER.y + 30]);
    return out;
  }

  function setModel(next) {
    const weekChanged = next.week !== model.week || next.scene !== model.scene;
    model = { ...model, ...next };
    if (!robots.length || weekChanged) buildRobots();
    if (!walkers.length) buildWalkers();
    if (next.scene) arrangeScene();
    if (reduced) frame(performance.now());
  }
  function arrangeScene() {
    const sc = model.scene;
    walkers.forEach((w, i) => {
      w.path = null; w.wait = 0;
      if (sc === 'walkout') { w.x = 60 + (i % 5) * 46; w.y = i < 5 ? 600 : 668; }
      else if (sc === 'fair' && ['tim', 'ana', 'kofi'].includes(w.id)) { const spots = { tim: [120, 616], ana: [214, 616], kofi: [168, 586] }; [w.x, w.y] = spots[w.id]; w.sit = true; }
      else { w.x = w.home.x; w.y = w.home.y; w.sit = false; }
    });
  }

  function staticModelKey() {
    return [canvas.width, model.week, model.policy.notice, Math.round(model.dataLevel * 10), Math.round(model.meters.output / 9), model.scene].join('|');
  }

  // --------------------------------------------------------------- update
  function update(dt) {
    t += dt;
    const p = model.policy;
    const pace = p.targets === 'ranking' ? 1.25 : 1;
    const stalled = model.scene === 'blind' || model.scene === 'accident';
    for (const r of robots) {
      if (stalled && r.aisle === 2) continue;
      if (r.pause > 0) { r.pause -= dt; continue; }
      const ds = 92 * pace * dt;
      const next = r.path.stops.find((st, i) => i !== r.stopIdx && st.s > r.s && st.s <= r.s + ds);
      if (next) {
        r.s = next.s; r.stopIdx = r.path.stops.indexOf(next);
        const w = walkers.find((x) => x.id === next.who);
        const present = w && !w.path && Math.hypot(w.x - w.home.x, w.y - w.home.y) < 4 && !model.scene;
        if (present) {
          r.pause = next.kind === 'pick' ? 1.5 : 1.2; w.reach = 1;
          if (next.kind === 'pick') { r.items = Math.min(3, r.items + 1); flyers.push({ x0: w.x + 4, y0: w.y - 34, x1: posOn(r.path, r.s).x, y1: posOn(r.path, r.s).y - 14, t: 0 }); }
          else { flyers.push({ x0: posOn(r.path, r.s).x, y0: posOn(r.path, r.s).y - 12, x1: 1010, y1: 646, t: 0, tote: true }); r.items = 0; }
          if (p.tracking !== 'off' && Math.random() < (p.tracking === 'individual' ? 1 : 0.5)) emitPacket(posOn(r.path, r.s), p.tracking === 'individual');
          if (p.tracking === 'individual' && next.kind === 'pick') emitPacket({ x: w.x, y: w.y - 30 }, true);
        }
      } else {
        r.s = (r.s + ds) % r.path.len;
        if (r.s < ds) r.stopIdx = -1;
      }
    }
    for (const w of walkers) {
      w.reach = Math.max(0, w.reach - dt * 1.2);
      if (model.scene) continue;
      if (w.path) {
        const [tx, ty] = w.path[0];
        const speed = (model.meters.health < 35 ? 34 : 48) * dt;
        const d = Math.hypot(tx - w.x, ty - w.y);
        if (d <= speed) { w.x = tx; w.y = ty; w.path.shift(); if (!w.path.length) { w.path = null; if (w.onBreak) { w.wait = 4 + (w.seed % 2); } else w.nextBreak = breakEvery(w.id); } }
        else { w.x += ((tx - w.x) / d) * speed; w.y += ((ty - w.y) / d) * speed; }
        if (model.view === 'manager' && model.policy.tracking === 'individual' && !w.member.staff) { (trails[w.id] ??= []).push([w.x, w.y]); if (trails[w.id].length > 140) trails[w.id].shift(); }
      } else if (w.wait > 0) {
        w.wait -= dt;
        if (w.wait <= 0 && w.onBreak) { w.onBreak = false; w.path = [...breakPath(w)].reverse().slice(1).concat([[w.home.x, w.home.y]]); }
      } else if (!w.member.staff) {
        w.nextBreak -= dt;
        if (w.nextBreak <= 0) { if (breakEvery(w.id) >= 9999) w.nextBreak = 5; else { w.onBreak = true; w.path = breakPath(w); } }
      }
    }
    for (const f of flyers) f.t += dt * (f.tote ? 1.2 : 1.8);
    flyers = flyers.filter((f) => f.t < 1);
    for (const k of packets) k.t += dt * 0.7;
    packets = packets.filter((k) => k.t < 1);
    if (p.tracking !== 'off' && !model.scene && Math.random() < dt * (p.tracking === 'individual' ? 3 : 1)) {
      const r = robots[Math.floor(Math.random() * robots.length)]; if (r) emitPacket(posOn(r.path, r.s), p.tracking === 'individual');
    }
    if (model.scene === 'glass' && Math.random() < dt * 8) { const w = walkers[Math.floor(Math.random() * walkers.length)]; emitPacket({ x: w.x, y: w.y - 30 }, true); }
  }
  function emitPacket(from, hot) {
    if (packets.length > 60) return;
    packets.push({ x0: from.x, y0: from.y, cx: (from.x + CABINET.x) / 2 + 40, cy: Math.min(from.y, CABINET.y) - 60, t: 0, hot });
  }

  // ----------------------------------------------------------------- draw
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    if (!reduced && running) update(dt);
    const key = staticModelKey();
    if (key !== staticKey) { staticKey = key; sg.setTransform(scale(), 0, 0, scale(), 0, 0); drawStatic(sg, { ...model, ...model.meters, output: model.meters.output, notice: model.policy.notice, dataLevel: model.dataLevel, fill: model.fill }); }
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(staticCanvas, 0, 0);
    g.setTransform(scale(), 0, 0, scale(), 0, 0);
    drawCabinetLights(); drawTV(); drawConveyor();
    if (model.view === 'manager') drawManagerUnder();
    // depth sort robots + people by y
    const items = [];
    for (const r of robots) { const p = posOn(r.path, r.s); items.push({ y: p.y + 6, draw: () => drawRobotItem(r, p) }); }
    for (const w of walkers) if (!(w.member.staff && model.scene)) items.push({ y: w.y, draw: () => drawWalker(w) });
    drawYou();
    if (model.scene === 'walkout') for (let i = 0; i < 4; i++) drawRobot(g, 66, 290 + i * 52, Math.PI / 2, { t, seed: i, screen: '#DDE3E6', light: C.warn, tag: String(i + 1).padStart(2, '0'), items: 0 });
    items.sort((a, b) => a.y - b.y).forEach((i) => i.draw());
    for (const f of flyers) { const e = f.t, x = f.x0 + (f.x1 - f.x0) * e, y = f.y0 + (f.y1 - f.y0) * e - Math.sin(e * Math.PI) * 18; fillRR(g, x - 4, y - 3, f.tote ? 12 : 8, f.tote ? 8 : 6, 1.5, f.tote ? '#3E7CB1' : C.kraft[0]); }
    drawPackets();
    if (model.view === 'manager') drawManagerOver();
    if (model.view === 'workers') drawMinds();
    drawScene();
    drawSpotlight();
    if (hover && interactive) drawHover();
    if (!reduced && running) raf = requestAnimationFrame(frame);
  }

  function drawRobotItem(r, p) {
    const pol = model.policy;
    const screen = pol.tracking === 'individual' ? C.robotAccent : pol.tracking === 'aggregate' ? '#3FBF69' : '#DDE3E6';
    const stalled = (model.scene === 'blind' || model.scene === 'accident') && r.aisle === 2;
    const light = stalled ? C.stop : r.pause > 0 ? C.warn : C.go;
    const tag = String(r.id + 1).padStart(2, '0');
    const isHover = hover?.type === 'robot' && hover.id === r.id;
    drawRobot(g, p.x, p.y, p.ang, { t, seed: r.seed, screen, light, tag, items: r.items, ring: isHover ? 'rgba(30,43,51,.6)' : null });
    if (stalled && model.scene === 'blind') label(g, '?', p.x + 16, p.y - 40, { size: 22, color: '#E0483A', weight: 800 });
  }
  function drawWalker(w) {
    const look = lookFor(w.member);
    const mood = model.people[w.id]?.mood ?? (w.member.staff ? 'ok' : moodGeneric());
    const isHover = hover?.type === 'person' && hover.id === w.id;
    const spot = model.spotlight.includes(w.id);
    const tired = model.meters.health < 35 || (model.policy.targets === 'ranking' && ['tim', 'ana'].includes(w.id) && !model.flags.boardDown);
    if (w.id === 'tom' && model.flags.firedTom) return;
    drawPerson(g, w.x, w.y, look, { t, seed: w.seed, walking: Boolean(w.path), mood, reach: w.reach, sweat: tired && !model.scene, sit: w.sit, tablet: w.id === 'dana', ring: isHover ? 'rgba(30,43,51,.55)' : spot ? '#EA6A2A' : null });
    if (model.scene === 'walkout') { const sy = w.y - 54; fillRR(g, w.x - 1, sy + 8, 2, 16, 1, '#7A5A3A'); fillRR(g, w.x - 16, sy - 6, 32, 16, 2, '#FBF8EE'); label(g, ['FAIR DATA', 'NOT ROBOTS', 'ASK US', 'NO PROFILES', 'RESPECT'][w.seed % 5 | 0], w.x, sy + 2, { size: 8, align: 'center', color: '#B5432F', weight: 800, spacing: 0 }); }
  }
  function moodGeneric() {
    const m = model.meters; return m.trust < 25 || m.health < 25 ? 'upset' : m.trust < 45 || m.health < 45 ? 'worried' : m.trust > 70 ? 'happy' : 'ok';
  }
  function drawYou() {
    if (model.scene === 'replaced' || model.scene === 'fragile') { const look = { skin: '#D8A884', hair: 'part', hairColor: '#3A3A3A', top: '#26323B' }; drawPerson(g, 118, 92, look, { t, seed: 9, mood: 'ok', reach: 0 }); label(g, model.scene === 'fragile' ? 'NEXT MANAGER' : 'NEW MANAGER', 118, 46 + 8, { size: 10, align: 'center', color: 'rgba(30,43,51,.7)', spacing: 1 }); return; }
    const look = { skin: '#C99470', hair: 'side', hairColor: '#2A1D14', top: '#2F5F8F' };
    drawPerson(g, 118, 92, look, { t, seed: 3, mood: 'ok', reach: 0 });
    fillRR(g, 64, 96, 120, 34, 5, '#B48A5A'); fillRR(g, 98, 98, 40, 22, 3, C.ink);
    g.fillStyle = model.policy.tracking === 'individual' ? C.robotAccent : model.policy.tracking === 'aggregate' ? '#3FBF69' : '#7E8C94';
    for (let i = 0; i < 4; i++) g.fillRect(102 + i * 8, 116 - (6 + ((i * 7 + Math.floor(t)) % 9)), 5, 6 + ((i * 7 + Math.floor(t)) % 9));
    fillRR(g, 100, 134, 36, 16, 8, '#1E2B33'); label(g, 'YOU', 118, 142.5, { size: 11, align: 'center', color: '#F2C230', spacing: 1.5 });
  }
  function drawCabinetLights() {
    const cb = CABINET, lv = model.dataLevel;
    const rows = 10, lit = Math.round(lv * rows);
    for (let i = 0; i < rows; i++) {
      const y = cb.y + cb.h - 16 - i * 11.5;
      fillRR(g, cb.x + 9, y, cb.w - 18, 8, 2, i < lit ? (lv > 0.7 ? 'rgba(240,122,58,.9)' : 'rgba(79,179,232,.85)') : '#26343C');
      if (i < lit) { g.fillStyle = 'rgba(255,255,255,.5)'; const blink = (Math.sin(t * 8 + i) > 0.3); if (blink) g.fillRect(cb.x + cb.w - 16, y + 2, 3, 3); }
    }
    if (model.policy.retention === 'shift') { label(g, 'ERASED NIGHTLY', cb.x + cb.w / 2, cb.y + 12, { size: 9, align: 'center', color: '#9FE0B5', spacing: 0.5 }); }
    if (hover?.type === 'cabinet') { g.strokeStyle = 'rgba(30,43,51,.6)'; g.lineWidth = 2.5; rr(g, cb.x - 4, cb.y - 4, cb.w + 8, cb.h + 8, 8); g.stroke(); }
  }
  function drawTV() {
    const x = 452, y = 4, w = 300, h = 64;
    fillRR(g, x + 3, y + 5, w, h, 6, 'rgba(10,15,20,.35)');
    fillRR(g, x, y, w, h, 6, '#11181D'); fillRR(g, x + 4, y + 4, w - 8, h - 8, 4, '#18242B');
    const tv = model.tv;
    if (tv === 'hale') {
      label(g, 'VIDEO CALL · HQ', x + 14, y + 16, { size: 11, color: '#9FB1BC', spacing: 1.5 });
      circ(g, x + w - 52, y + 36, 18, '#DDAE88'); g.fillStyle = '#9AA0A4'; g.beginPath(); g.ellipse(x + w - 52, y + 28, 18, 11, 0, Math.PI, 0); g.fill(); fillRR(g, x + w - 76, y + 50, 48, 12, 5, '#26323B');
      label(g, 'Mr. Hale', x + 14, y + 38, { size: 18, color: '#F4F1EA', weight: 700, spacing: 0.5 });
      return;
    }
    const p = model.policy;
    if (model.scene === 'replaced') { label(g, 'UNDER NEW MANAGEMENT', x + w / 2, y + h / 2, { size: 20, align: 'center', color: '#F2C230', weight: 800, spacing: 2 }); return; }
    if (model.scene === 'paper') { label(g, 'OUTPUT ▲ 112%', x + w / 2, y + h / 2, { size: 26, align: 'center', color: '#3FBF69', weight: 800, spacing: 1 }); return; }
    if (p.targets === 'ranking') {
      label(g, 'LIVE LEADERBOARD', x + 12, y + 13, { size: 10, color: '#F2C230', spacing: 1.5 });
      const rows = [['Lee', 0.96], ['Kofi', 0.9], ['Tim', 0.86 + Math.sin(t) * 0.02], ['Sam', 0.8], ['Tom', 0.62]];
      rows.forEach(([n, v], i) => { const ry = y + 22 + i * 7.6; label(g, `${i + 1} ${n}`, x + 12, ry + 2, { size: 8, color: i === 4 ? '#F08A7A' : '#D7DEE2', spacing: 0.3 }); g.fillStyle = i === 4 ? C.stop : i < 2 ? C.go : '#6FA7D0'; g.fillRect(x + 54, ry - 1, (w - 120) * v, 5); });
      label(g, 'BONUS', x + w - 36, y + 26, { size: 9, align: 'center', color: '#3FBF69' }); label(g, 'WARNING', x + w - 36, y + 54, { size: 9, align: 'center', color: '#F08A7A' });
    } else if (p.targets === 'team') {
      label(g, 'SHIFT TARGET', x + 14, y + 16, { size: 11, color: '#9FB1BC', spacing: 1.5 });
      const v = 0.55 + 0.25 * ((t * 0.03) % 1);
      fillRR(g, x + 14, y + 30, w - 28, 16, 4, '#2A3943'); fillRR(g, x + 14, y + 30, (w - 28) * v, 16, 4, '#F2B530');
      label(g, `${Math.round(v * 100)}% · bonus at 100%`, x + 14, y + 55, { size: 10, color: '#D7DEE2', spacing: 0.5 });
    } else {
      label(g, 'TODAY', x + 14, y + 16, { size: 11, color: '#9FB1BC', spacing: 1.5 });
      label(g, model.policy.tracking === 'off' ? 'Robots stop for people. Always.' : 'Zone B ahead · breaks on schedule', x + 14, y + 38, { size: 16, color: '#F4F1EA', weight: 600, spacing: 0.3 });
    }
    if (hover?.type === 'tv') { g.strokeStyle = 'rgba(242,194,48,.8)'; g.lineWidth = 2.5; rr(g, x - 3, y - 3, w + 6, h + 6, 8); g.stroke(); }
  }
  function drawConveyor() {
    g.strokeStyle = 'rgba(30,43,51,.35)'; g.lineWidth = 1.2;
    const off = (t * 30) % 12;
    for (let x = 996 + off; x < 1108; x += 12) { g.beginPath(); g.moveTo(x, 641); g.lineTo(x, 657); g.stroke(); }
    for (let i = 0; i < 2; i++) { const bx = 1000 + ((t * 30 + i * 52) % 100); fillRR(g, bx, 643, 14, 12, 2, C.kraft[i]); }
  }
  function drawPackets() {
    for (const k of packets) {
      const e = k.t, u = 1 - e;
      const x = u * u * k.x0 + 2 * u * e * k.cx + e * e * (CABINET.x + 33), y = u * u * k.y0 + 2 * u * e * k.cy + e * e * (CABINET.y + 40);
      g.globalAlpha = Math.min(1, (1 - e) * 3);
      circ(g, x, y, 3.2, k.hot ? C.dataHot : C.data); g.globalAlpha *= 0.3; circ(g, x, y, 7, k.hot ? C.dataHot : C.data); g.globalAlpha = 1;
    }
  }
  function drawManagerUnder() {
    const p = model.policy;
    if (p.tracking === 'aggregate') {
      AISLES.forEach((a, i) => {
        const heat = i === 2 && !model.flags.fixedJam ? 0.42 : 0.18 + i * 0.05;
        g.fillStyle = i === 2 && !model.flags.fixedJam ? `rgba(224,72,58,${heat})` : `rgba(63,191,105,${heat})`;
        g.fillRect(RX0, a.y - 26, RX1 - RX0, 52);
      });
    }
    if (p.tracking === 'individual') {
      for (const [id, tr] of Object.entries(trails)) { g.fillStyle = 'rgba(234,106,42,.45)'; for (let i = 0; i < tr.length; i += 4) g.fillRect(tr[i][0] - 1.5, tr[i][1] - 1.5, 3, 3); }
    }
  }
  function drawManagerOver() {
    const p = model.policy;
    if (p.tracking === 'individual') {
      for (const w of walkers) {
        if (w.member.staff) continue;
        const name = w.member.look ? w.id[0].toUpperCase() + w.id.slice(1) : PEOPLE[w.id].name;
        const rate = { tim: 87, ana: 41, tom: 62, sam: 79, kofi: 91, lee: 96, priya: 74, jo: 70 }[w.id];
        const low = rate < 65;
        const bx = w.x - 30, by = w.y - 62;
        fillRR(g, bx, by, 60, 18, 4, low ? '#B5432F' : '#1E2B33');
        label(g, `${name} · ${rate}/h`, w.x, by + 9.5, { size: 10.5, align: 'center', color: '#fff', weight: 700, spacing: 0.3 });
        const near = robots.map((r) => ({ r, p: posOn(r.path, r.s) })).sort((a, b) => Math.hypot(a.p.x - w.x, a.p.y - w.y) - Math.hypot(b.p.x - w.x, b.p.y - w.y))[0];
        if (near) { g.strokeStyle = 'rgba(234,106,42,.55)'; g.setLineDash([3, 4]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(w.x, w.y - 30); g.lineTo(near.p.x, near.p.y - 30); g.stroke(); g.setLineDash([]); }
      }
    } else if (p.tracking === 'aggregate') {
      AISLES.forEach((a, i) => {
        const jam = i === 2 && !model.flags.fixedJam;
        fillRR(g, RX1 - 150, a.y - 20, 140, 22, 4, jam ? '#B5432F' : '#1E2B33');
        label(g, `${['Aisle 5', 'Aisle 6', 'Aisle 7'][i]} · ${[1204, 1158, jam ? 846 : 1187][i]} picks`, RX1 - 80, a.y - 8.5, { size: 11, align: 'center', color: '#fff', spacing: 0.3 });
      });
      if (model.flags.linkable) {
        const r = robots.find((x) => x.aisle === 2);
        const tim = walkers.find((w) => w.id === 'tim');
        if (r && tim) { const pp = posOn(r.path, r.s); g.strokeStyle = C.stop; g.setLineDash([4, 4]); g.lineWidth = 2; g.beginPath(); g.moveTo(pp.x, pp.y - 30); g.lineTo(tim.x, tim.y - 36); g.stroke(); g.setLineDash([]); fillRR(g, tim.x - 46, tim.y - 66, 92, 18, 4, C.stop); label(g, 'Robot 07 = Tim?', tim.x, tim.y - 57, { size: 10.5, align: 'center', color: '#fff' }); }
      }
    } else {
      for (const r of robots) { const pp = posOn(r.path, r.s); fillRR(g, pp.x - 30, pp.y - 56, 60, 16, 4, '#1E2B33'); label(g, `AMR-${String(r.id + 1).padStart(2, '0')} · on route`, pp.x, pp.y - 48, { size: 9.5, align: 'center', color: '#fff', spacing: 0.2 }); }
    }
  }
  function banner(text) {
    g.font = FONT(700, 15); const w = g.measureText(text).width + text.length * 1 + 32, cx = 650, cy = 676;
    fillRR(g, cx - w / 2, cy - 15, w, 30, 15, 'rgba(30,43,51,.92)');
    label(g, text, cx, cy, { size: 15, align: 'center', color: '#F2C230', spacing: 1 });
  }
  function drawMinds() {
    for (const w of walkers) {
      const info = model.people[w.id];
      const bubble = info?.bubble ?? (w.member.staff ? null : genericBubble());
      if (!bubble || (w.id === 'tom' && model.flags.firedTom)) continue;
      const bx = w.x + 6, by = w.y - 74 + Math.sin(t * 2 + w.seed) * 2;
      g.fillStyle = 'rgba(251,250,246,.96)'; g.strokeStyle = 'rgba(30,43,51,.25)'; g.lineWidth = 1.2;
      rr(g, bx - 18, by - 16, 36, 30, 12); g.fill(); g.stroke();
      circ(g, bx - 8, by + 20, 3.5, 'rgba(251,250,246,.96)'); circ(g, bx - 12, by + 27, 2.2, 'rgba(251,250,246,.96)');
      drawGlyph(bubble, bx, by - 1);
    }
  }
  function genericBubble() { const m = model.meters; return m.health < 35 ? 'drop' : m.trust < 35 ? 'eye' : m.trust > 70 && m.health > 60 ? 'heart' : model.policy.targets === 'ranking' ? 'alarm' : 'ok'; }
  function drawGlyph(kind, x, y) {
    g.lineWidth = 2.2; g.lineCap = 'round';
    if (kind === 'heart') { g.fillStyle = '#E0483A'; g.beginPath(); g.moveTo(x, y + 7); g.bezierCurveTo(x - 12, y - 2, x - 6, y - 11, x, y - 4); g.bezierCurveTo(x + 6, y - 11, x + 12, y - 2, x, y + 7); g.fill(); }
    else if (kind === 'drop') { g.fillStyle = '#4FB3E8'; g.beginPath(); g.moveTo(x, y - 9); g.quadraticCurveTo(x + 8, y + 2, x, y + 7); g.quadraticCurveTo(x - 8, y + 2, x, y - 9); g.fill(); }
    else if (kind === 'eye') { g.strokeStyle = '#1E2B33'; g.beginPath(); g.ellipse(x, y, 10, 6, 0, 0, Math.PI * 2); g.stroke(); circ(g, x, y, 3, '#1E2B33'); }
    else if (kind === 'alarm') { label(g, '!', x, y + 1, { size: 24, align: 'center', color: '#E0483A', weight: 800 }); }
    else if (kind === 'question') { label(g, '?', x, y + 1, { size: 22, align: 'center', color: '#2F5F8F', weight: 800 }); }
    else if (kind === 'cloud') { g.fillStyle = '#7E8C94'; circ(g, x - 5, y + 1, 5, '#7E8C94'); circ(g, x + 1, y - 3, 6, '#7E8C94'); circ(g, x + 7, y + 2, 4.5, '#7E8C94'); g.fillRect(x - 9, y + 1, 20, 5); }
    else if (kind === 'chat') { fillRR(g, x - 10, y - 7, 20, 13, 5, '#3F9A5D'); g.fillStyle = '#fff'; g.fillRect(x - 5, y - 2, 3, 3); g.fillRect(x, y - 2, 3, 3); g.fillRect(x + 5, y - 2, 3, 3); }
    else { g.strokeStyle = '#3F9A5D'; g.beginPath(); g.arc(x, y - 2, 6, 0.3, Math.PI - 0.3); g.stroke(); circ(g, x - 3, y - 4, 1.3, '#3F9A5D'); circ(g, x + 3, y - 4, 1.3, '#3F9A5D'); }
  }
  function drawSpotlight() {
    for (const id of model.spotlight) {
      const w = walkers.find((x) => x.id === id);
      if (!w) continue;
      const y = w.y - 60 - Math.abs(Math.sin(t * 4)) * 6;
      fillRR(g, w.x - 9, y - 12, 18, 22, 6, '#EA6A2A'); label(g, '!', w.x, y - 1, { size: 18, align: 'center', color: '#fff', weight: 800 });
    }
  }
  function drawScene() {
    const sc = model.scene; if (!sc) return;
    if (sc === 'accident') {
      g.save(); g.strokeStyle = '#F2C230'; g.lineWidth = 6; g.setLineDash([14, 10]); g.strokeRect(560, 380, 300, 76); g.strokeStyle = '#1E2B33'; g.lineDashOffset = 12; g.strokeRect(560, 380, 300, 76); g.restore();
      const a = (Math.sin(t * 8) + 1) / 2; circ(g, 560, 380, 8, `rgba(242,181,48,${0.5 + a / 2})`); circ(g, 860, 456, 8, `rgba(242,181,48,${1 - a / 2})`);
      g.fillStyle = `rgba(224,72,58,${0.06 + a * 0.06})`; g.fillRect(0, 0, W, H);
    } else if (sc === 'glass') {
      g.fillStyle = 'rgba(224,72,58,.08)'; g.fillRect(0, 0, W, H);
      for (const w of walkers) { g.strokeStyle = 'rgba(224,72,58,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(CABINET.x + 33, CABINET.y + 60); g.lineTo(w.x, w.y - 20); g.stroke(); }
      g.globalAlpha = 0.18 + 0.05 * Math.sin(t * 2); g.strokeStyle = '#1E2B33'; g.lineWidth = 10; g.beginPath(); g.ellipse(W / 2 + 120, 330, 220, 120, 0, 0, Math.PI * 2); g.stroke(); circ(g, W / 2 + 120, 330, 70, '#1E2B33'); g.globalAlpha = 1;
    } else if (sc === 'blind') {
      const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, 'rgba(230,230,225,.15)'); grd.addColorStop(1, 'rgba(230,230,225,.55)'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
    } else if (sc === 'burnout') {
      for (const [x, y] of [[640, 406], [540, 288], [720, 170]]) { fillRR(g, x - 26, y - 14, 52, 20, 4, '#FBF8EE'); label(g, 'OUT SICK', x, y - 4, { size: 11, align: 'center', color: '#B5432F', weight: 800 }); }
      g.fillStyle = 'rgba(30,43,51,.12)'; g.fillRect(0, 0, W, H);
    } else if (sc === 'scraping') { g.fillStyle = 'rgba(30,43,51,.10)'; g.fillRect(0, 0, W, H); }
    else if (sc === 'fair') { const grd = g.createRadialGradient(170, 610, 10, 170, 610, 260); grd.addColorStop(0, 'rgba(255,230,160,.35)'); grd.addColorStop(1, 'rgba(255,230,160,0)'); g.fillStyle = grd; g.fillRect(0, 380, 560, 340); }
  }
  function drawHover() {
    const nm = hover.label; if (!nm) return;
    g.font = FONT(700, 13); const w = g.measureText(nm).width + 18;
    fillRR(g, hover.x - w / 2, hover.y - 30, w, 22, 11, '#1E2B33'); label(g, nm, hover.x, hover.y - 19, { size: 13, align: 'center', color: '#fff', spacing: 0.5 });
  }

  // ---------------------------------------------------------------- input
  function hit(ev) {
    const rect = canvas.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * W, y = ((ev.clientY - rect.top) / rect.height) * H;
    for (const w of walkers) { if (w.id === 'tom' && model.flags.firedTom) continue; if (Math.abs(x - w.x) < 13 && y > w.y - 42 && y < w.y + 6) return { type: 'person', id: w.id, x: w.x, y: w.y - 42, label: w.member.look ? w.id[0].toUpperCase() + w.id.slice(1) : PEOPLE[w.id].name }; }
    for (const r of robots) { const p = posOn(r.path, r.s); if (Math.abs(x - p.x) < 18 && y > p.y - 40 && y < p.y + 14) return { type: 'robot', id: r.id, x: p.x, y: p.y - 40, label: `Robot ${String(r.id + 1).padStart(2, '0')}` }; }
    if (x > CABINET.x && x < CABINET.x + CABINET.w && y > CABINET.y && y < CABINET.y + CABINET.h) return { type: 'cabinet', x: CABINET.x + 33, y: CABINET.y, label: 'Records' };
    if (x > 452 && x < 752 && y < 70) return { type: 'tv', x: 602, y: 96, label: 'Floor screen' };
    if (x > 22 && x < 246 && y > 54 && y < 210) return { type: 'office', x: 134, y: 70, label: 'Your office' };
    if (x > 20 && x < 304 && y > 520) return { type: 'break', x: 160, y: 560, label: 'Break room' };
    return null;
  }
  if (interactive) {
    canvas.addEventListener('pointermove', (ev) => { hover = hit(ev); canvas.style.cursor = hover ? 'pointer' : 'default'; if (reduced) frame(performance.now()); });
    canvas.addEventListener('pointerleave', () => { hover = null; });
    canvas.addEventListener('click', (ev) => { const h = hit(ev); if (h && onPick) onPick(h); });
  }

  resize();
  raf = requestAnimationFrame(frame);
  return {
    setModel,
    pause() { running = false; },
    resume() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); running = false; },
    redraw() { frame(performance.now()); },
  };
}
