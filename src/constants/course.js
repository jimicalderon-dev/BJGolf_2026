// Las Colinas Golf & Country Club — Championship Course
// Par 72 | 6,815 yards | 4 par-3s · 10 par-4s · 4 par-5s

// ── Tournament Configuration ───────────────────────────────────
export const TOURNAMENT_CONFIG = {
  tripStart:       '2026-06-18T14:00:00',
  tournamentStart: '2026-06-19T08:30:00',
  tournamentEnd:   '2026-06-21T17:00:00',
  events: [
    { id: 'ind', name: 'Individual Stroke Play', start: '2026-06-19T08:30:00' },
    { id: 'bb',  name: 'Best Ball',              start: '2026-06-20T08:00:00' },
    { id: 'scr', name: 'Scramble',               start: '2026-06-20T14:30:00' },
    { id: 'alt', name: 'Alternate Shot',         start: '2026-06-21T08:00:00' },
    { id: 'rc',  name: 'Ryder Cup Singles',      start: '2026-06-21T11:00:00' },
  ],
}

export const HOLES = [
  { number:  1, par: 4, yards: 385, si:  9 },
  { number:  2, par: 5, yards: 520, si:  5 },
  { number:  3, par: 3, yards: 175, si: 17 },
  { number:  4, par: 4, yards: 410, si:  3 },
  { number:  5, par: 4, yards: 365, si: 13 },
  { number:  6, par: 4, yards: 395, si:  7 },
  { number:  7, par: 3, yards: 195, si: 15 },
  { number:  8, par: 4, yards: 430, si:  1 },
  { number:  9, par: 5, yards: 545, si: 11 },
  { number: 10, par: 4, yards: 400, si:  4 },
  { number: 11, par: 4, yards: 375, si: 10 },
  { number: 12, par: 3, yards: 165, si: 18 },
  { number: 13, par: 4, yards: 420, si:  2 },
  { number: 14, par: 5, yards: 510, si:  6 },
  { number: 15, par: 4, yards: 445, si:  8 },
  { number: 16, par: 3, yards: 185, si: 16 },
  { number: 17, par: 4, yards: 360, si: 14 },
  { number: 18, par: 5, yards: 535, si: 12 },
]

export const COURSE_PAR = HOLES.reduce((s, h) => s + h.par, 0) // 72

export const EVENTS_STATIC = [
  { id: 'ind', name: 'Individual Stroke Play', type: 'individual', day: 1, emoji: '🏌️' },
  { id: 'bb',  name: 'Best Ball',              type: 'team',       day: 2, emoji: '🤝' },
  { id: 'scr', name: 'Scramble',               type: 'team',       day: 2, emoji: '🔄' },
  { id: 'alt', name: 'Alternate Shot',          type: 'team',       day: 3, emoji: '🔁' },
  { id: 'rc',  name: 'Ryder Cup Singles',       type: 'ryder',      day: 3, emoji: '⚔️' },
]

export const CHALLENGES = [
  { id: 'ctp2',   label: 'Closest to Pin',  desc: 'Hole 2',        prize: 'Free dinner',      hole:  2, metric: 'feet',  lower: true  },
  { id: 'ctp12',  label: 'Closest to Pin',  desc: 'Hole 12',       prize: 'Pro Shop $50',     hole: 12, metric: 'feet',  lower: true  },
  { id: 'ld3',    label: 'Longest Drive',   desc: 'Hole 3',        prize: 'Free round',       hole:  3, metric: 'yards', lower: false },
  { id: 'ld15',   label: 'Longest Drive',   desc: 'Hole 15',       prize: 'Trophy',           hole: 15, metric: 'yards', lower: false },
  { id: 'wolf',   label: 'Game of Wolf',    desc: 'Per tee group', prize: 'Wolf champion',    hole: null, metric: 'pts', lower: false },
  { id: 'skins',  label: 'Skins Game',      desc: 'All 18 holes',  prize: '$10/hole pot',     hole: null, metric: null, lower: null  },
  { id: 'eagle',  label: 'Eagle Club',      desc: 'Any hole',      prize: 'Eagle plaque',     hole: null, metric: null, lower: null  },
  { id: 'birdie', label: 'Birdie Streak',   desc: 'Consecutive',   prize: 'Custom hat',       hole: null, metric: null, lower: null  },
  { id: 'putt',   label: 'No 3-Putt',       desc: 'All 18 holes',  prize: 'Bragging rights',  hole: null, metric: null, lower: null  },
]

export const ITINERARY = [
  {
    day: 0, date: 'Thu Jun 18', label: 'Day 0 — Arrivals',
    activities: [
      { time: 'All Day', emoji: '✈️', desc: 'Arrivals & check-in' },
      { time: '18:00',   emoji: '🥂', desc: 'Welcome drinks & course tour' },
      { time: '20:00',   emoji: '🍽️', desc: 'Welcome dinner & draft night' },
    ],
  },
  {
    day: 1, date: 'Fri Jun 19', label: 'Day 1 — Individual Play',
    activities: [
      { time: '07:00', emoji: '🍳', desc: 'Breakfast' },
      { time: '08:30', emoji: '⛳', desc: 'Individual Stroke Play — 18 holes' },
      { time: '14:00', emoji: '🥗', desc: 'Lunch + Closest-to-Pin challenge' },
      { time: '20:00', emoji: '🏆', desc: 'Leaderboard dinner & awards' },
    ],
  },
  {
    day: 2, date: 'Sat Jun 20', label: 'Day 2 — Team Events',
    activities: [
      { time: '07:00', emoji: '🍳', desc: 'Breakfast' },
      { time: '08:30', emoji: '⛳', desc: 'Best Ball — 18 holes' },
      { time: '13:00', emoji: '🥗', desc: 'Lunch' },
      { time: '14:30', emoji: '⛳', desc: 'Scramble — 9 holes shotgun start' },
      { time: '19:00', emoji: '🏊', desc: 'Pool party & BBQ' },
    ],
  },
  {
    day: 3, date: 'Sun Jun 21', label: 'Day 3 — Championship',
    activities: [
      { time: '07:00', emoji: '🍳', desc: 'Championship breakfast' },
      { time: '08:00', emoji: '⛳', desc: 'Alternate Shot — 9 holes' },
      { time: '11:00', emoji: '⚔️', desc: 'Ryder Cup Singles — 18 holes' },
      { time: '20:00', emoji: '🏆', desc: 'Awards ceremony & closing dinner' },
    ],
  },
  {
    day: 4, date: 'Mon Jun 22', label: 'Day 4 — Departures',
    activities: [
      { time: '09:00', emoji: '🍳', desc: 'Brunch & goodbyes' },
      { time: '12:00', emoji: '✈️', desc: 'Check-out & departures' },
    ],
  },
]

// ── Score helpers ─────────────────────────────────────────────
export function scoreDiff(strokes, par) { return strokes - par }

export function scoreClass(strokes, par) {
  const d = scoreDiff(strokes, par)
  if (d <= -2) return 'sc-eagle'
  if (d === -1) return 'sc-birdie'
  if (d === 0)  return 'sc-par'
  if (d === 1)  return 'sc-bogey'
  return 'sc-double'
}

export function toParLabel(toPar) {
  if (toPar < 0) return `${toPar}`
  if (toPar > 0) return `+${toPar}`
  return 'E'
}

export function toParColor(toPar) {
  if (toPar < 0) return 'text-green-400'
  if (toPar > 0) return 'text-red-400'
  return 'text-slate-300'
}

/**
 * Given a map of { [hole_number]: strokes } and the holes array,
 * compute total strokes, holes played, and to-par.
 */
export function computeScore(holeScores = {}, holes = HOLES) {
  let totalStrokes = 0
  let totalPar     = 0
  let holesPlayed  = 0
  holes.forEach(h => {
    const s = holeScores[h.number]
    if (s !== undefined && s > 0) {
      totalStrokes += s
      totalPar     += h.par
      holesPlayed++
    }
  })
  return { totalStrokes, totalPar, toPar: totalStrokes - totalPar, holesPlayed }
}
