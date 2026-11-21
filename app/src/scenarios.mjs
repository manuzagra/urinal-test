// Scenarios are data. The client draws them as SVG (public/scene.js).
//
// spots     : left -> right. Kinds: urinal | low (kid height) | dirty | stall   (pickable)
//                                    broken (out of order) | sink               (not pickable)
// occupied  : { spotIndex: pose } or { spotIndex: { pose, tag, say } }
//             pose: standing | phone | leaning | wide | hips | kid | drunk
//             tag = name label over his head ("Your boss"), say = speech bubble.
//             A guy in a stall is behind a door: he does not count for distance.
// dividers  : [i, ...] privacy panel between spot i and i+1 (counts as one extra spot of distance)
// context   : optional line shown to players ("It's half-time at the stadium")
// correct   : optional override (spot indexes). Otherwise computed by correctSpots().
// level     : easy | medium | hard (set from LEVEL_IDS below)
// explanation: shown after the reveal. Spot numbers in text are 1-based, like on screen.
// The room is always entered from the left (the door is drawn on the left).

import { ES } from './scenarios.es.mjs';

const row = (n, extra = []) => [...Array(n).fill('urinal'), ...extra];
const U = 'urinal', LOW = 'low', DIRTY = 'dirty', STALL = 'stall', BROKEN = 'broken', SINK = 'sink';

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

  // ---- plain distance -------------------------------------------------------
  {
    id: 'three-middle-taken',
    title: 'Three urinals, middle one taken',
    spots: row(3),
    occupied: { 1: 'standing' },
    explanation: 'Both free urinals are right next to him. Neither is better: pick one, eyes on the wall.',
  },
  {
    id: 'four-second-taken',
    title: 'Four urinals, second one taken',
    spots: row(4),
    occupied: { 1: 'phone' },
    explanation: 'Urinal 4 is the only one with a free urinal between you and him.',
  },
  {
    id: 'far-end-taken',
    title: 'Someone at the far end',
    spots: row(5),
    occupied: { 4: 'standing' },
    explanation: 'Urinal 1, right by the door, is the furthest from him. No shame in it.',
  },
  {
    id: 'door-side-trio',
    title: 'Small bathroom, guy at the end',
    spots: row(3),
    occupied: { 2: 'leaning' },
    explanation: 'Urinal 1 keeps a free urinal between you.',
  },
  {
    id: 'pair-on-the-right',
    title: 'Two guys on the right',
    spots: row(5),
    occupied: { 3: 'standing', 4: 'phone' },
    explanation: 'Urinal 1 is three spots away from the closest guy. Easy.',
  },
  {
    id: 'gap-of-two',
    title: 'Door guy and middle guy',
    spots: row(6),
    occupied: { 0: 'standing', 3: 'hips' },
    explanation: 'Urinal 6 is the only one with a free urinal on its side.',
  },
  {
    id: 'lonely-middle',
    title: 'Long row, one guy in the middle',
    spots: row(7),
    occupied: { 3: 'wide' },
    explanation: 'Both ends are three urinals away from him.',
  },
  {
    id: 'left-crowd',
    title: 'Everyone near the door',
    spots: row(7),
    occupied: { 0: 'standing', 1: 'phone', 2: 'leaning' },
    explanation: 'Walk all the way down to urinal 7.',
  },
  {
    id: 'split-seven',
    title: 'Two guys, symmetric',
    spots: row(7),
    occupied: { 2: 'standing', 4: 'phone' },
    explanation: 'Both ends are two urinals away from the nearest guy. Never take urinal 4 in the middle!',
  },
  {
    id: 'every-other',
    title: 'Every other urinal taken',
    spots: row(7),
    occupied: { 1: 'standing', 3: 'phone', 5: 'leaning' },
    correct: [0, 6],
    explanation: 'Every free urinal is next to someone, but the ends have only one neighbour. One neighbour beats two.',
  },
  {
    id: 'sandwich-or-end',
    title: 'Sandwich or the end?',
    spots: row(5),
    occupied: { 1: 'standing', 3: 'leaning' },
    correct: [0, 4],
    explanation: 'All free urinals touch someone. The middle one touches two: take an end.',
  },
  {
    id: 'half-time',
    title: 'Half-time rush',
    context: 'Stadium bathroom at half-time. Everyone is in a hurry.',
    spots: row(6),
    occupied: { 0: 'standing', 2: 'wide', 4: 'phone' },
    correct: [5],
    explanation: 'Urinals 2 and 4 put you between two guys; urinal 6 has only one neighbour.',
  },
  {
    id: 'stadium-gap',
    title: 'Packed stadium',
    context: 'The match restarts in two minutes.',
    spots: row(7),
    occupied: { 0: 'standing', 1: 'leaning', 2: 'phone', 4: 'wide', 5: 'hips' },
    correct: [6],
    explanation: 'Urinal 4 is a sandwich. Urinal 7 has a single neighbour.',
  },
  {
    id: 'airport',
    title: 'Airport, both ends taken',
    context: 'Your flight is boarding.',
    spots: row(7),
    occupied: { 0: 'standing', 6: 'phone' },
    explanation: 'Urinal 4 is exactly in the middle: three spots from both. Hurry!',
  },
  {
    id: 'leaners',
    title: 'Two tired guys in the middle',
    spots: row(6),
    occupied: { 2: 'leaning', 3: 'leaning' },
    explanation: 'Both ends are two spots from them.',
  },
  {
    id: 'hands-on-hips',
    title: 'Hands-free champion',
    spots: row(6),
    occupied: { 2: 'hips' },
    explanation: 'Urinal 6 is three spots away; urinal 1 only two. Give the champion room.',
  },
  {
    id: 'right-heavy',
    title: 'Busy on the right',
    spots: row(6),
    occupied: { 3: 'standing', 5: 'phone' },
    explanation: 'Urinal 1 is three spots from the nearest guy.',
  },
  {
    id: 'three-and-one',
    title: 'Corner crowd',
    spots: row(6),
    occupied: { 0: 'phone', 1: 'standing', 5: 'leaning' },
    explanation: 'Urinal 4 is two spots from both groups.',
  },

  // ---- stalls ---------------------------------------------------------------
  {
    id: 'checkerboard-stall',
    title: 'Checkerboard',
    spots: row(5, [STALL]),
    occupied: { 0: 'standing', 2: 'phone', 4: 'leaning' },
    explanation: 'Every free urinal is between two guys. The stall is the dignified exit.',
  },
  {
    id: 'urinal-free-stall-free',
    title: 'Plenty of space',
    spots: row(4, [STALL]),
    occupied: { 0: 'standing' },
    explanation: 'Urinal 4 is far away from him. Don\'t hog the stall when a good urinal is free.',
  },
  {
    id: 'ends-and-stall',
    title: 'Both ends taken, stall free',
    spots: row(5, [STALL]),
    occupied: { 0: 'standing', 4: 'phone' },
    explanation: 'Urinal 3 is two spots from both guys. That is good enough: leave the stall.',
  },
  {
    id: 'stall-guy',
    title: 'Someone in the stall',
    spots: row(3, [STALL]),
    occupied: { 0: 'standing', 3: 'standing' },
    explanation: 'The guy in the stall is behind a door and doesn\'t count. Urinal 3 is two spots from the other one.',
  },
  {
    id: 'stall-taken-one-free',
    title: 'One stall busy, one free',
    spots: [U, U, U, STALL, STALL],
    occupied: { 0: 'phone', 3: 'standing' },
    explanation: 'Urinal 3 leaves a gap from the phone guy. The free stall is for emergencies.',
  },
  {
    id: 'full-house-stall',
    title: 'Only one urinal left',
    spots: row(4, [STALL]),
    occupied: { 0: 'standing', 1: 'phone', 3: 'wide' },
    explanation: 'The last urinal is squeezed between two guys. Take the stall.',
  },
  {
    id: 'stall-by-the-door',
    title: 'Stall by the door',
    spots: [STALL, U, U, U],
    occupied: { 2: 'standing' },
    explanation: 'Urinals 2 and 4 are both next to him, so the stall wins.',
  },

  // ---- broken, sinks --------------------------------------------------------
  {
    id: 'broken-pair',
    title: 'Two broken urinals',
    spots: [U, BROKEN, BROKEN, U, U, U],
    occupied: { 4: 'standing' },
    explanation: 'Urinal 1 is four spots away from him. The broken ones count as free space.',
  },
  {
    id: 'broken-then-stall',
    title: 'Broken urinal, stall at the end',
    spots: [U, U, BROKEN, U, STALL],
    occupied: { 0: 'standing', 3: 'phone' },
    explanation: 'The only free urinal is right next to the door guy. The stall is better.',
  },
  {
    id: 'broken-edges',
    title: 'Out of order everywhere',
    spots: [BROKEN, U, U, BROKEN, U],
    occupied: { 1: 'leaning' },
    explanation: 'Urinal 5 is three spots from him.',
  },
  {
    id: 'festival',
    title: 'Festival toilets',
    context: 'Nobody else is here (for now).',
    spots: [BROKEN, BROKEN, U, BROKEN, STALL],
    occupied: {},
    explanation: 'Use the one urinal that works. Leave the stall for people who need to sit down.',
  },
  {
    id: 'sink-in-the-middle',
    title: 'Sink in the middle',
    spots: [U, U, SINK, U, U],
    occupied: { 1: 'phone' },
    explanation: 'Urinal 5 is the furthest from him, on the other side of the sink.',
  },
  {
    id: 'sinks-between',
    title: 'Sinks between the urinals',
    spots: [U, SINK, U, SINK, U],
    occupied: { 0: 'standing' },
    explanation: 'Urinal 5 is the furthest. The sinks just add space.',
  },

  // ---- dividers -------------------------------------------------------------
  {
    id: 'dividers-sandwich',
    title: 'Sandwich, but with dividers',
    spots: row(3, [STALL]),
    occupied: { 0: 'standing', 2: 'phone' },
    dividers: [0, 1],
    explanation: 'Normally a sandwich means the stall, but the dividers make urinal 2 fine. Keep the stall free.',
  },
  {
    id: 'one-divider',
    title: 'One lucky divider',
    spots: row(5),
    occupied: { 0: 'standing', 3: 'phone' },
    dividers: [2],
    explanation: 'Urinal 3 is two spots from the door guy and has a divider between you and the phone guy.',
  },
  {
    id: 'dividers-everywhere',
    title: 'Dividers everywhere',
    spots: row(6),
    occupied: { 0: 'standing', 2: 'leaning', 4: 'phone' },
    dividers: [0, 1, 2, 3, 4],
    explanation: 'With a divider on every side, any free urinal is fine.',
  },
  {
    id: 'divider-gap',
    title: 'A divider in the middle',
    spots: row(6),
    occupied: { 0: 'standing', 4: 'wide' },
    dividers: [3],
    explanation: 'Urinal 3 is two spots from both. Urinal 4 too, thanks to the divider.',
  },
  {
    id: 'divider-stall-choice',
    title: 'Dividers or stall?',
    spots: row(4, [STALL]),
    occupied: { 0: 'standing', 2: 'phone' },
    dividers: [0, 1, 2],
    explanation: 'Both free urinals have dividers on the busy side. No need for the stall.',
  },

  // ---- kid-height and dirty urinals -----------------------------------------
  {
    id: 'kid-urinal-or-sandwich',
    title: 'Kid urinal or sandwich?',
    spots: [U, U, U, LOW],
    occupied: { 0: 'standing', 2: 'phone' },
    correct: [3],
    explanation: 'Being sandwiched is worse than aiming low. Use the kid urinal (carefully).',
  },
  {
    id: 'kid-urinal-by-the-door',
    title: 'The low one is free',
    spots: [LOW, U, U, U, U],
    occupied: { 2: 'standing' },
    explanation: 'Urinal 5 is as far from him as the kid one, and it\'s your height.',
  },
  {
    id: 'kid-at-the-low-one',
    title: 'A kid at the low urinal',
    spots: [LOW, U, U, U],
    occupied: { 0: 'kid' },
    explanation: 'Keep your distance from the kid too: urinal 4.',
  },
  {
    id: 'only-low-left',
    title: 'Only the low one left',
    spots: [U, LOW, U, STALL],
    occupied: { 0: 'standing', 2: 'phone' },
    explanation: 'The kid urinal is between two guys. Use the stall.',
  },
  {
    id: 'dirty-far-end',
    title: 'The far one is disgusting',
    spots: [U, U, U, DIRTY],
    occupied: { 0: 'standing' },
    explanation: 'Urinal 3 still leaves a gap. No need to wade into the swamp.',
  },
  {
    id: 'dirty-dilemma',
    title: 'Gap or clean shoes?',
    spots: [U, U, U, DIRTY],
    occupied: { 1: 'standing' },
    correct: [3],
    explanation: 'Both clean urinals are next to him. The gap wins: step carefully into urinal 4.',
  },
  {
    id: 'dirty-middle',
    title: 'Dirty one in the middle',
    spots: [U, U, DIRTY, U, U],
    occupied: { 0: 'standing', 4: 'phone' },
    correct: [2],
    explanation: 'Gross, but it\'s the only one with a free urinal on both sides.',
  },

  // ---- people ---------------------------------------------------------------
  {
    id: 'your-boss',
    title: 'Your boss is here',
    spots: row(4),
    occupied: { 0: { pose: 'standing', tag: 'Your boss' } },
    explanation: 'Maximum distance, no small talk. He will respect it.',
  },
  {
    id: 'best-mate',
    title: 'Your best mate',
    spots: row(5),
    occupied: { 2: { pose: 'standing', tag: 'Your mate', say: 'Oi! Over here!' } },
    explanation: 'Friendship stops at the urinal. Keep the gap and talk later.',
  },
  {
    id: 'small-talker',
    title: 'The small-talker',
    spots: row(5),
    occupied: { 0: { pose: 'standing', say: 'Busy day, eh?' } },
    explanation: 'Urinal 5. Answer politely, eyes on the wall.',
  },
  {
    id: 'your-dad',
    title: 'Your dad',
    spots: row(4),
    occupied: { 1: { pose: 'hips', tag: 'Your dad' } },
    explanation: 'Urinal 4 is the only one with a gap.',
  },
  {
    id: 'father-in-law',
    title: 'Your future father-in-law',
    context: 'First dinner with the family.',
    spots: row(5),
    occupied: { 1: { pose: 'standing', tag: 'Father-in-law' } },
    explanation: 'Urinal 5 is three spots away. Nobody wants to start this relationship side by side.',
  },
  {
    id: 'celebrity',
    title: 'A famous footballer',
    spots: row(5),
    occupied: { 2: { pose: 'phone', tag: 'Famous player' } },
    explanation: 'Either end. And absolutely no selfie.',
  },
  {
    id: 'ceo-and-intern',
    title: 'The CEO and the intern',
    context: 'Office party.',
    spots: row(5),
    occupied: { 0: { pose: 'standing', tag: 'CEO' }, 4: { pose: 'phone', tag: 'Intern' } },
    explanation: 'Urinal 3 is two spots from both. Office politics stay outside.',
  },
  {
    id: 'the-groom',
    title: 'The groom',
    context: 'Wedding, 2am.',
    spots: row(4),
    occupied: { 0: { pose: 'drunk', tag: 'The groom', say: 'Best day ever!!' } },
    explanation: 'Congratulate him later, from urinal 4.',
  },
  {
    id: 'drunk-guy',
    title: 'Very drunk guy',
    context: 'Nightclub, 3am.',
    spots: row(5),
    occupied: { 1: 'drunk' },
    explanation: 'Stay out of the splash zone: urinal 5.',
  },
  {
    id: 'drunk-at-the-end',
    title: 'Drunk guy at the end',
    spots: row(4),
    occupied: { 3: 'drunk' },
    explanation: 'Urinal 1 is three spots from his wobbling.',
  },
  {
    id: 'the-whistler',
    title: 'The whistler',
    spots: row(5),
    occupied: { 1: { pose: 'leaning', say: '♪ fiu fiu ♪' } },
    explanation: 'Urinal 5. You can still hear the song, but from a distance.',
  },
  {
    id: 'the-waver',
    title: 'He waves at you',
    spots: row(3),
    occupied: { 0: { pose: 'standing', say: 'Hey! 👋' } },
    explanation: 'Wave back (with the free hand) from urinal 3.',
  },
  {
    id: 'phone-call',
    title: 'Loud phone call',
    spots: row(4),
    occupied: { 1: { pose: 'phone', say: '...yeah, I\'m at work' } },
    explanation: 'Urinal 4: stay out of the background noise of his call.',
  },
  {
    id: 'father-and-son',
    title: 'Father and son',
    spots: row(5),
    occupied: { 3: 'kid', 4: { pose: 'standing', tag: 'His dad' } },
    explanation: 'Urinal 1, as far as possible from the family.',
  },
  {
    id: 'school-trip',
    title: 'School trip',
    context: 'Museum bathroom, a class is visiting.',
    spots: row(6),
    occupied: { 0: 'kid', 2: 'kid', 4: 'kid' },
    correct: [5],
    explanation: 'Every free urinal touches a kid; urinal 6 only touches one.',
  },
  {
    id: 'gym',
    title: 'Gym locker room',
    spots: row(5),
    occupied: { 2: { pose: 'hips', say: 'Leg day, bro' } },
    explanation: 'Either end: two spots from him.',
  },
  {
    id: 'two-friends-talking',
    title: 'Two friends talking across a gap',
    spots: row(5),
    occupied: { 0: { pose: 'standing', say: 'And then...' }, 2: { pose: 'standing', say: 'No way!' } },
    explanation: 'Urinal 2 would put you in the middle of their conversation. Urinal 5 is two spots away.',
  },

  // ---- added with difficulty levels (mostly traps) --------------------------
  {
    id: 'counting-trap',
    title: 'Tempting ends',
    spots: row(7),
    occupied: { 1: 'standing', 5: 'phone' },
    explanation: 'Both ends are right next to someone. Urinal 4 is two spots from both guys.',
  },
  {
    id: 'broken-no-help',
    title: 'The broken one won\'t save you',
    spots: [U, U, BROKEN, U, U, U, STALL],
    occupied: { 0: 'standing', 4: 'phone' },
    explanation: 'Every working urinal is right next to someone. The broken one doesn\'t help: take the stall.',
  },
  {
    id: 'sink-spacing',
    title: 'Sinks everywhere',
    spots: [U, SINK, U, U, SINK, U],
    occupied: { 3: 'standing' },
    explanation: 'Urinal 1 is three spots from him; urinal 6 only two.',
  },
  {
    id: 'divider-by-the-door',
    title: 'Divider by the door',
    spots: row(5),
    occupied: { 0: 'standing', 3: 'phone' },
    dividers: [0],
    explanation: 'Urinal 2 has a divider shielding you from the door guy and is two spots from the phone guy.',
  },
  {
    id: 'hidden-gap',
    title: 'The hidden gap',
    spots: row(6),
    occupied: { 1: 'standing', 4: 'wide' },
    dividers: [3],
    explanation: 'Urinal 4 is two spots from the first guy and has a divider between you and the second.',
  },
  {
    id: 'next-to-the-stall',
    title: 'Next to a busy stall',
    spots: [U, U, U, STALL, U],
    occupied: { 0: 'standing', 3: 'standing' },
    explanation: 'The guy in the stall is behind a door. Urinal 5 is four spots from the other one.',
  },
  {
    id: 'dirty-or-stall',
    title: 'Dirty sandwich or stall?',
    spots: [U, U, DIRTY, U, STALL],
    occupied: { 1: 'standing', 3: 'phone' },
    explanation: 'The clean free urinal is next to someone and the dirty one is a sandwich. Stall.',
  },
  {
    id: 'kid-low-trap',
    title: 'Kid by the door',
    spots: [LOW, U, U, U, U, U],
    occupied: { 0: 'kid', 3: 'standing' },
    explanation: 'Urinal 6 is two spots from the man; everything else touches someone.',
  },
  {
    id: 'seven-two-answers',
    title: 'Two right answers',
    spots: row(7),
    occupied: { 2: 'phone', 6: 'standing' },
    explanation: 'Urinal 1 and urinal 5 are both two spots from the nearest guy.',
  },
  {
    id: 'one-stall-busy',
    title: 'One stall busy, guy in the middle',
    spots: [STALL, U, U, U, STALL],
    occupied: { 0: 'standing', 2: 'phone' },
    explanation: 'Both free urinals are next to the phone guy. Take the free stall at the end.',
  },
  {
    id: 'one-divider-not-enough',
    title: 'One divider is not enough',
    spots: row(4, [STALL]),
    occupied: { 0: 'standing', 2: 'phone' },
    dividers: [0],
    explanation: 'Urinal 2 still touches the guy on its right, and urinal 4 too. Stall.',
  },
  {
    id: 'sink-trap-stall',
    title: 'The sink trap',
    spots: [U, SINK, U, U, STALL],
    occupied: { 0: 'standing', 3: 'leaning' },
    explanation: 'Urinal 3 looks far from the door guy, but it touches the other one. Stall.',
  },
  {
    id: 'broken-buffers',
    title: 'Broken buffers',
    spots: [U, BROKEN, U, BROKEN, U],
    occupied: { 0: 'standing', 4: 'phone' },
    explanation: 'The middle urinal is two spots from both: the broken ones are a free buffer.',
  },
  {
    id: 'six-divider-middle',
    title: 'Divider in the middle',
    spots: row(6),
    occupied: { 0: 'standing', 5: 'hips' },
    dividers: [2],
    explanation: 'Urinals 3 and 4 are both two spots from the nearest guy.',
  },
  {
    id: 'class-and-teacher',
    title: 'The teacher too',
    context: 'School trip.',
    spots: row(7),
    occupied: { 0: 'kid', 1: 'kid', 4: { pose: 'standing', tag: 'Teacher' } },
    explanation: 'Urinal 7 is two spots from the teacher; the rest touch someone.',
  },
  {
    id: 'two-sinks-seven',
    title: 'Two sinks',
    spots: [U, U, SINK, U, U, SINK, U],
    occupied: { 1: 'leaning', 4: 'standing' },
    explanation: 'Urinal 7 is two spots from the nearest guy.',
  },
  {
    id: 'phone-divider',
    title: 'Divider on the right',
    spots: row(5),
    occupied: { 1: { pose: 'phone', say: 'Can you hear me?' }, 4: 'standing' },
    dividers: [3],
    explanation: 'Urinal 4 is two from the phone guy and has a divider on the other side.',
  },
  {
    id: 'both-stalls-busy',
    title: 'Both stalls busy',
    spots: [STALL, U, U, U, STALL],
    occupied: { 0: 'standing', 1: 'standing', 4: 'standing' },
    explanation: 'The stall guys don\'t count. Urinal 4 is two spots from the other one.',
  },
  {
    id: 'low-is-a-sandwich',
    title: 'Low one in a gap',
    spots: [U, U, LOW, U],
    occupied: { 1: 'standing', 3: 'phone' },
    explanation: 'The kid urinal is a sandwich; urinal 1 has only one neighbour.',
  },
];

// Difficulty of every scenario (a test checks each one has exactly one).
export const LEVELS = ['easy', 'medium', 'hard'];
const LEVEL_IDS = {
  easy: 'empty-room one-at-the-door one-in-the-middle both-ends buddies kid three-middle-taken four-second-taken far-end-taken door-side-trio pair-on-the-right lonely-middle left-crowd airport leaners right-heavy urinal-free-stall-free broken-edges festival sink-in-the-middle sinks-between kid-at-the-low-one your-boss best-mate small-talker father-in-law celebrity the-groom drunk-guy drunk-at-the-end the-whistler the-waver father-and-son gym',
  medium: 'two-guys-one-gap sandwich-and-a-stall out-of-order two-gaps gap-of-two split-seven every-other sandwich-or-end hands-on-hips three-and-one checkerboard-stall ends-and-stall stall-taken-one-free full-house-stall broken-pair dividers-everywhere kid-urinal-by-the-door only-low-left dirty-far-end your-dad ceo-and-intern phone-call two-friends-talking sink-spacing kid-low-trap six-divider-middle class-and-teacher two-sinks-seven both-stalls-busy low-is-a-sandwich',
  hard: 'half-time stadium-gap stall-guy stall-by-the-door broken-then-stall dividers-sandwich one-divider divider-gap divider-stall-choice kid-urinal-or-sandwich dirty-dilemma dirty-middle school-trip counting-trap broken-no-help divider-by-the-door hidden-gap next-to-the-stall dirty-or-stall seven-two-answers one-stall-busy one-divider-not-enough sink-trap-stall broken-buffers phone-divider',
};
for (const [level, ids] of Object.entries(LEVEL_IDS)) for (const id of ids.split(' ')) {
  const sc = SCENARIOS.find((x) => x.id === id);
  if (sc) sc.level = level;
}

const byId = new Map(SCENARIOS.map((s) => [s.id, s]));
export const getScenario = (id) => byId.get(id);

const PICKABLE = new Set([U, LOW, DIRTY, STALL]);
export const isPickable = (s, i) => PICKABLE.has(s.spots[i]) && !(i in s.occupied);

// The "correct" spots: maximise the distance to the nearest guy at a urinal
// (a divider counts as one extra spot; a guy in a stall is behind a door).
// A free stall wins only when the best urinal is directly next to someone.
// Kid-height and dirty urinals are a last resort.
export function correctSpots(s) {
  if (s.correct) return s.correct;
  const dividers = s.dividers ?? [];
  const occupied = Object.keys(s.occupied).map(Number).filter((i) => s.spots[i] !== STALL);
  const free = s.spots.map((_, i) => i).filter((i) => isPickable(s, i));
  const dist = (a, b) => Math.abs(a - b) + dividers.filter((d) => d >= Math.min(a, b) && d < Math.max(a, b)).length;
  const minDist = (i) => (occupied.length ? Math.min(...occupied.map((o) => dist(o, i))) : 99);
  const farthest = (list) => { const best = Math.max(...list.map(minDist)); return list.filter((i) => minDist(i) === best); };
  const urinals = free.filter((i) => s.spots[i] === U);
  const stalls = free.filter((i) => s.spots[i] === STALL);
  if (urinals.length) {
    const best = farthest(urinals);
    return stalls.length && minDist(best[0]) <= 1 ? stalls : best;
  }
  if (stalls.length) return stalls;
  return farthest(free);
}

// Texts in the game's language (English lives inline above, Spanish in scenarios.es.mjs).
export const LANGS = ['es', 'en'];
const TEXTS = { es: ES };
export function localize(s, lang) {
  const tr = TEXTS[lang]?.[s.id];
  if (!tr) return s;
  const occupied = { ...s.occupied };
  for (const [i, p] of Object.entries(tr.people ?? {})) occupied[i] = { ...(typeof occupied[i] === 'object' ? occupied[i] : { pose: occupied[i] }), ...p };
  return { ...s, title: tr.title, explanation: tr.explanation, ...(s.context && { context: tr.context }), occupied };
}

// What the players get: everything but the answer.
export function publicScenario(s, lang) {
  const { correct, explanation, ...rest } = localize(s, lang);
  return rest;
}
