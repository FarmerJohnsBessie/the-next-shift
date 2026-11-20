// The Next Shift — game content.
// Everything here is authored fiction for Team 12's EPIC project. Numbers are
// game mechanics chosen by the team, not estimates of real-world effects.

export const METERS = [
  { id: 'output', name: 'Orders', long: 'Orders out the door', hint: 'Keeping up with demand. If it hits zero, HQ replaces you.' },
  { id: 'safety', name: 'Safety', long: 'Safety', hint: 'Near-misses get reported and fixed. If it hits zero, someone gets badly hurt.' },
  { id: 'health', name: 'Health', long: 'Health & stress', hint: 'Breaks, pain, pressure. If it hits zero, people burn out.' },
  { id: 'privacy', name: 'Privacy', long: 'Privacy', hint: 'How much of people’s day is on file, and who can open it. If it hits zero, it’s a scandal.' },
  { id: 'trust', name: 'Trust', long: 'Trust', hint: 'Will people speak up and stay? If it hits zero, they walk out.' },
];
export const METER_IDS = METERS.map((m) => m.id);
export const START = 60;
export const WIN_LINE = 50;
export const WEEKS_TOTAL = 5;
export const GROWTH = { fx: { output: -5 }, label: 'More orders every week', why: 'Demand grows each week, so standing still means falling behind.' };

export const DIALS = [
  {
    id: 'tracking',
    icon: 'scan',
    name: 'Tracking',
    q: 'What do the robots log about people?',
    options: [
      { id: 'individual', name: 'Every worker, by name', desc: 'Every pick, pause and location is saved under an employee ID.', fx: { output: 4, privacy: -10, trust: -3 } },
      { id: 'aggregate', name: 'Team & zone totals', desc: 'A worker is linked to a task only while it’s open. Reports cover groups of five or more.', fx: { output: 3, privacy: -2 } },
      { id: 'off', name: 'Robots only', desc: 'Robots sense people only to steer around them. Nothing about workers is kept, not even who has which task.', fx: { output: -7, safety: -2, privacy: 3 } },
    ],
  },
  {
    id: 'targets',
    icon: 'target',
    name: 'Targets',
    q: 'How do you push for output?',
    options: [
      { id: 'ranking', name: 'Live leaderboard', desc: 'Ranks on a big screen. Top pickers get bonuses, bottom ones get warnings.', fx: { output: 5, health: -9, trust: -3, safety: -3 }, needs: { tracking: 'individual' }, lock: 'Needs “Every worker, by name” tracking.' },
      { id: 'team', name: 'Shared team target', desc: 'One goal for the whole shift. Everyone gets the bonus, or no one does.', fx: { output: 3, health: -3 } },
      { id: 'fixed', name: 'Fair, fixed standards', desc: 'Clear, reachable standards. Breaks and bathroom trips never count against you.', fx: { output: 1, health: 2 } },
    ],
  },
  {
    id: 'incident',
    icon: 'alert',
    name: 'Incidents',
    q: 'After a near-miss, what can investigators open?',
    options: [
      { id: 'everything', name: 'Full worker history', desc: 'Whoever investigates can pull the worker’s whole shift: location, pace, breaks.', fx: { privacy: -4, trust: -3, safety: -2 } },
      { id: 'staged', name: 'Robot logs first', desc: 'Start with robot logs. An independent reviewer can unlock the minimum ID data if a safety question is still open.', fx: { safety: 2 } },
      { id: 'robotOnly', name: 'Robot logs only', desc: 'Never identify anyone, even when it would answer the safety question.', fx: { safety: -2, privacy: 1 } },
    ],
  },
  {
    id: 'notice',
    icon: 'megaphone',
    name: 'Telling workers',
    q: 'What do workers get told?',
    options: [
      { id: 'none', name: 'Nothing', desc: 'It’s somewhere in the onboarding paperwork.', fx: { trust: -4 } },
      { id: 'notice', name: 'A posted notice', desc: 'A sign by the time clock says what’s collected and why.', fx: { trust: 1 } },
      { id: 'rights', name: 'Notice, access, appeal', desc: 'A plain-language notice. Workers can see any record about them, fix errors and appeal decisions.', fx: { trust: 2, output: -1 } },
    ],
  },
  {
    id: 'retention',
    icon: 'archive',
    name: 'Keeping data',
    q: 'How long is data about people kept?',
    options: [
      { id: 'forever', name: 'Forever', desc: 'Storage is cheap. It might be useful someday.', fx: { privacy: -4 } },
      { id: 'ninety', name: '90 days', desc: 'Kept for a quarter, then deleted.', fx: { privacy: -2 } },
      { id: 'shift', name: 'Until the shift ends', desc: 'Links between people and tasks are erased each night. Incident files stay until the case closes.', fx: { privacy: 2 } },
    ],
  },
];

export const PRESETS = [
  { id: 'max', name: 'Max output', desc: 'Track everyone, rank everyone.', policy: { tracking: 'individual', targets: 'ranking', incident: 'everything', notice: 'none', retention: 'forever' } },
  { id: 'middle', name: 'Middle road', desc: 'No names on screen, but keep the files.', policy: { tracking: 'aggregate', targets: 'team', incident: 'everything', notice: 'notice', retention: 'ninety' } },
  { id: 'lock', name: 'Lock it down', desc: 'Collect nothing about anyone.', policy: { tracking: 'off', targets: 'fixed', incident: 'robotOnly', notice: 'rights', retention: 'shift' } },
];
// The rulebook that passes every rule. Not offered as a preset: players find it.
export const ALIGNED = { tracking: 'aggregate', targets: 'fixed', incident: 'staged', notice: 'rights', retention: 'shift' };

// Team 12's alignment strategy, tightened to survive the obvious objections.
export const RULES = [
  {
    id: 1,
    short: 'No individual productivity profiles',
    title: 'Prohibit continuous individual productivity monitoring',
    text: 'Data from AMRs, fleet software or linked systems may not be used to build pace, ranking, idle-time or location histories about identifiable workers, or to trigger discipline automatically. That includes “temporary” peak-season tracking, exports, hand-made spreadsheets and dashboards a supervisor can trace back to one person. A signature on a job contract doesn’t create an exception, because a worker can’t freely refuse.',
  },
  {
    id: 2,
    short: 'Operations data, in team totals',
    title: 'Permit necessary operations and aggregate analysis',
    text: 'Robots may sense people in real time to navigate, avoid collisions and stop safely. The system may link a worker to a task only while that task is open. Managers plan with zone and shift totals, shown only for groups of five or more, with no fixed robot-to-person pairing that would let someone work out who is who.',
  },
  {
    id: 3,
    short: 'A narrow incident exception',
    title: 'Allow limited access for a specific safety incident',
    text: 'After a documented collision, injury or near-miss, investigators start with robot logs that identify no one. An independent safety reviewer may unlock the minimum identifying data for that incident’s time window, only if a safety question is still open. Every access is logged, and incident data can never be used for pace reviews or discipline.',
  },
  {
    id: 4,
    short: 'Notice, limits and remedies',
    title: 'Require notice, access controls, and remedies',
    text: 'Before rollout, workers get a plain-language notice: what’s collected, why, who can see it and when it’s deleted. Links between people and tasks are erased at the end of each shift; incident files are kept until the case closes. Workers can see any record about them, correct it and appeal. Decisions made with banned data are void, and a worker–management committee audits the access log.',
  },
];

export const CRITIQUES = [
  {
    q: '“Without individual numbers, you can’t manage poor performers.”',
    a: 'Supervisors still manage people the ordinary way: clear standards, observation and conversation. In this game, every “slow worker” turns out to be a jammed aisle, a trainee or a bad route — context a pick count leaves out.',
  },
  {
    q: '“Anonymous dashboards can still identify people.”',
    a: 'True, which is why Rule 2 requires groups of five or more and no fixed robot-to-person pairing. The Robot 07 incident shows what happens without them.',
  },
  {
    q: '“Safety investigations need to know who was there.”',
    a: 'Rule 3 allows exactly that, scoped to one incident, unlocked by an independent reviewer, logged, and never reused for discipline. Priya’s near-miss shows why the scope matters: once a safety report becomes a pace review, people stop reporting.',
  },
  {
    q: '“The incident exception will become a loophole.”',
    a: 'Three locks: an independent reviewer instead of the line manager, a fixed time window, and a committee that audits every access. Anything used outside those limits can’t support an employment decision.',
  },
  {
    q: '“Workers agreed to monitoring when they signed up.”',
    a: 'Consent from someone who needs the job isn’t freely given, and it doesn’t prevent the harm: skipped breaks, sore shoulders and silence. So the rules don’t allow opting in.',
  },
  {
    q: '“Just tell workers what you collect. That’s enough.”',
    a: 'Notice is necessary but not sufficient. Ontario already requires a written monitoring policy, and its own guidance says that requirement doesn’t create a right to privacy. Rule 4 adds deletion, access, appeal and audits, and Rules 1–3 limit what’s collected in the first place.',
  },
  {
    q: '“This will make the warehouse less competitive.”',
    a: 'Team totals capture most of the operational value: finding jams, planning staffing, routing robots. Regulators are already moving this way; France’s data regulator fined Amazon’s French warehouse arm €32 million over idle-time and scan-speed indicators.',
  },
];

export const SOURCES = [
  { title: 'CNIL — Amazon France Logistique fined €32 million (Jan 2024)', url: 'https://cnil.fr/en/employee-monitoring-cnil-fined-amazon-france-logistique-eu32-million', note: 'Scanner indicators for idle time, short pauses and scanning “too fast” were found unlawful; workers weren’t adequately informed.' },
  { title: 'California DIR — Warehouse Quotas law (AB 701) FAQ', url: 'https://www.dir.ca.gov/dlse/FAQ_warehousequotas.htm', note: 'Quotas can’t prevent meal or rest breaks or bathroom use; workers can request their quota and 90 days of their own work-speed data. An employer that doesn’t monitor work speed need not provide it.' },
  { title: 'Ontario — Written policy on electronic monitoring of employees', url: 'https://www.ontario.ca/document/your-guide-employment-standards-act-0/written-policy-electronic-monitoring-employees', note: 'Employers with 25+ employees must have a written monitoring policy. Disclosure only — it doesn’t limit use.' },
];

export const PEOPLE = {
  tim: { name: 'Tim', role: 'Order picker', skin: '#B57B4E', hair: 'crop', hairColor: '#2A1C14', top: '#F0B429', vest: true },
  priya: { name: 'Priya', role: 'Tote handler', skin: '#A86B45', hair: 'bun', hairColor: '#17110F', top: '#F0B429', vest: true },
  tom: { name: 'Tom', role: 'Warehouse associate', skin: '#E7B892', hair: 'side', hairColor: '#7A5233', top: '#F0B429', vest: true, beard: true },
  ana: { name: 'Ana', role: 'New hire', skin: '#C9926B', hair: 'long', hairColor: '#3B2417', top: '#F0B429', vest: true },
  kofi: { name: 'Kofi', role: 'Picker & safety rep', skin: '#5A3624', hair: 'shaved', hairColor: '#1A1210', top: '#F0B429', vest: true, beard: true },
  dana: { name: 'Dana', role: 'Shift supervisor', skin: '#EBC4A2', hair: 'bob', hairColor: '#B88A4B', top: '#2F5F8F', glasses: true },
  hale: { name: 'Mr. Hale', role: 'Regional VP, HQ', skin: '#DDAE88', hair: 'part', hairColor: '#9AA0A4', top: '#26323B', suit: true },
  rosa: { name: 'Rosa', role: 'HR manager', skin: '#C08559', hair: 'curly', hairColor: '#2A1A12', top: '#7C4E8A' },
  lin: { name: 'Lin', role: 'Data engineer, IT', skin: '#EAC59F', hair: 'bobblack', hairColor: '#141414', top: '#3D7A68', glasses: true },
};

const c = (id, label, fx, out, why, extra = {}) => ({ id, label, fx, out, why, tone: 'good', rule: null, ...extra });

export const WEEKS = [
  { n: 1, name: 'Rollout', line: 'Twelve robots arrive. So do six new hires.', slots: [['training'], ['jam']] },
  { n: 2, name: 'Pressure', line: 'The robots are fast. HQ wants the people faster.', slots: [['leaderboard', 'peer', 'mentor'], ['nearmiss']] },
  { n: 3, name: 'Peak season', line: 'Order volume jumps 30%.', slots: [['rush'], ['reid', 'hr']] },
  { n: 4, name: 'Fallout', line: 'Earlier choices start coming back.', slots: [['firing', 'tomask'], ['leak', 'auto']] },
  { n: 5, name: 'Reckoning', line: 'The last week before HQ reviews your floor.', slots: [['contradiction', 'heat'], ['reporter', 'petition', 'committee']] },
];

export const EVENTS = {
  training: {
    who: 'lin',
    with: 'tom',
    title: 'Training day for the new hires',
    text: (s) =>
      `Tom and five other new hires start today, right as the robots switch on. Lin from IT is running their training. “What should I tell them the robots record?”${s.policy.notice === 'none' ? ' Your rulebook says workers don’t get told anything.' : ''}`,
    choices: () => [
      c('tell', 'Explain it plainly: what’s logged, who sees it, when it’s deleted', { trust: 4, output: -2 }, 'Lin walks through it in ten minutes. Tom asks who sees his numbers and gets a straight answer.', 'People can only accept or challenge monitoring they know about.', { rule: 4, flag: 'told' }),
      c('vague', 'Keep it simple: “The robots help you pick”', { output: 2 }, 'Training runs short. Nobody asks questions, because nobody knows there’s anything to ask.', 'Silence isn’t consent. When people find out later, it costs more trust than telling them now.', { rule: 4, tone: 'bad', flag: 'hidden' }),
      c('skip', 'Skip it. The trucks are waiting', { output: 4, safety: -6, trust: -2 }, 'Robots start moving before anyone learns where they turn. Two near-misses before lunch.', 'Safety training isn’t a delay. It’s part of the job.', { tone: 'bad', flag: 'skippedTraining' }),
    ],
  },

  jam: {
    who: 'dana',
    with: 'tim',
    title: 'Aisle 7 keeps jamming',
    text: (s) =>
      ({
        individual: 'Picks in Aisle 7 are down 20%. Dana: “The system says Tim is the slowest picker in 7. Want me to write him up?”',
        aggregate: 'Picks in Aisle 7 are down 20%. The zone heat map glows red at one corner. Dana: “Could be people, could be robots. Want individual pick rates to check?”',
        off: 'Picks in Aisle 7 are down 20%, but nobody knows why. The robots don’t keep any stats. Dana: “Want me to stand there with a stopwatch?”',
      })[s.policy.tracking],
    choices: (s) =>
      ({
        individual: [
          c('writeup', 'Write Tim up', { output: 1, trust: -5, health: -4 }, 'Tim hurries. The robots behind him are still stuck at the same corner. Picks barely move.', 'The number measured Tim’s waiting, not his effort.', { rule: 1, tone: 'bad', flag: 'blamedTim' }),
          c('routes', 'Check the robot routes first', { output: 7 }, 'A pallet is blocking the turn. Robots were queuing behind it, and Tim was waiting on them. Pallet moved; Aisle 7 is back.', 'The “slow worker” was a slow route. Robot and zone data found it — no name needed.', { rule: 2, flag: 'fixedJam' }),
          c('rank', 'Post the Aisle 7 rankings so people compete', { output: 2, health: -5, trust: -3 }, 'Everyone in 7 picks faster and gets stuck at the same corner faster.', 'Competition can’t clear a blocked aisle.', { rule: 1, tone: 'bad' }),
        ],
        aggregate: [
          c('heatmap', 'Follow the heat map to that corner', { output: 8 }, 'A pallet is blocking the turn. Robots were queuing behind it. Moved it, and Aisle 7 is back to normal.', 'Zone totals found an operations problem without tracking anyone.', { rule: 2, flag: 'fixedJam' }),
          c('rates', 'Get individual pick rates', { output: 1, privacy: -6, trust: -4 }, 'Dana builds a spreadsheet by hand. It points at Tim. The pallet sits there another day.', 'A hand-made spreadsheet is still an individual productivity profile.', { rule: 1, tone: 'bad', flag: ['paperProfile', 'blamedTim'] }),
        ],
        off: [
          c('walk', 'Walk the aisle yourself', { output: 3 }, 'After an hour of watching, you spot a pallet blocking the turn. Fixed — but you can’t watch every aisle.', 'With no data at all, every problem costs you an afternoon.', { rule: 2, tone: 'mixed', flag: 'fixedJam' }),
          c('stopwatch', 'Send Dana with a stopwatch', { output: 1, trust: -5, health: -3, privacy: -3 }, 'Dana times every picker in 7. Tim gets a talk about pace. The pallet stays.', 'A stopwatch is individual monitoring by hand.', { rule: 1, tone: 'bad', flag: 'blamedTim' }),
          c('zone', 'Switch on team & zone totals', { output: 6 }, 'The heat map lights up one corner: a pallet. Fixed in ten minutes.', 'Team totals solve operations problems without tracking anyone.', { rule: 2, set: { tracking: 'aggregate' }, flag: 'fixedJam' }),
        ],
      })[s.policy.tracking],
  },

  leaderboard: {
    who: 'tim',
    with: 'ana',
    when: (s) => s.policy.targets === 'ranking',
    title: 'Tim hasn’t had water since 9 a.m.',
    text: () => 'Tim is #3 on the leaderboard. He skips water breaks, stopped helping Ana (the new hire) and keeps rubbing his shoulder. “If I stop, I drop. If I drop, I get a warning.”',
    choices: () => [
      c('takedown', 'Take the leaderboard down', { output: -4, health: 8, trust: 5 }, 'The screen goes dark. Tim refills his bottle, then walks over to show Ana the handoff.', 'Remove the incentive and the behaviour goes with it.', { rule: 1, set: { targets: 'fixed' }, flag: 'boardDown' }),
      c('mandatory', 'Keep it, but make breaks mandatory', { health: 2, output: -1, trust: -1 }, 'Tim takes his break — and spends it checking his rank on his phone.', 'A break rule can’t outweigh a scoreboard that punishes breaks.', { rule: 1, tone: 'mixed' }),
      c('double', 'Double the bonus for the top five', { output: 6, health: -9, trust: -4, safety: -3 }, 'Rates spike. So do skipped breaks. Ana stands at a tote, waiting for help that doesn’t come.', 'More pressure, same pain — and now helping someone costs money.', { rule: 1, tone: 'bad', flag: 'pushedHarder' }),
    ],
  },
  peer: {
    who: 'kofi',
    with: 'tim',
    when: (s) => s.policy.targets === 'team',
    title: '“Wait for water, we’re behind”',
    text: () => 'No names on the board, but the team bonus is all-or-nothing. Kofi heard someone tell Tim to skip his water break so the shift doesn’t miss the target.',
    choices: () => [
      c('protect', 'Switch to fixed standards. Breaks never count', { health: 6, trust: 4, output: -2 }, 'You say it at the huddle and mean it. Tim gets his water. Nobody argues.', 'Team targets can pressure people too. Protecting breaks has to be explicit.', { set: { targets: 'fixed' } }),
      c('sortout', 'Let the team sort it out', { health: -5, trust: -3 }, 'Workers start keeping an eye on each other’s water bottles. Nobody likes it.', 'Peer policing is still policing.', { tone: 'bad' }),
      c('ranks', 'Bring back individual ranks to find who’s slow', { output: 4, privacy: -6, trust: -6, health: -3 }, 'The argument moves from the team total to a public row of names.', 'A dispute about team rewards doesn’t justify tracking every individual.', { rule: 1, tone: 'bad', set: { tracking: 'individual', targets: 'ranking' } }),
    ],
  },
  mentor: {
    who: 'hale',
    with: 'tim',
    title: '“Why is Zone B down 8%?”',
    text: () => 'Ana is new and nervous around the robots, so Tim spent the morning showing her the ropes. His zone’s numbers dipped. Mr. Hale emails from HQ: “Why is Zone B down 8%?”',
    choices: () => [
      c('count', 'Reply: training is real work, and it’s in the plan', { output: 2, trust: 3, health: 1 }, 'By Thursday Ana is up to speed and Zone B is ahead. Tim gets the credit.', 'Helping a coworker is work. Fair standards make room for it.'),
      c('stop', 'Tell Tim to stop training and pick', { output: 2, trust: -4, safety: -4 }, 'Ana learns the robots by trial and error. One nearly clips her.', 'Cutting training to save minutes moves the cost to safety.', { tone: 'bad' }),
      c('defend', 'Pull Tim’s personal numbers to defend him', { privacy: -5, trust: -2 }, 'To prove Tim isn’t slow, you start a file on Tim. That file is the problem.', 'Even a friendly profile is a profile, and the next manager can read it.', { rule: 1, tone: 'bad', flag: 'paperProfile' }),
    ],
  },

  nearmiss: {
    who: 'priya',
    with: 'priya',
    title: 'A robot moved while Priya was unloading',
    text: () =>
      'An AMR pulled away mid-unload. Priya hit the emergency stop and filed a near-miss report. The robot’s log shows it got a “handoff complete” signal before she finished. Dana: “Send me her whole shift history. I want to know why she was slower than everyone else at those stops.”',
    choices: (s) => {
      const close = c('close', 'Close the report. Nobody got hurt', { safety: -10, trust: -4 }, 'The bug stays. Same robot, same signal, different worker next time.', 'An unexplained near-miss is a warning you chose not to read.', { rule: 3, tone: 'bad', flag: 'unfixed' });
      if (s.policy.incident === 'staged')
        return [
          c('logs', 'Robot logs first, then ask Priya what happened', { safety: 10, trust: 4 }, 'The log shows the early signal; Priya’s account fills in the rest. Lin patches all 12 robots. The reviewer never needed her ID.', 'This is the incident exception working as designed.', { rule: 3, flag: 'patched' }),
          c('override', 'Override the reviewer and send Dana the history', { privacy: -10, trust: -12, safety: -6 }, 'Priya gets a meeting about her pace. Everyone notices the rule only held until someone pushed.', 'A safeguard you skip when it’s inconvenient isn’t a safeguard.', { rule: 3, tone: 'bad', flag: 'sentHistory' }),
          close,
        ];
      if (s.policy.incident === 'robotOnly')
        return [
          c('logs', 'Use the anonymous robot logs only', { safety: 5, trust: 4 }, 'The log shows the early signal, but not where Priya’s tote was. Lin can’t reproduce the bug and ships a best guess.', 'Never identifying anyone can leave a real safety question open.', { rule: 3, tone: 'mixed', flag: 'halfPatched' }),
          c('ask', 'Ask Priya for her account, if she’s willing', { safety: 8, trust: 5 }, 'Priya walks Lin through it. The bug is found and fixed because she chose to help.', 'A worker’s own account isn’t surveillance. But without a proper exception, you rely on goodwill every time.', { rule: 3, flag: 'patched' }),
          c('send', 'Make an exception and pull her whole shift', { privacy: -8, trust: -8, safety: 2 }, 'Priya gets a meeting about her pace. The bug gets half a look.', 'A rule with no proper exception gets broken the first time it matters.', { rule: 3, tone: 'bad', flag: 'sentHistory' }),
        ];
      return [
        c('send', 'Send Dana the full history', { privacy: -8, trust: -10, safety: -6, health: -3 }, 'Priya is called into a meeting about her pace. Nobody asks about the signal. Next week, two people don’t report their near-misses.', 'Using a safety report to judge the reporter teaches everyone to stop reporting.', { rule: 3, tone: 'bad', flag: 'sentHistory' }),
        c('signal', 'Investigate the signal. Keep her history closed', { safety: 9, trust: 3 }, 'Lin finds it: the sensor says “done” as soon as a tote crosses it, even mid-unload. All 12 robots get patched.', 'Your rulebook allowed the full history. You didn’t need it.', { rule: 3, flag: 'patched' }),
        close,
      ];
    },
  },

  rush: {
    who: 'hale',
    title: 'Peak season: 30% more orders',
    text: (s) =>
      s.policy.tracking === 'individual'
        ? 'HQ is sending 30% more orders for the next two weeks. Mr. Hale: “Raise everyone’s target by 15%. The system will tell us who can’t keep up.”'
        : 'HQ is sending 30% more orders for the next two weeks. Mr. Hale: “Turn on individual pace tracking. Just for peak. Temporary.”',
    choices: (s) => {
      if (s.policy.tracking === 'individual')
        return [
          c('raise', 'Raise targets by 15%', { output: 6, health: -10, safety: -4, trust: -4 }, 'Orders go out. So do three people with wrist strains.', 'Pushing harder on the same system just moves the cost onto bodies.', { rule: 1, tone: 'bad', flag: 'pushedHarder' }),
          c('temps', 'Hire temps. Leave targets alone', { output: 4 }, 'Orders mostly keep up. The tracking still shapes everyone’s day.', 'Extra hands help, but the pressure system is still there.', { tone: 'mixed' }),
          c('zones', 'Switch to team totals and fix routes instead', { output: 4, privacy: 6, trust: 4 }, 'Route fixes find the time that pressure couldn’t. People notice their names are off the screen.', 'Team data finds where time is lost. Names don’t.', { rule: 1, set: { tracking: 'aggregate' } }),
        ];
      const blind = s.policy.tracking === 'off';
      return [
        c('temporary', 'Turn it on “temporarily”', { output: 6, privacy: -6, trust: -6 }, 'Rates jump on day one. By Friday, “temporary” tracking is in next quarter’s plan.', 'Exceptions for busy seasons tend to become the default.', { rule: 1, tone: 'bad', set: { tracking: 'individual' }, flag: 'temporary' }),
        blind
          ? c('temps', 'Hire temps and guess where to put them', { output: 3 }, 'Without any data, half the temps stand in quiet aisles.', 'No data means guessing, even for simple staffing.', { rule: 2, tone: 'mixed' })
          : c('temps', 'Hire temps and send them where zone data says', { output: 8 }, 'Zone totals show where robots wait longest. Temps go there. Orders keep up.', 'Team data is enough to plan staffing.', { rule: 2 }),
        c('ask', 'Ask the crew how to hit it', { output: 5, trust: 3, health: -2 }, 'Kofi suggests staggering breaks so the packing line never stops. It works.', 'The people doing the work know where the time goes.'),
      ];
    },
  },

  reid: {
    who: 'lin',
    with: 'tim',
    when: (s) => s.policy.tracking === 'aggregate' && !s.flags.groupSize,
    title: 'The “anonymous” chart isn’t',
    text: () => 'Lin caught Dana comparing “Robot 07” with the others. Only Tim works the night corner with Robot 07, so the anonymous chart is really Tim’s chart.',
    choices: () => [
      c('fix', 'Show only groups of 5+ and rotate robot pairings', { privacy: 5, trust: 2, output: -2 }, 'Small zones merge into bigger ones on the dashboard. Robot 07 now works with whoever is free.', 'Data without names can still point at one person. Group size and rotation stop that.', { rule: 2, flag: 'groupSize' }),
      c('rename', 'Rename the robots', { privacy: -3, trust: -1 }, 'Robot 07 becomes Robot K. Dana still knows who works the night corner.', 'A new label doesn’t break the link.', { rule: 2, tone: 'bad', flag: 'linkable' }),
      c('fine', 'No names on it, so it’s fine', { privacy: -6, trust: -4 }, 'Tim finds out his “anonymous” numbers came up in a meeting.', 'If someone can work out who it is, it isn’t anonymous.', { rule: 2, tone: 'bad', flag: 'linkable' }),
    ],
  },
  hr: {
    who: 'rosa',
    with: 'kofi',
    title: 'HR wants Kofi’s bathroom trips',
    text: (s) =>
      noPeopleData(s)
        ? 'A worker complained that Kofi takes “too many” bathroom breaks. Rosa from HR: “Can we pull his location history?” Lin: “There isn’t one. Those links get erased every night.”'
        : `A worker complained that Kofi takes “too many” bathroom breaks. Rosa from HR: “Can I pull his location history for the last ${s.policy.retention === 'forever' ? 'year' : '90 days'}?”`,
    choices: (s) =>
      noPeopleData(s)
        ? [
            c('talk', 'Handle it the normal way: Rosa talks to Kofi', { trust: 3 }, 'Kofi has a doctor’s note. Five minutes, case closed.', 'Some questions are better answered by asking than by tracking.', { rule: 1 }),
            c('start', 'Start logging Kofi’s location from now on', { privacy: -7, trust: -8 }, 'Kofi notices Lin adding a tag to his badge. So does everyone else.', 'Tracking one person because of a complaint is still a productivity profile.', { rule: 1, tone: 'bad', flag: 'hrFishing' }),
          ]
        : [
            c('no', 'No. Location data is for robots, not bathroom breaks', { trust: 4, privacy: 2 }, 'Rosa talks to Kofi instead. He has a doctor’s note. Five minutes, case closed.', 'Data collected to steer robots shouldn’t be reused to police people.', { rule: 1 }),
            c('pull', 'Pull the history', { privacy: -8, trust: -8, health: -3 }, 'The report counts 14 trips. It doesn’t show the doctor’s note. Kofi learns from a coworker that HR has a map of his day.', 'Old data invites new uses nobody agreed to.', { rule: 1, tone: 'bad', flag: 'hrFishing' }),
            c('week', 'Pull just the last week', { privacy: -4, trust: -4 }, 'Smaller file, same message: anyone’s movements can be pulled at any time.', 'A smaller breach of purpose is still a breach of purpose.', { rule: 1, tone: 'bad', flag: 'hrFishing' }),
          ],
  },

  firing: {
    who: 'dana',
    with: 'tom',
    when: (s) => s.flags.everIndividual && s.policy.retention !== 'shift',
    title: 'Dana wants to fire Tom',
    text: (s) =>
      `Dana slides over a report: Tom’s picking rate is in the bottom 10% for the month. “I recommend we let him go.” ${s.flags.told || s.policy.notice !== 'none' ? 'Tom was told the robots log output, but he has never seen his numbers.' : 'Nobody ever told Tom the robots were logging his output.'} He has a wife and a young kid.`,
    choices: () => [
      c('fire', 'Fire Tom', { output: 2, trust: -14, health: -4 }, 'Tom stares at the screen. On the drive home he wonders why nobody told him. The crew wonders who’s next.', 'A number without context, used without notice, isn’t a fair reason.', { rule: 1, tone: 'bad', flag: 'firedTom' }),
      c('context', 'Look at the context first', { trust: 5, output: 1 }, 'Tom’s zone had the Aisle 7 jam, and he trained two new hires. The bottom 10% was the job, not the worker.', 'Output counts leave out exactly the things that explain them.', { rule: 1, tone: 'mixed', flag: 'tomContext' }),
      c('rights', 'Show Tom his record and let him respond', { trust: 9, output: -1 }, 'Tom sees his record for the first time and explains the jam and the training. Dana withdraws the recommendation.', 'Notice, access and appeal turn a verdict into a conversation.', { rule: 4, flag: 'tomRights' }),
    ],
  },
  tomask: {
    who: 'tom',
    title: '“Are the robots rating me?”',
    text: () => 'Tom heard a rumour: the robots score everyone, and the bottom 10% get fired. He asks you straight out.',
    choices: (s) =>
      s.policy.notice === 'rights'
        ? [
            c('show', 'Pull up his records together', { trust: 4 }, 'There’s no pace score on Tom, just his zone’s totals and the robots’ own logs. He reads the notice twice and relaxes.', 'Being able to check is what makes the promise believable.', { rule: 4, flag: 'tomTold' }),
            c('brush', '“Don’t worry about it.”', { trust: -3 }, 'Tom nods. He still has the right to check, and he does, a week later, without asking you.', 'A right works even when a manager doesn’t.', { rule: 4, tone: 'mixed', flag: 'tomTold' }),
          ]
        : [
            c('explain', 'Show him what’s actually logged', { trust: 4 }, 'You print the rulebook and go through it together. Tom tells the others. The rumour dies.', 'If people can’t check what’s collected, they assume the worst.', { rule: 4, flag: 'tomTold', set: s.policy.notice === 'none' ? { notice: 'notice' } : undefined }),
            c('brush', '“Don’t worry about it.”', { trust: -4, health: -2 }, 'The rumour keeps going. People stop taking full breaks, just in case.', 'Feeling watched changes behaviour, whether or not anyone is watching.', { rule: 4, tone: 'bad', flag: 'tomScared' }),
            c('scare', 'Let them think so. It keeps everyone hustling', { output: 3, health: -5, trust: -6 }, 'Fear works for a week. Then people start calling in sick.', 'Pretend surveillance does real harm.', { tone: 'bad', flag: 'tomScared' }),
          ],
  },

  leak: {
    who: 'lin',
    when: (s) => s.policy.retention !== 'shift',
    title: 'The robot vendor leaked our logs',
    impact: (s) => (s.flags.everIndividual ? { fx: { privacy: -10 }, why: 'Weeks of named movement logs were exposed.' } : { fx: { privacy: -4 }, why: 'Old task links were exposed.' }),
    text: (s) =>
      s.flags.everIndividual
        ? 'A misconfigured cloud folder at the robot vendor exposed weeks of logs: every worker’s movements, by name, bathroom trips included.'
        : 'A misconfigured cloud folder at the robot vendor exposed weeks of logs. Mostly zone totals, but some task links that were never deleted.',
    choices: () => [
      c('tell', 'Tell workers today. Delete what we don’t need', { trust: 3, privacy: 4 }, 'It’s an awkward meeting. But people hear it from you first, and the old logs are gone.', 'Data you don’t keep can’t leak.', { rule: 4, set: { retention: 'shift' } }),
      c('quiet', 'Fix it quietly and say nothing', { privacy: -2 }, 'The folder is locked. Nobody knows. For now.', 'Hiding a breach turns one problem into two.', { rule: 4, tone: 'bad', flag: 'hidLeak' }),
      c('vendor', 'Blame the vendor. Keep everything', { trust: -5, privacy: -3 }, 'The press release blames the vendor. The data stays exactly where it was.', 'The risk came from keeping the data, not just from the vendor.', { rule: 4, tone: 'bad' }),
    ],
  },
  auto: {
    who: 'hale',
    title: '“Let the system send the warnings”',
    text: (s) =>
      `Mr. Hale wants automatic warnings: three slow days in a row and the system sends one, no manager needed. “Saves you time.”${s.policy.tracking === 'individual' ? '' : ' The catch: that needs every worker tracked by name.'}`,
    choices: (s) =>
      s.policy.tracking === 'individual'
        ? [
            c('approve', 'Approve it', { output: 4, trust: -8, health: -6 }, 'The first batch goes out Monday. Two go to people who were training new hires.', 'A machine can’t see the reasons behind a slow day.', { rule: 1, tone: 'bad', flag: 'autoWarnings' }),
            c('human', 'Flag it for a manager to review, with context', { trust: 2, output: 1 }, 'Fewer bad warnings. But everyone is still being scored all day.', 'A human in the loop is better, but the profile is still there.', { rule: 1, tone: 'mixed' }),
            c('refuse', 'No. Robot data isn’t for discipline', { trust: 6, output: -2 }, 'Hale grumbles. The crew hears about it by lunch.', 'Taking discipline off the table removes the reason to track individuals.', { rule: 1, set: s.policy.targets === 'ranking' ? { targets: 'fixed' } : undefined }),
          ]
        : [
            c('approve', 'Turn on name tracking and auto-warnings', { output: 3, privacy: -8, trust: -10, health: -5 }, 'Badges get new tags. The first warnings go out Monday.', 'Automated discipline needs exactly the profiles the rules ban.', { rule: 1, tone: 'bad', set: { tracking: 'individual' }, flag: 'autoWarnings' }),
            c('refuse', 'No. Our robot data isn’t for discipline', { trust: 3, output: -2 }, 'Hale grumbles, then asks for the zone report instead. It answers what he actually wanted to know.', 'HQ’s real question was about the operation, and team data answers it.', { rule: 1 }),
          ],
  },

  contradiction: {
    who: 'kofi',
    when: (s) => s.flags.everIndividual || s.policy.incident === 'everything',
    title: 'The data says Kofi wasn’t there',
    text: () => 'Kofi hurt his back catching a tote a robot dropped short. But his location tag says he was 20 metres away. Dana: “The data doesn’t lie. Deny the claim.”',
    choices: () => [
      c('deny', 'Trust the data and deny the claim', { trust: -10, health: -6, safety: -4 }, 'A week later Lin finds the tag readers in that aisle drift by 20 metres. Kofi was right where he said.', 'Location data is a measurement, not the truth. It can be wrong.', { tone: 'bad', flag: 'deniedKofi' }),
      c('check', 'Check the sensors and hear Kofi out', { safety: 5, trust: 4, output: -1 }, 'Lin finds the tag readers in that aisle drift by 20 metres. Kofi’s claim goes through and the readers get fixed.', 'When data and a person disagree, investigate both.'),
    ],
  },
  heat: {
    who: 'ana',
    title: 'It’s 31°C on the floor',
    text: () => 'A heat wave hits. Ana looks dizzy at her station.',
    choices: (s) => [
      c('cool', 'Extra water breaks. Pause targets this afternoon', { health: 7, output: -3 }, 'Fans, water, shorter stints. Nobody faints. Orders run a little late.', 'Health comes before the afternoon’s numbers.'),
      s.policy.targets === 'ranking'
        ? c('remind', 'Water reminders. Targets stay', { health: -3 }, 'People nod at the reminder and keep picking. The leaderboard doesn’t pause.', 'A reminder can’t compete with a ranking.', { tone: 'bad' })
        : c('remind', 'Water reminders. Targets stay', { health: 2 }, 'Most people drink more. Ana still pushes through.', 'Better than nothing, not as good as a pause.', { tone: 'mixed' }),
      c('push', 'Push through', { output: 3, health: -8, safety: -4 }, 'Ana sits down hard by a rack. Kofi walks her to first aid.', 'Heat makes every other risk worse.', { tone: 'bad' }),
    ],
  },

  reporter: {
    who: 'hale',
    when: (s) => s.flags.hidLeak,
    title: 'A reporter found the leak',
    text: () => 'A tech reporter has the leaked files, and knows you knew. Mr. Hale: “What do we say?”',
    choices: () => [
      c('clean', 'Come clean, apologize, delete old data', { trust: -4, privacy: 4 }, 'The story runs. But it ends with what you fixed, not what you hid.', 'Late honesty still beats none.', { rule: 4, tone: 'mixed', set: { retention: 'shift' }, unflag: 'hidLeak' }),
      c('nocomment', '“No comment.”', { trust: -12, privacy: -6 }, 'The headline writes itself. Workers read it on their break.', 'Concealment is the part people don’t forgive.', { rule: 4, tone: 'bad' }),
    ],
  },
  petition: {
    who: 'kofi',
    when: (s) => s.meters.trust < 40,
    title: '60 signatures on Kofi’s petition',
    text: () => '“Stop tracking us like machines.” Kofi hands you a petition signed by 60 workers and asks for a meeting.',
    choices: () => [
      c('meet', 'Meet them and rewrite the rulebook together', { trust: 12 }, 'Two hours, a whiteboard and a lot of honesty. The crew helps draft the rulebook you’ll hand over.', 'The people being measured should help set the rules.', { rule: 4, flag: 'cowrote' }),
      c('promise', 'Promise to “look into it”', { trust: -3 }, 'Kofi folds the petition into his pocket. He’s heard that before.', 'A promise with no change is a delay.', { tone: 'bad' }),
      c('warn', 'Warn the organizers to stop', { trust: -15 }, 'Nobody stops. In the US, threatening workers for organizing breaks federal labor law, and now everyone knows you did it.', 'Retaliation turns a complaint into a fight.', { tone: 'bad' }),
    ],
  },
  committee: {
    who: 'kofi',
    title: 'Kofi wants a data committee',
    text: () => 'Kofi proposes a worker–management committee that checks, every month, who opened which data and why.',
    choices: () => [
      c('yes', 'Yes, and give them the access log', { trust: 4, privacy: 3, output: -1 }, 'First meeting: three access requests reviewed, one rejected. Everyone can see the rules being used.', 'Rules people can check are rules people believe.', { rule: 4, flag: 'committee' }),
      c('later', 'Maybe next year', { trust: -2 }, 'Kofi shrugs. The rules are on paper, and nobody is checking them.', 'A rule nobody audits drifts.', { rule: 4, tone: 'mixed' }),
    ],
  },
};

function noPeopleData(s) {
  return s.policy.retention === 'shift' || (s.policy.tracking === 'off' && !s.flags.everIndividual);
}

// Lingering effects of earlier decisions, applied at the end of each week.
export const RIPPLES = [
  { flag: 'sentHistory', fx: { safety: -3 }, label: 'People stopped reporting near-misses after Priya’s meeting' },
  { flag: 'patched', fx: { safety: 1 }, label: 'Priya’s report fixed a bug in every robot' },
  { flag: 'unfixed', fx: { safety: -3 }, label: 'The early “handoff complete” bug is still in every robot' },
  { flag: 'skippedTraining', fx: { safety: -2 }, label: 'Some new hires never learned how the robots move' },
  { flag: 'linkable', fx: { privacy: -2 }, label: 'Supervisors can still link “anonymous” robot numbers to people' },
  { flag: 'autoWarnings', fx: { trust: -3, health: -2 }, label: 'Automatic warnings keep arriving' },
  { flag: 'firedTom', fx: { trust: -2 }, label: 'The crew still talks about how Tom was fired' },
];

export const ENDINGS = {
  fair: { title: 'The Fair Shift', kind: 'win', icon: 'trophy', line: 'You found the balance.', story: 'Orders went out, near-misses got fixed, and nobody’s bathroom trips ended up in a file. When the next manager arrives, the rulebook protects people without needing you there.' },
  fragile: { title: 'Good Manager, Fragile Rules', kind: 'near', icon: 'ribbon', line: 'Your calls were good. Your rulebook isn’t yet.', story: 'Five solid weeks — because you kept making good calls. But the rulebook you’re handing over still allows things you chose not to do. The next manager might not choose the same way.' },
  paper: { title: 'Efficient on Paper', kind: 'loss', icon: 'chart', line: 'HQ loves the numbers. The floor doesn’t.', story: 'The dashboard is green. The break room is quiet in the wrong way. People are hitting their numbers by giving up the things the numbers don’t count.' },
  blind: { title: 'The Blind Floor', kind: 'loss', icon: 'fog', line: 'Nobody is watched. Nothing gets learned.', story: 'Privacy held, but jams repeat, near-misses go unexplained and orders run late. HQ is asking why the robots aren’t helping. Collecting nothing isn’t the same as collecting wisely.' },
  scraping: { title: 'Scraping By', kind: 'loss', icon: 'tape', line: 'You made it to Friday. Barely.', story: 'You survived five weeks, but every meter is hanging on. Nothing broke, and nothing was fixed either.' },
  walkout: { title: 'The Walkout', kind: 'collapse', meter: 'trust', icon: 'sign', line: 'Trust hit zero.', story: 'Monday, 7 a.m. The robots are charged and waiting. The floor is empty. The crew is in the break room with hand-painted signs, and they’re not coming out until the rules change.' },
  burnout: { title: 'Running on Empty', kind: 'collapse', meter: 'health', icon: 'bandage', line: 'Health hit zero.', story: 'Wrist strains, back injuries, people calling in sick. The schedule has more holes than names.' },
  accident: { title: 'The Accident', kind: 'collapse', meter: 'safety', icon: 'siren', line: 'Safety hit zero.', story: 'The near-misses nobody fixed stopped being near. The floor is taped off while investigators work.' },
  glass: { title: 'The Glass Warehouse', kind: 'collapse', meter: 'privacy', icon: 'eye', line: 'Privacy hit zero.', story: 'Every step, pause and bathroom trip is on file, and now it’s in the news. Workers find out what was collected about them the same way everyone else does.' },
  replaced: { title: 'Under New Management', kind: 'collapse', meter: 'output', icon: 'box', line: 'Orders hit zero.', story: 'Trucks leave half empty. HQ sends a replacement manager on Monday, with a very different rulebook in their briefcase.' },
};
export const ENDING_ORDER = ['fair', 'fragile', 'paper', 'blind', 'scraping', 'walkout', 'burnout', 'accident', 'glass', 'replaced'];
export const ENDING_HINTS = {
  fair: 'Finish with every meter at 50+ and a rulebook that passes all four rules.',
  fragile: 'Keep every meter at 50+ while your rulebook still misses a rule.',
  paper: 'Keep orders high while people pay for it.',
  blind: 'Protect privacy so well that the warehouse can’t learn anything.',
  scraping: 'Survive five weeks without any meter doing well.',
  walkout: 'Let trust run out.',
  burnout: 'Let health run out.',
  accident: 'Let safety run out.',
  glass: 'Let privacy run out.',
  replaced: 'Let orders run out.',
};
