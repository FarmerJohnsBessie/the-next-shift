# The Next Shift — v5 (game)

**[Play the game](https://99sslgz.github.io/the-next-shift-v4/)** · [Source](https://github.com/99sslgz/the-next-shift-v4)

A browser game by Team 12 (Ethics & Policy Issues in Computing). You run a robot warehouse for five weeks and decide what the robots record about the people working next to them. Tim, Priya and Tom — the three scenarios from our presentation — show up as incidents you have to handle.

No accounts, no installation, no analytics. Progress stays in the player’s own browser.

## How it plays (10–15 minutes)

1. **Write the rulebook.** Five dials, three options each: *Tracking*, *Targets*, *Incidents*, *Telling workers*, *Keeping data*. Presets: Max output, Middle road, Lock it down. Every option shows what it does to the meters each week.
2. **Run five weeks.** The animated floor runs, then someone calls with a problem. Two calls per week, ten decisions in all. Hovering an option shows which meters it touches; keys 1–3 work too.
3. **Watch five meters.** Orders, Safety, Health, Privacy, Trust. If any hits 0 the run ends early (walkout, burnout, accident, data scandal, or HQ replaces you).
4. **Read the weekly wrap-up.** Every change is itemised: tap a meter row to see which rule, decision or ripple moved it. The rulebook can be changed between weeks.
5. **Reach an ending.** Ten endings. The win, **The Fair Shift**, needs every meter at 50+ after week 5 *and* a handover rulebook that passes all four rules. The ending screen checks the rulebook against the rules, shows where Tim, Priya and Tom ended up, lists every decision, and compares with the previous run.

Two views on the floor show the same data from both sides: **Manager view** (names and pace numbers, zone heat maps, or robots only, depending on the rulebook) and **Worker view** (what people are thinking). Clicking anyone or anything on the floor shows what the system records about them.

## The Fair Shift rules (refined alignment strategy)

1. **No individual productivity profiles.** No pace, ranking, idle-time or location histories about identifiable workers, and no automatic discipline. Covers “temporary” peak-season tracking, exports, hand-made spreadsheets and re-identifiable dashboards. Consent doesn’t create an exception.
2. **Operations data, in team totals.** Real-time sensing for navigation and safe stopping; a worker is linked to a task only while it’s open; reports only for groups of 5+, with no fixed robot-to-person pairing.
3. **A narrow incident exception.** Start with robot logs that identify no one; an independent reviewer may unlock the minimum identifying data for that incident window if a safety question is still open; every access logged; never reused for pace or discipline.
4. **Notice, limits and remedies.** Plain-language notice before rollout; person–task links erased each shift (incident files kept until closed); workers can see, correct and appeal records; decisions based on banned data are void; a worker–management committee audits access.

The in-game *Rules* page answers seven objections (managing poor performers, re-identification, safety needs, the loophole worry, consent, “just disclose it”, competitiveness) and links real-world anchors: the CNIL’s €32M fine against Amazon France Logistique, California’s AB 701 warehouse quota law, and Ontario’s electronic-monitoring policy requirement.

## Design notes

- The engine is deterministic. The same rulebook and decisions always produce the same result, so runs can be compared fairly. There is no randomness.
- The tests check that a rulebook that never changes can only win if it is the aligned one, that every ending is reachable, that every event and choice can appear, and that meters stay in range.
- The numbers are game mechanics chosen by the team to show tradeoffs. They don’t predict real outcomes. All people, events and the company are fiction.

## Files

- `dist/shift-content.mjs` — meters, rulebook dials, presets, the four rules, objections and sources, characters, events, ripples, endings. **Edit this to change the story or the balance.**
- `dist/shift-engine.mjs` — the deterministic game engine (pure functions, runs in Node for tests).
- `dist/shift-floor.mjs` — the animated warehouse floor (Canvas 2D, no image assets).
- `dist/shift-art.mjs` — SVG portraits and icons.
- `dist/shift-app.mjs`, `dist/shift.css` — the interface.
- `dist/fonts/` — Barlow and Barlow Condensed, self-hosted (SIL Open Font License, `OFL.txt`).
- `dist/story.html` + `dist/v4-*` — the previous long-form story version (v4), still playable and linked from the title screen.
- `tests/shift.test.mjs` — game tests. `tests/v4.test.mjs` — v4 tests.

## Working on it

```
npm test           # runs both test files
npm start          # local server at http://127.0.0.1:4186
npm run prepare:pages   # after editing dist/index.html, refreshes the root index.html for GitHub Pages
```

On Windows, double-click **Start-Next-Shift.cmd**. Browsers block ES modules from `file://`, so use the launcher or `npm start` rather than opening the HTML file directly.

To rebalance, change numbers in `shift-content.mjs` and run `npm test`; the tests will fail if a non-aligned fixed rulebook becomes winnable or an ending becomes unreachable.
