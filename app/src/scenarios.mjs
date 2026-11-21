// Scenarios are data. The client draws them as SVG (public/scene.js).
//
// spots     : left -> right, kinds: urinal | stall | broken (out of order, not pickable)
// occupied  : { spotIndex: pose }   pose: standing | phone | leaning | wide | hips | kid
// correct   : optional override (spot indexes). Otherwise computed by correctSpots().
// The room is always entered from the left (the door is drawn on the left).

const row = (n, extra = []) => [...Array(n).fill('urinal'), ...extra];

export const SCENARIOS = [
  {
    id: 'empty-room',
    title: 'Empty bathroom',
    spots: row(6),
    occupied: {},
    correct: [0, 5],
    explanation: 'Nobody is here yet: take an end spot so whoever arrives later can still leave a gap.',
  },
  {
    id: 'one-at-the-door',
    title: 'Guy right by the door',
    spots: row(6),
    occupied: { 0: 'standing' },
    explanation: 'Put as much distance as possible between you and him: the far end.',
  },
  {
    id: 'one-in-the-middle',
    title: 'Guy in the middle, on his phone',
    spots: row(5),
    occupied: { 2: 'phone' },
    explanation: 'Either end is two spots away from him. Both are fine.',
  },
  {
    id: 'both-ends',
    title: 'Both ends taken',
    spots: row(6),
    occupied: { 0: 'standing', 5: 'leaning' },
    explanation: 'The two middle spots keep two urinals of distance from both guys.',
  },
  {
    id: 'two-guys-one-gap',
    title: 'Two guys, one big gap',
    spots: row(7),
    occupied: { 0: 'phone', 4: 'wide' },
    explanation: 'Spots 3 and 7 are the only ones with a free urinal on both sides of you.',
  },
  {
    id: 'buddies',
    title: 'Two buddies chatting',
    spots: row(5),
    occupied: { 0: 'hips', 1: 'standing' },
    explanation: 'They already broke the rule, not you. Go as far as you can: the far end.',
  },
  {
    id: 'sandwich-and-a-stall',
    title: 'Only a sandwiched urinal... or the stall',
    spots: row(3, ['stall']),
    occupied: { 0: 'standing', 2: 'leaning' },
    correct: [3],
    explanation: 'The only free urinal sits between two guys. Take the stall. (Controversial!)',
  },
  {
    id: 'out-of-order',
    title: 'Broken urinal in the middle',
    spots: ['urinal', 'urinal', 'broken', 'urinal', 'urinal'],
    occupied: { 0: 'standing' },
    explanation: 'The far end is the furthest from him; the broken one does not count.',
  },
  {
    id: 'kid',
    title: 'A kid is peeing',
    spots: row(6),
    occupied: { 2: 'kid' },
    explanation: 'Still a person: keep your distance. The far end is the best.',
  },
  {
    id: 'two-gaps',
    title: 'Busy bar at night',
    spots: row(7),
    occupied: { 1: 'leaning', 5: 'phone' },
    explanation: 'The middle (spot 4) is the only one that is two urinals from both guys.',
  },
];

const byId = new Map(SCENARIOS.map((s) => [s.id, s]));
export const getScenario = (id) => byId.get(id);

export const isPickable = (s, i) => (s.spots[i] === 'urinal' || s.spots[i] === 'stall') && !(i in s.occupied);

// The "correct" spots: maximise the distance to the nearest occupied urinal.
// A free stall wins only when the best urinal is directly next to someone.
export function correctSpots(s) {
  if (s.correct) return s.correct;
  const occupied = Object.keys(s.occupied).map(Number);
  const free = s.spots.map((_, i) => i).filter((i) => isPickable(s, i));
  const minDist = (i) => (occupied.length ? Math.min(...occupied.map((o) => Math.abs(o - i))) : 99);
  const urinals = free.filter((i) => s.spots[i] === 'urinal');
  const stalls = free.filter((i) => s.spots[i] === 'stall');
  const best = urinals.length ? Math.max(...urinals.map(minDist)) : -1;
  if (stalls.length && best <= 1) return stalls;
  return urinals.filter((i) => minDist(i) === best);
}

// What the players get: everything but the answer.
export function publicScenario(s) {
  const { correct, explanation, ...rest } = s;
  return rest;
}
