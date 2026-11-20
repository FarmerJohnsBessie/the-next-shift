// The Next Shift — SVG portraits and interface icons, drawn in code.
import { PEOPLE } from './shift-content.mjs';

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + amt * 255)));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

const HAIR = {
  crop: (c) => ({ front: `<path d="M38 52c0-15 9-24 22-24s22 9 22 24c-3-6-8-10-14-11-6 3-14 4-22 3-4 2-6 5-8 8z" fill="${c}"/>` }),
  bun: (c) => ({ back: `<circle cx="60" cy="25" r="10" fill="${c}"/>`, front: `<path d="M37 56c-1-17 9-27 23-27s24 10 23 27c-4-9-11-15-23-15s-19 6-23 15z" fill="${c}"/>` }),
  side: (c) => ({ front: `<path d="M37 55c-2-17 8-28 24-28 13 0 22 9 22 24-5-8-11-12-18-12-3 4-11 7-20 7-3 2-6 5-8 9z" fill="${c}"/>` }),
  long: (c) => ({ back: `<path d="M34 56c-4 16-5 34-2 46h56c3-12 2-30-2-46z" fill="${c}"/>`, front: `<path d="M36 58c-2-18 8-30 24-30s26 12 24 30c-4-10-10-16-18-17-6 4-15 6-23 5-3 3-5 7-7 12z" fill="${c}"/>` }),
  shaved: (c) => ({ front: `<path d="M38 50c1-14 10-22 22-22s21 8 22 22c-6-6-13-9-22-9s-16 3-22 9z" fill="${c}" opacity=".8"/>` }),
  bob: (c) => ({ back: `<path d="M35 72c-4-27 5-44 25-44s29 17 25 44z" fill="${c}"/>`, front: `<path d="M37 60c-1-18 9-30 23-30s24 12 23 30c-5-9-12-14-23-15-9 1-17 6-23 15z" fill="${c}"/>` }),
  part: (c) => ({ front: `<path d="M37 54c-1-16 9-26 23-26 14 0 23 9 23 24-6-7-14-11-24-11h-4c-7 2-13 7-18 13z" fill="${c}"/>` }),
  curly: (c) => ({ back: `<g fill="${c}"><circle cx="36" cy="60" r="7"/><circle cx="84" cy="60" r="7"/><circle cx="38" cy="72" r="6"/><circle cx="82" cy="72" r="6"/></g>`, front: `<g fill="${c}"><circle cx="42" cy="44" r="8"/><circle cx="50" cy="35" r="9"/><circle cx="61" cy="31" r="10"/><circle cx="72" cy="35" r="9"/><circle cx="79" cy="45" r="8"/></g>` }),
  bobblack: (c) => ({ back: `<path d="M35 74c-4-29 6-46 25-46s29 17 25 46z" fill="${c}"/>`, front: `<path d="M37 52c4-14 12-20 23-20s19 6 23 20c-6-5-12-7-17-7l-6 4-4-4c-7 0-13 2-19 7z" fill="${c}"/>` }),
};

const MOUTH = {
  happy: '<path d="M52 69c4 5 12 5 16 0" stroke="#3A1C14" stroke-width="2.4" fill="#fff" stroke-linecap="round"/>',
  ok: '<path d="M53 69c3 2.5 11 2.5 14 0" stroke="#3A1C14" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
  worried: '<path d="M53 71c3-2 5 1 7 0s4-2 7 0" stroke="#3A1C14" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
  upset: '<path d="M53 72c3-4 11-4 14 0" stroke="#3A1C14" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
};
const BROWS = {
  happy: ['M45 47l9-2', 'M66 45l9 2'],
  ok: ['M45 48h9', 'M66 48h9'],
  worried: ['M45 49l9-4', 'M66 45l9 4'],
  upset: ['M45 45l9 4', 'M66 49l9-4'],
};

export function portrait(id, mood = 'ok', { size = 96, label = true } = {}) {
  const p = PEOPLE[id];
  if (!p) return '';
  const skin = p.skin, dark = shade(skin, -0.12), hair = HAIR[p.hair](p.hairColor);
  const bodyFill = p.suit ? p.top : p.vest ? '#F2C230' : p.top;
  const body = `<path d="M10 122c2-22 22-34 50-34s48 12 50 34z" fill="${p.vest ? '#3A4651' : bodyFill}"/>${
    p.vest
      ? `<path d="M14 122c3-19 17-29 32-31l14 20 14-20c15 2 29 12 32 31z" fill="#F2C230"/><path d="M19 108h22M79 108h22" stroke="#E6E8EA" stroke-width="5" stroke-linecap="round"/><path d="M46 91l14 20 14-20" stroke="#D9A21B" stroke-width="2" fill="none"/>`
      : p.suit
        ? `<path d="M48 90l12 30 12-30z" fill="#F4F2EC"/><path d="M57 98h6l2 16-5 6-5-6z" fill="#B5432F"/>`
        : `<path d="M50 89c3 6 7 9 10 9s7-3 10-9" fill="${shade(bodyFill, -0.15)}"/>`
  }`;
  const beard = p.beard ? `<path d="M40 60c1 16 9 25 20 25s19-9 20-25c-3 8-8 12-12 13-2-1-5-1.5-8-1.5s-6 .5-8 1.5c-4-1-9-5-12-13z" fill="${p.hairColor}" opacity=".92"/>` : '';
  const glasses = p.glasses ? `<g fill="none" stroke="#28323A" stroke-width="2.2"><rect x="42" y="51" width="14" height="10" rx="4"/><rect x="64" y="51" width="14" height="10" rx="4"/><path d="M56 55h8"/></g>` : '';
  const brows = BROWS[mood] ?? BROWS.ok;
  const blush = mood === 'happy' ? `<g fill="#E07A5F" opacity=".22"><ellipse cx="44" cy="66" rx="5" ry="3"/><ellipse cx="76" cy="66" rx="5" ry="3"/></g>` : '';
  const sweat = mood === 'upset' || mood === 'worried' ? `<path d="M85 46c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z" fill="#8EC5E0" stroke="#5B9BBE" stroke-width="1"/>` : '';
  const title = label ? `<title>${p.name}</title>` : '';
  return `<svg class="portrait-svg mood-${mood}" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${p.name}, ${p.role}">${title}<defs><clipPath id="clip-${id}-${mood}"><rect width="120" height="120" rx="16"/></clipPath></defs><g clip-path="url(#clip-${id}-${mood})"><rect width="120" height="120" fill="#C9D6DC"/><path d="M0 92h120v28H0z" fill="#B7C6CD"/>${hair.back ?? ''}${body}<rect x="52" y="76" width="16" height="16" rx="6" fill="${dark}"/><ellipse cx="38" cy="58" rx="4" ry="6" fill="${dark}"/><ellipse cx="82" cy="58" rx="4" ry="6" fill="${dark}"/><ellipse cx="60" cy="57" rx="22" ry="25" fill="${skin}"/>${beard}${hair.front}<g stroke="#2B1D18" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="${brows[0]}"/><path d="${brows[1]}"/></g><g fill="#FBF8F2"><ellipse cx="50" cy="57" rx="4.2" ry="3.8"/><ellipse cx="70" cy="57" rx="4.2" ry="3.8"/></g><ellipse cx="50.5" cy="57.3" rx="2.5" ry="2.9" fill="#2B1D18"/><ellipse cx="70.5" cy="57.3" rx="2.5" ry="2.9" fill="#2B1D18"/>${glasses}<path d="M60 59c-1 4-2 6 0 7" stroke="${shade(skin, -0.25)}" stroke-width="1.8" fill="none" stroke-linecap="round"/>${blush}${MOUTH[mood] ?? MOUTH.ok}${sweat}</g></svg>`;
}

const P = {
  output: '<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="M4 8.5 12 13l8-4.5M12 13v7"/>',
  safety: '<path d="M4 16a8 8 0 0 1 16 0"/><path d="M3 16h18v2H3zM10 8.5V6h4v2.5"/>',
  health: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M8 12h2l1-2 2 4 1-2h2"/>',
  privacy: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14v2.5"/>',
  trust: '<path d="M3 11.5 7 7.5l3 1.5 2-1.5 2 1.5 3-1.5 4 4"/><path d="M7 7.5l-2 6 5 4.5c1 .8 2 .8 3 0l6-4.5-2-6"/><path d="M10 14l2 1.6M12.5 12l2 1.6"/>',
  scan: '<path d="M4 8V5h3M17 5h3v3M20 16v3h-3M7 19H4v-3"/><circle cx="12" cy="10" r="2.5"/><path d="M7.5 17c.8-2.4 2.5-3.5 4.5-3.5s3.7 1.1 4.5 3.5"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>',
  alert: '<path d="M12 4 21 19H3z"/><path d="M12 10v4M12 16.5v.5"/>',
  megaphone: '<path d="M4 10v4h3l7 4V6L7 10z"/><path d="M17.5 9.5a3.5 3.5 0 0 1 0 5M8 14l1 5h2.5"/>',
  archive: '<rect x="4" y="5" width="16" height="4" rx="1"/><path d="M5.5 9v10h13V9M10 13h4"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v3M8.5 20h7l-1-4h-5z"/>',
  ribbon: '<circle cx="12" cy="9" r="5"/><path d="M9 13.5 7.5 20l4.5-2 4.5 2-1.5-6.5"/>',
  chart: '<path d="M4 20h16M6 16l4-4 3 3 5-6"/><path d="M15 9h3v3"/>',
  fog: '<path d="M4 9h12M7 13h13M4 17h10"/><path d="M17 17h3"/>',
  tape: '<path d="m3 15 6-10h4L7 15zM11 15l6-10h4l-6 10z"/><path d="M3 19h18"/>',
  sign: '<rect x="4" y="4" width="16" height="9" rx="1"/><path d="M12 13v7M8 8h8"/>',
  bandage: '<rect x="3.5" y="8" width="17" height="8" rx="4" transform="rotate(-35 12 12)"/><path d="M11 11h.01M13 13h.01M13 11h.01M11 13h.01"/>',
  siren: '<path d="M7 17v-5a5 5 0 0 1 10 0v5"/><path d="M5 17h14v3H5zM12 3v2M4.5 6l1.5 1.5M19.5 6 18 7.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  box: '<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="M4 8.5 12 13l8-4.5M12 13v7"/>',
  book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10M9 8h5"/>',
  journal: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  cross: '<path d="m6 6 12 12M18 6 6 18"/>',
  partial: '<path d="M6 12h12"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  next: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H6M11 6l-6 6 6 6"/>',
  replay: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  skip: '<path d="M5 6v12l7-6zM12 6v12l7-6z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  rules: '<path d="M7 4h10l2 3v13H5V7z"/><path d="M9 11l2 2 4-4M9 16h6"/>',
  robot: '<rect x="4" y="8" width="16" height="10" rx="3"/><path d="M8 18v2M16 18v2M12 8V5M9 13h.01M15 13h.01"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  sound: '<path d="M4 10v4h3l5 4V6l-5 4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  mute: '<path d="M4 10v4h3l5 4V6l-5 4zM16 9.5l5 5M21 9.5l-5 5"/>',
  person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 3.6-6 7-6s6 2 7 6"/>',
  lightbulb: '<path d="M9 17h6M10 20h4M12 3.5a5.5 5.5 0 0 0-3 10.1V17h6v-3.4a5.5 5.5 0 0 0-3-10.1z"/>',
};
export function icon(name, { size = 20, cls = '' } = {}) {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name] ?? P.info}</svg>`;
}
