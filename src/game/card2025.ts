// ============================================================================
// NMJL 2025 Card — winning hands data.
// ----------------------------------------------------------------------------
// Each hand is expanded into concrete instances (suit assignments / number
// choices) at module load. The matcher (match.ts) and bots only read CARD.
//
// NOTE FOR THE OPERATOR: this data was reconstructed from public analyses of
// the 2025 NMJL card (ilovemahj.com full analysis, sloperama FAQ). The written
// form of a small number of lines should be verified against the official
// printed 2025 card you sell/own. Editing a line here immediately updates the
// game, the card reference page and the bots.
// ============================================================================

import {
  SUITS, suitKey, windKey, dragonKey, FLOWER, dragonForSuit,
} from './tiles';
import type { SuitName, TileKey } from './tiles';

export type SectionId =
  | 'y2025' | 'e2468' | 'aln' | 'quints' | 'cr' | 'o13579' | 'wd' | 't369' | 'sp';

export interface GroupSpec {
  tiles: TileKey[];   // exact tiles of the group (repeats allowed)
  jokerOk: boolean;   // jokers may substitute inside this group
}

export interface CardHand {
  id: string;          // e.g. "2025-1", "CR-2a"
  section: SectionId;
  groups: GroupSpec[];
  concealed: boolean;  // C hands: no exposures allowed before mahjong
  value: number;       // base point value
  noteEn: string;      // parenthetical from the card
  noteZh: string;
}

// --- group helpers -----------------------------------------------------------
/** same-tile group (pair/pung/kong/quint) */
const g = (t: TileKey, n: number): GroupSpec => ({ tiles: Array(n).fill(t), jokerOk: n >= 3 });
/** pair (never jokers) */
const p = (t: TileKey): GroupSpec => ({ tiles: [t, t], jokerOk: false });
/** group of distinct singles (NEWS, 2025, runs…) — never jokers, never exposed */
const s = (...ts: TileKey[]): GroupSpec => ({ tiles: ts, jokerOk: false });

const F = FLOWER;
const DR = dragonKey;
const W = windKey;
const sk = (suit: SuitName, n: number) => suitKey(suit, n);
const NEWS = () => s(W('N'), W('E'), W('W'), W('S'));
const Y2025 = (suit: SuitName) => s(sk(suit, 2), DR('W'), sk(suit, 2), sk(suit, 5));

/** all 6 ordered assignments of the 3 suits to 3 distinct roles */
function perms3(): [SuitName, SuitName, SuitName][] {
  const out: [SuitName, SuitName, SuitName][] = [];
  for (const a of SUITS) for (const b of SUITS) for (const c of SUITS)
    if (a !== b && b !== c && a !== c) out.push([a, b, c]);
  return out;
}
/** ordered pairs of distinct suits */
function perms2(): [SuitName, SuitName][] {
  const out: [SuitName, SuitName][] = [];
  for (const a of SUITS) for (const b of SUITS) if (a !== b) out.push([a, b]);
  return out;
}

const hands: CardHand[] = [];
function add(
  id: string, section: SectionId, concealed: boolean, value: number,
  noteEn: string, noteZh: string, groups: GroupSpec[],
) {
  hands.push({ id, section, concealed, value, noteEn, noteZh, groups });
}

// ============================================================================
// 2025
// ============================================================================
// 2025-1: FFFF 2025 222 222 (any 3 suits, like pungs 2s or 5s) — X25
for (const x of [2, 5]) for (const a of SUITS) {
  const [b1, c1] = SUITS.filter((u) => u !== a);
  add('2025-1', 'y2025', false, 25,
    'Any 3 suits, like pungs 2s or 5s', '任意三门，2或5的同数刻子',
    [g(F, 4), Y2025(a), g(sk(b1, x), 3), g(sk(c1, x), 3)]);
}
// 2025-2: 222 0000 222 5555 (any 2 suits) — X25
for (const [a, b1] of perms2()) {
  add('2025-2', 'y2025', false, 25,
    'Any 2 suits', '任意两门',
    [g(sk(a, 2), 3), g(DR('W'), 4), g(sk(b1, 2), 3), g(sk(b1, 5), 4)]);
}
// 2025-3: 2025 222 555 DDDD (any 3 suits) — X30
for (const [a, b1, c1] of perms3()) {
  add('2025-3', 'y2025', false, 30,
    'Any 3 suits', '任意三门',
    [Y2025(a), g(sk(b1, 2), 3), g(sk(b1, 5), 3), g(DR(dragonForSuit(c1)), 4)]);
}
// 2025-4: 22 000 222 555 DDD (any 3 suits) — C30
for (const [a, b1, c1] of perms3()) {
  add('2025-4', 'y2025', true, 30,
    'Any 3 suits', '任意三门',
    [p(sk(a, 2)), g(DR('W'), 3), g(sk(b1, 2), 3), g(sk(b1, 5), 3), g(DR(dragonForSuit(c1)), 3)]);
}

// ============================================================================
// 2468
// ============================================================================
// 2468-1a: 222 4444 666 8888 (any 1 suit) — X25
for (const a of SUITS) {
  add('2468-1a', 'e2468', false, 25, 'Any 1 suit', '任意一门',
    [g(sk(a, 2), 3), g(sk(a, 4), 4), g(sk(a, 6), 3), g(sk(a, 8), 4)]);
}
// 2468-1b: 222 4444 666 8888 (any 2 suits) — X25
for (const [a, b1] of perms2()) {
  add('2468-1b', 'e2468', false, 25, 'Any 2 suits', '任意两门',
    [g(sk(a, 2), 3), g(sk(a, 4), 4), g(sk(b1, 6), 3), g(sk(b1, 8), 4)]);
}
// 2468-2a: FF 2222+4444=6666 (any 3 suits) — X25
for (const [a, b1, c1] of perms3()) {
  add('2468-2a', 'e2468', false, 25, 'Any 3 suits, these nos. only', '任意三门，仅限这些数字',
    [p(F), g(sk(a, 2), 4), g(sk(b1, 4), 4), g(sk(c1, 6), 4)]);
}
// 2468-2b: FF 2222+6666=8888 (any 3 suits) — X25
for (const [a, b1, c1] of perms3()) {
  add('2468-2b', 'e2468', false, 25, 'Any 3 suits, these nos. only', '任意三门，仅限这些数字',
    [p(F), g(sk(a, 2), 4), g(sk(b1, 6), 4), g(sk(c1, 8), 4)]);
}
// 2468-3: 22 444 66 888 DDDD (any 3 suits) — X25
for (const [a, b1] of perms2()) for (const dc of ['R', 'G', 'W'] as const) {
  add('2468-3', 'e2468', false, 25, 'Any 3 suits, kong any dragon', '任意三门，任意龙杠',
    [p(sk(a, 2)), g(sk(a, 4), 3), p(sk(b1, 6)), g(sk(b1, 8), 3), g(DR(dc), 4)]);
}
// 2468-4: FFFF 2468 222 222 (any 3 suits, like pungs any even no.) — X25
for (const x of [2, 4, 6, 8]) for (const a of SUITS) {
  const [b1, c1] = SUITS.filter((u) => u !== a);
  add('2468-4', 'e2468', false, 25, 'Any 3 suits, like pungs any even no.', '任意三门，任意偶数同数刻子',
    [g(F, 4), s(sk(a, 2), sk(a, 4), sk(a, 6), sk(a, 8)), g(sk(b1, x), 3), g(sk(c1, x), 3)]);
}
// 2468-5: FFF 22 44 666 8888 (any 1 suit) — X25
for (const a of SUITS) {
  add('2468-5', 'e2468', false, 25, 'Any 1 suit', '任意一门',
    [g(F, 3), p(sk(a, 2)), p(sk(a, 4)), g(sk(a, 6), 3), g(sk(a, 8), 4)]);
}
// 2468-6: 222 4444 666 88 88 (any 3 suits, pairs 8s only) — X25
for (const a of SUITS) {
  const [b1, c1] = SUITS.filter((u) => u !== a);
  add('2468-6', 'e2468', false, 25, 'Any 3 suits, pairs 8s only', '任意三门，对子仅限8',
    [g(sk(a, 2), 3), g(sk(a, 4), 4), g(sk(a, 6), 3), p(sk(b1, 8)), p(sk(c1, 8))]);
}
// 2468-7: FF 2222 2222 DDDD (any 3 suits, like kongs any even, kong any dragon) — X25
for (const x of [2, 4, 6, 8]) for (const [a, b1] of perms2()) for (const dc of ['R', 'G', 'W'] as const) {
  add('2468-7', 'e2468', false, 25, 'Any 3 suits, like kongs any even no.', '任意三门，任意偶数同数杠',
    [p(F), g(sk(a, x), 4), g(sk(b1, x), 4), g(DR(dc), 4)]);
}
// 2468-8: 22 44 66 88 222 222 (any 3 suits, like pungs any even no.) — C30
for (const x of [2, 4, 6, 8]) for (const a of SUITS) {
  const [b1, c1] = SUITS.filter((u) => u !== a);
  add('2468-8', 'e2468', true, 30, 'Any 3 suits, like pungs any even no.', '任意三门，任意偶数同数刻子',
    [p(sk(a, 2)), p(sk(a, 4)), p(sk(a, 6)), p(sk(a, 8)), g(sk(b1, x), 3), g(sk(c1, x), 3)]);
}

// ============================================================================
// ANY LIKE NUMBERS
// ============================================================================
// ALN-1: FF 1111 D 1111 D 11 (any 3 suits) — X25
for (let n = 1; n <= 9; n++) for (const c1 of SUITS) {
  const [a, b1] = SUITS.filter((u) => u !== c1);
  add('ALN-1', 'aln', false, 25, 'Any 3 suits', '任意三门',
    [p(F), g(sk(a, n), 4), s(DR(dragonForSuit(a))), g(sk(b1, n), 4), s(DR(dragonForSuit(b1))), p(sk(c1, n))]);
}
// ALN-2: FFFF 11 111 111 11 (any 3 suits, pairs must be same suit) — X30
for (let n = 1; n <= 9; n++) for (const c1 of SUITS) {
  const [a, b1] = SUITS.filter((u) => u !== c1);
  add('ALN-2', 'aln', false, 30, 'Any 3 suits, pairs must be same suit', '任意三门，两对必须同门',
    [g(F, 4), p(sk(c1, n)), g(sk(a, n), 3), g(sk(b1, n), 3), p(sk(c1, n))]);
}
// ALN-3: FF 111 DDD 111 DDD (any 2 suits, matching dragons) — C30
for (let n = 1; n <= 9; n++) for (const [a, b1] of perms2()) {
  add('ALN-3', 'aln', true, 30, 'Any 2 suits, matching dragons', '任意两门，龙牌对应同门',
    [p(F), g(sk(a, n), 3), g(DR(dragonForSuit(a)), 3), g(sk(b1, n), 3), g(DR(dragonForSuit(b1)), 3)]);
}

// ============================================================================
// QUINTS
// ============================================================================
// Q-1: FF 111 2222 33333 (any 3 suits, any 3 consec. nos.) — X40
for (let n = 1; n <= 7; n++) for (const [a, b1, c1] of perms3()) {
  add('Q-1', 'quints', false, 40, 'Any 3 suits, any 3 consec. nos.', '任意三门，任意3连号',
    [p(F), g(sk(a, n), 3), g(sk(b1, n + 1), 4), g(sk(c1, n + 2), 5)]);
}
// Q-2: 11111 NNNN 22222 (any 1 suit, any 2 consec. nos., kong any wind) — X45
for (let n = 1; n <= 8; n++) for (const a of SUITS) for (const w of ['N', 'E', 'W', 'S'] as const) {
  add('Q-2', 'quints', false, 45, 'Any 1 suit, any 2 consec. nos., kong any wind', '任意一门，任意2连号，任意风杠',
    [g(sk(a, n), 5), g(W(w), 4), g(sk(a, n + 1), 5)]);
}
// Q-3: FF 11111 11 11111 (any 3 suits, any like no.) — X40
for (let n = 1; n <= 9; n++) for (const b1 of SUITS) {
  const [a, c1] = SUITS.filter((u) => u !== b1);
  add('Q-3', 'quints', false, 40, 'Any 3 suits, any like no.', '任意三门，任意同数',
    [p(F), g(sk(a, n), 5), p(sk(b1, n)), g(sk(c1, n), 5)]);
}

// ============================================================================
// CONSECUTIVE RUN
// ============================================================================
// CR-1a: 11 222 3333 444 55 (any 1 suit, these nos. only) — X25
for (const a of SUITS) {
  add('CR-1a', 'cr', false, 25, 'Any 1 suit, these nos. only', '任意一门，仅限这些数字',
    [p(sk(a, 1)), g(sk(a, 2), 3), g(sk(a, 3), 4), g(sk(a, 4), 3), p(sk(a, 5))]);
}
// CR-1b: 55 666 7777 888 99 (any 1 suit, these nos. only) — X25
for (const a of SUITS) {
  add('CR-1b', 'cr', false, 25, 'Any 1 suit, these nos. only', '任意一门，仅限这些数字',
    [p(sk(a, 5)), g(sk(a, 6), 3), g(sk(a, 7), 4), g(sk(a, 8), 3), p(sk(a, 9))]);
}
// CR-2a: 111 2222 333 4444 (any 1 suit, any 4 consec. nos.) — X25
for (let n = 1; n <= 6; n++) for (const a of SUITS) {
  add('CR-2a', 'cr', false, 25, 'Any 1 suit, any 4 consec. nos.', '任意一门，任意4连号',
    [g(sk(a, n), 3), g(sk(a, n + 1), 4), g(sk(a, n + 2), 3), g(sk(a, n + 3), 4)]);
}
// CR-2b: 111 2222 333 4444 (any 2 suits, any 4 consec. nos.) — X25
for (let n = 1; n <= 6; n++) for (const [a, b1] of perms2()) {
  add('CR-2b', 'cr', false, 25, 'Any 2 suits, any 4 consec. nos.', '任意两门，任意4连号',
    [g(sk(a, n), 3), g(sk(a, n + 1), 4), g(sk(b1, n + 2), 3), g(sk(b1, n + 3), 4)]);
}
// CR-3a: FFFF 1111 22 3333 (any 1 suit, any 3 consec. nos.) — X25
for (let n = 1; n <= 7; n++) for (const a of SUITS) {
  add('CR-3a', 'cr', false, 25, 'Any 1 suit, any 3 consec. nos.', '任意一门，任意3连号',
    [g(F, 4), g(sk(a, n), 4), p(sk(a, n + 1)), g(sk(a, n + 2), 4)]);
}
// CR-3b: FFFF 1111 22 3333 (any 3 suits, any 3 consec. nos.) — X25
for (let n = 1; n <= 7; n++) for (const [a, b1, c1] of perms3()) {
  add('CR-3b', 'cr', false, 25, 'Any 3 suits, any 3 consec. nos.', '任意三门，任意3连号',
    [g(F, 4), g(sk(a, n), 4), p(sk(b1, n + 1)), g(sk(c1, n + 2), 4)]);
}
// CR-4: FFF 123 4444 5555 (any 3 suits, any 5 consec. nos.) — X25
for (let n = 1; n <= 5; n++) for (const [a, b1, c1] of perms3()) {
  add('CR-4', 'cr', false, 25, 'Any 3 suits, any 5 consec. nos.', '任意三门，任意5连号',
    [g(F, 3), s(sk(a, n), sk(a, n + 1), sk(a, n + 2)), g(sk(b1, n + 3), 4), g(sk(c1, n + 4), 4)]);
}
// CR-5: FF 11 222 3333 DDD (any 3 consec. nos. with opp. dragon) — X25
for (let n = 1; n <= 7; n++) for (const a of SUITS) {
  for (const dc of SUITS.filter((u) => u !== a).map(dragonForSuit)) {
    add('CR-5', 'cr', false, 25, 'Any 3 consec. nos. with opp. dragon', '任意3连号配对冲龙',
      [p(F), p(sk(a, n)), g(sk(a, n + 1), 3), g(sk(a, n + 2), 4), g(DR(dc), 3)]);
  }
}
// CR-6: 111 222 3333 DDDD (any 3 consec. nos. with opp. dragons) — X25
for (let n = 1; n <= 7; n++) for (const a of SUITS) {
  for (const dc of SUITS.filter((u) => u !== a).map(dragonForSuit)) {
    add('CR-6', 'cr', false, 25, 'Any 3 consec. nos. with opp. dragons', '任意3连号配对冲龙',
      [g(sk(a, n), 3), g(sk(a, n + 1), 3), g(sk(a, n + 2), 4), g(DR(dc), 4)]);
  }
}
// CR-7: 112345 1111 1111 (any 5 consec. nos., pair any no. in run, kongs match pair) — X30
for (let n = 1; n <= 5; n++) for (let k = n; k <= n + 4; k++) for (const a of SUITS) {
  const [b1, c1] = SUITS.filter((u) => u !== a);
  const run: TileKey[] = [];
  for (let i = n; i <= n + 4; i++) run.push(sk(a, i));
  run.push(sk(a, k));
  add('CR-7', 'cr', false, 30, 'Any 5 consec. nos., pair any no. in run, kongs match pair',
    '任意5连号，对子为连号中任意数，两杠与对子同数',
    [s(...run), g(sk(b1, k), 4), g(sk(c1, k), 4)]);
}
// CR-8: 11 2 33 111 2 33 111 (any 3 suits, any same 3 consec. nos.) — X25
for (let n = 1; n <= 7; n++) for (const a of SUITS) {
  const [b1, c1] = SUITS.filter((u) => u !== a);
  add('CR-8', 'cr', false, 25, 'Any 3 suits, any same 3 consec. nos.', '任意三门，任意相同3连号',
    [p(sk(a, n)), s(sk(a, n + 1)), p(sk(a, n + 2)), g(sk(b1, n), 3), s(sk(b1, n + 1)), p(sk(b1, n + 2)), g(sk(c1, n), 3)]);
}

// ============================================================================
// 13579
// ============================================================================
// 13579-1a: 11 333 5555 777 99 (any 1 suit) — X25
for (const a of SUITS) {
  add('13579-1a', 'o13579', false, 25, 'Any 1 suit', '任意一门',
    [p(sk(a, 1)), g(sk(a, 3), 3), g(sk(a, 5), 4), g(sk(a, 7), 3), p(sk(a, 9))]);
}
// 13579-1b: 11 333 5555 777 99 (any 2 suits) — X25
for (const [a, b1] of perms2()) {
  add('13579-1b', 'o13579', false, 25, 'Any 2 suits', '任意两门',
    [p(sk(a, 1)), g(sk(a, 3), 3), g(sk(a, 5), 4), g(sk(b1, 7), 3), p(sk(b1, 9))]);
}
// 13579-2a: 111 3333 555 7777 (any 1 suit) — X25
for (const a of SUITS) {
  add('13579-2a', 'o13579', false, 25, 'Any 1 suit', '任意一门',
    [g(sk(a, 1), 3), g(sk(a, 3), 4), g(sk(a, 5), 3), g(sk(a, 7), 4)]);
}
// 13579-2b: 555 7777 777 9999 (any 2 suits, like pungs 7s) — X25
for (const [a, b1] of perms2()) {
  add('13579-2b', 'o13579', false, 25, 'Any 2 suits, like pungs 7s', '任意两门，7的同数刻子',
    [g(sk(a, 5), 3), g(sk(a, 7), 4), g(sk(b1, 7), 3), g(sk(b1, 9), 4)]);
}
// 13579-3a: 1111 333 5555 999 (any 1 suit) — X25
for (const a of SUITS) {
  add('13579-3a', 'o13579', false, 25, 'Any 1 suit', '任意一门',
    [g(sk(a, 1), 4), g(sk(a, 3), 3), g(sk(a, 5), 4), p(sk(a, 9))]);
}
// 13579-3b: 111 5555 777 9999 (any 1 suit) — X25
for (const a of SUITS) {
  add('13579-3b', 'o13579', false, 25, 'Any 1 suit', '任意一门',
    [p(sk(a, 1)), g(sk(a, 5), 4), g(sk(a, 7), 3), g(sk(a, 9), 4)]);
}
// 13579-4: FFFF 1111+9999=10 (any 2 suits, these nos. only) — X25
for (const [a, b1] of perms2()) {
  add('13579-4', 'o13579', false, 25, 'Any 2 suits, these nos. only', '任意两门，仅限这些数字',
    [g(F, 4), g(sk(a, 1), 4), g(sk(a, 9), 4), s(sk(b1, 1)), s(DR('W'))]);
}
// 13579-5a: FFF 135 7777 9999 (any 1 suit) — X25
for (const a of SUITS) {
  add('13579-5a', 'o13579', false, 25, 'Any 1 suit', '任意一门',
    [g(F, 3), s(sk(a, 1), sk(a, 3), sk(a, 5)), g(sk(a, 7), 4), g(sk(a, 9), 4)]);
}
// 13579-5b: FFF 135 7777 9999 (any 3 suits) — X25
for (const [a, b1, c1] of perms3()) {
  add('13579-5b', 'o13579', false, 25, 'Any 3 suits', '任意三门',
    [g(F, 3), s(sk(a, 1), sk(a, 3), sk(a, 5)), g(sk(b1, 7), 4), g(sk(c1, 9), 4)]);
}
// 13579-6a: 111 333 5555 DDDD (any 3 suits, opp. dragons) — X25
for (const a of SUITS) for (const dc of SUITS.filter((u) => u !== a).map(dragonForSuit)) {
  add('13579-6a', 'o13579', false, 25, 'Any 3 suits, opp. dragons', '任意三门，对冲龙',
    [g(sk(a, 1), 3), g(sk(a, 3), 3), g(sk(a, 5), 4), g(DR(dc), 4)]);
}
// 13579-6b: 555 777 9999 DDDD (any 3 suits, opp. dragons) — X25
for (const a of SUITS) for (const dc of SUITS.filter((u) => u !== a).map(dragonForSuit)) {
  add('13579-6b', 'o13579', false, 25, 'Any 3 suits, opp. dragons', '任意三门，对冲龙',
    [g(sk(a, 5), 3), g(sk(a, 7), 3), g(sk(a, 9), 4), g(DR(dc), 4)]);
}
// 13579-7a: 11 333 NEWS 333 55 (any 2 suits, like pungs 3s) — X30
for (const [a, b1] of perms2()) {
  add('13579-7a', 'o13579', false, 30, 'Any 2 suits, like pungs 3s', '任意两门，3的同数刻子',
    [p(sk(a, 1)), g(sk(a, 3), 3), NEWS(), g(sk(b1, 3), 3), p(sk(b1, 5))]);
}
// 13579-7b: 55 777 NEWS 777 99 (any 2 suits, like pungs 7s) — X30
for (const [a, b1] of perms2()) {
  add('13579-7b', 'o13579', false, 30, 'Any 2 suits, like pungs 7s', '任意两门，7的同数刻子',
    [p(sk(a, 5)), g(sk(a, 7), 3), NEWS(), g(sk(b1, 7), 3), p(sk(b1, 9))]);
}
// 13579-8: 1111 99 1111 99 1111 (any 3 suits, like kongs 1s, pairs 9s) — X30
for (const [a, b1, c1] of perms3()) {
  add('13579-8', 'o13579', false, 30, 'Any 3 suits, like kongs 1s, pairs 9s', '任意三门，1的同数杠与9的对子',
    [g(sk(a, 1), 4), p(sk(b1, 9)), g(sk(b1, 1), 4), p(sk(c1, 9)), g(sk(c1, 1), 4)]);
}
// 13579-9a: 11 33 55 111 111 11 (any 3 suits, like pungs 1s or 3s) — X25
for (const x of [1, 3]) for (const a of SUITS) {
  const [b1, c1] = SUITS.filter((u) => u !== a);
  add('13579-9a', 'o13579', false, 25, 'Any 3 suits, like pungs 1s or 3s', '任意三门，1或3的同数刻子',
    [p(sk(a, 1)), p(sk(a, 3)), p(sk(a, 5)), g(sk(b1, x), 3), g(sk(c1, x), 3), p(sk(a, x))]);
}
// 13579-9b: 55 77 99 555 555 55 (any 3 suits, like pungs 5s or 7s) — X25
for (const x of [5, 7]) for (const a of SUITS) {
  const [b1, c1] = SUITS.filter((u) => u !== a);
  add('13579-9b', 'o13579', false, 25, 'Any 3 suits, like pungs 5s or 7s', '任意三门，5或7的同数刻子',
    [p(sk(a, 5)), p(sk(a, 7)), p(sk(a, 9)), g(sk(b1, x), 3), g(sk(c1, x), 3), p(sk(a, x))]);
}

// ============================================================================
// WINDS & DRAGONS
// ============================================================================
// WD-1a: NNNN EEE WWW SSSS — X25
add('WD-1a', 'wd', false, 25, 'Kongs N & S', '北、南为杠',
  [g(W('N'), 4), g(W('E'), 3), g(W('W'), 3), g(W('S'), 4)]);
// WD-1b: NNN EEEE WWWW SSS — X25
add('WD-1b', 'wd', false, 25, 'Kongs E & W', '东、西为杠',
  [g(W('N'), 3), g(W('E'), 4), g(W('W'), 4), g(W('S'), 3)]);
// WD-2: FF 123 DD DDD DDDD (any 3 consec. nos. in any 1 suit, any 3 dragons) — X25
for (let n = 1; n <= 7; n++) for (const a of SUITS) for (const [d1, d2, d3] of perms3Dragons()) {
  add('WD-2', 'wd', false, 25, 'Any 3 consec. nos. in any 1 suit, any 3 dragons', '任意一门任意3连号，三种龙牌任意组合',
    [p(F), s(sk(a, n), sk(a, n + 1), sk(a, n + 2)), p(DR(d1)), g(DR(d2), 3), g(DR(d3), 4)]);
}
function perms3Dragons(): ['R' | 'G' | 'W', 'R' | 'G' | 'W', 'R' | 'G' | 'W'][] {
  const D = ['R', 'G', 'W'] as const;
  const out: ['R' | 'G' | 'W', 'R' | 'G' | 'W', 'R' | 'G' | 'W'][] = [];
  for (const x of D) for (const y of D) for (const z of D)
    if (x !== y && y !== z && x !== z) out.push([x, y, z]);
  return out;
}
// WD-3: FFF NN EE WWW SSSS — X25
add('WD-3', 'wd', false, 25, '', '',
  [g(F, 3), p(W('N')), p(W('E')), g(W('W'), 3), g(W('S'), 4)]);
// WD-4: FFFF DDD NEWS DDD (any 2 suits) — X25
for (const [d1, d2] of [['R', 'G'], ['R', 'W'], ['G', 'W']] as const) {
  add('WD-4', 'wd', false, 25, 'Any 2 suits', '任意两门',
    [g(F, 4), g(DR(d1), 3), NEWS(), g(DR(d2), 3)]);
}
// WD-5: NNNN 1 11 111 SSSS (any 3 suits, like odd nos.) — X25
for (const n of [1, 3, 5, 7, 9]) for (const [a, b1, c1] of perms3()) {
  add('WD-5', 'wd', false, 25, 'Any 3 suits, like odd nos.', '任意三门，同数奇数',
    [g(W('N'), 4), s(sk(a, n)), p(sk(b1, n)), g(sk(c1, n), 3), g(W('S'), 4)]);
}
// WD-6: EEEE 2 22 222 WWWW (any 3 suits, like even nos.) — X25
for (const n of [2, 4, 6, 8]) for (const [a, b1, c1] of perms3()) {
  add('WD-6', 'wd', false, 25, 'Any 3 suits, like even nos.', '任意三门，同数偶数',
    [g(W('E'), 4), s(sk(a, n)), p(sk(b1, n)), g(sk(c1, n), 3), g(W('W'), 4)]);
}
// WD-7a: EE WWW SS NN 2025 (any 1 suit) — X30  (year hand)
for (const a of SUITS) {
  add('WD-7a', 'wd', false, 30, 'Any 1 suit', '任意一门',
    [p(W('E')), g(W('W'), 3), g(W('S'), 3), p(W('N')), Y2025(a)]);
}
// WD-7b: EEE WW SS NNN 2025 (any 1 suit) — X30  (year hand)
for (const a of SUITS) {
  add('WD-7b', 'wd', false, 30, 'Any 1 suit', '任意一门',
    [g(W('E'), 3), p(W('W')), p(W('S')), g(W('N'), 3), Y2025(a)]);
}
// WD-8: NN EE WWW SSS DDDD (kong any dragon) — X25
for (const dc of ['R', 'G', 'W'] as const) {
  add('WD-8', 'wd', false, 25, 'Kong any dragon', '任意龙杠',
    [p(W('N')), p(W('E')), g(W('W'), 3), g(W('S'), 3), g(DR(dc), 4)]);
}

// ============================================================================
// 369
// ============================================================================
// 369-1a: 333 6666 666 9999 (any 1 suit) — X25
for (const a of SUITS) {
  add('369-1a', 't369', false, 25, 'Any 1 suit', '任意一门',
    [g(sk(a, 3), 3), g(sk(a, 6), 4), g(sk(a, 6), 3), g(sk(a, 9), 4)]);
}
// 369-1b: 333 6666 666 9999 (any 2 suits, like pungs 6s) — X25
for (const [a, b1] of perms2()) {
  add('369-1b', 't369', false, 25, 'Any 2 suits, like pungs 6s', '任意两门，6的同数刻子',
    [g(sk(a, 3), 3), g(sk(a, 6), 4), g(sk(b1, 6), 3), g(sk(b1, 9), 4)]);
}
// 369-2a: FF 3333+6666=9999 (any 1 suit) — X25
for (const a of SUITS) {
  add('369-2a', 't369', false, 25, 'Any 1 suit, these nos. only', '任意一门，仅限这些数字',
    [p(F), g(sk(a, 3), 4), g(sk(a, 6), 4), g(sk(a, 9), 4)]);
}
// 369-2b: FF 3333+6666=9999 (any 2 suits) — X25
for (const [a, b1] of perms2()) {
  add('369-2b', 't369', false, 25, 'Any 2 suits, these nos. only', '任意两门，仅限这些数字',
    [p(F), g(sk(a, 3), 4), g(sk(a, 6), 4), g(sk(b1, 9), 4)]);
}
// 369-3: 3333 666 9999 DDD (any 2 suits, any dragon pung) — X25
for (const a of SUITS) for (const dc of ['R', 'G', 'W'] as const) {
  add('369-3', 't369', false, 25, 'Any 2 suits, any dragon pung', '任意两门，任意龙刻',
    [g(sk(a, 3), 4), g(sk(a, 6), 3), g(sk(a, 9), 4), g(DR(dc), 3)]);
}
// 369-4: FFF 3333 369 9999 (any 2 suits) — X25
for (const [a, b1] of perms2()) {
  add('369-4', 't369', false, 25, 'Any 2 suits', '任意两门',
    [g(F, 3), g(sk(a, 3), 4), s(sk(b1, 3), sk(b1, 6), sk(b1, 9)), g(sk(a, 9), 4)]);
}
// 369-5: 33 66 99 3333 3333 (any 3 suits, like kongs 3, 6, or 9) — X25
for (const x of [3, 6, 9]) for (const a of SUITS) {
  const [b1, c1] = SUITS.filter((u) => u !== a);
  add('369-5', 't369', false, 25, 'Any 3 suits, like kongs 3, 6, or 9', '任意三门，3/6/9的同数杠',
    [p(sk(a, 3)), p(sk(a, 6)), p(sk(a, 9)), g(sk(b1, x), 4), g(sk(c1, x), 4)]);
}
// 369-6: 33 666 3 666 3 666 3 (any 3 suits) — X25
for (const a of SUITS) {
  const [b1, c1] = SUITS.filter((u) => u !== a);
  add('369-6', 't369', false, 25, 'Any 3 suits', '任意三门',
    [p(sk(a, 3)), g(sk(a, 6), 3), s(sk(b1, 3)), g(sk(b1, 6), 3), s(sk(c1, 3)), g(sk(c1, 6), 3), s(sk(a, 3))]);
}

// ============================================================================
// SINGLES & PAIRS (all concealed)
// ============================================================================
// SP-1: FF 1 5 11 22 33 44 55 (any 1 suit, any 5 consec. nos.) — C50
for (let n = 1; n <= 5; n++) for (const a of SUITS) {
  add('SP-1', 'sp', true, 50, 'Any 1 suit, any 5 consec. nos.', '任意一门，任意5连号',
    [p(F), s(sk(a, n)), s(sk(a, n + 4)), p(sk(a, n)), p(sk(a, n + 1)), p(sk(a, n + 2)), p(sk(a, n + 3)), p(sk(a, n + 4))]);
}
// SP-2: FF 2025 FF 2025 FF (any 3 suits) — C50
for (const [a, b1] of [['bam', 'crak'], ['bam', 'dot'], ['crak', 'dot']] as [SuitName, SuitName][]) {
  add('SP-2', 'sp', true, 50, 'Any 3 suits', '任意三门',
    [p(F), Y2025(a), p(F), Y2025(b1), p(F)]);
}
// SP-3: 33 66 99 33 66 99 33 (any 3 suits, like pair 3, 6 or 9) — C50
for (const x of [3, 6, 9]) for (const c1 of SUITS) {
  const [a, b1] = SUITS.filter((u) => u !== c1);
  add('SP-3', 'sp', true, 50, 'Any 3 suits, like pair 3, 6 or 9', '任意三门，3/6/9的同数对',
    [p(sk(a, 3)), p(sk(a, 6)), p(sk(a, 9)), p(sk(b1, 3)), p(sk(b1, 6)), p(sk(b1, 9)), p(sk(c1, x))]);
}
// SP-4: FF 11 22 11 22 11 22 (any 3 suits, any 2 consec. nos.) — C50
for (let n = 1; n <= 8; n++) {
  add('SP-4', 'sp', true, 50, 'Any 3 suits, any 2 consec. nos.', '任意三门，任意2连号',
    [p(F), p(sk('bam', n)), p(sk('bam', n + 1)), p(sk('crak', n)), p(sk('crak', n + 1)), p(sk('dot', n)), p(sk('dot', n + 1))]);
}
// SP-5: 11 33 55 77 99 111 111 (any like odd prs. in opp. 2 suits) — C50
for (const x of [1, 3, 5, 7, 9]) for (const a of SUITS) {
  const [b1, c1] = SUITS.filter((u) => u !== a);
  add('SP-5', 'sp', true, 50, 'Any like odd prs. in opp. 2 suits', '任意同数奇数对，在另外两门',
    [p(sk(a, 1)), p(sk(a, 3)), p(sk(a, 5)), p(sk(a, 7)), p(sk(a, 9)), p(sk(b1, x)), p(sk(c1, x))]);
}
// SP-6: FF 2025 2025 2025 (any 3 suits) — C75
add('SP-6', 'sp', true, 75, 'Any 3 suits', '任意三门',
  [p(F), Y2025('bam'), Y2025('crak'), Y2025('dot')]);

export const CARD: CardHand[] = hands;

export const SECTIONS: { id: SectionId; en: string; zh: string }[] = [
  { id: 'y2025', en: '2025', zh: '2025' },
  { id: 'e2468', en: '2468', zh: '2468（偶数）' },
  { id: 'aln', en: 'Any Like Numbers', zh: '同数' },
  { id: 'quints', en: 'Quints', zh: '五同' },
  { id: 'cr', en: 'Consecutive Run', zh: '连号' },
  { id: 'o13579', en: '13579', zh: '13579（奇数）' },
  { id: 'wd', en: 'Winds & Dragons', zh: '风与龙' },
  { id: 't369', en: '369', zh: '369' },
  { id: 'sp', en: 'Singles & Pairs', zh: '单张与对子' },
];

/** Unique written lines (without suit/number permutations) for the card page. */
export function cardLines(): CardHand[] {
  const seen = new Set<string>();
  const out: CardHand[] = [];
  for (const h of CARD) {
    if (!seen.has(h.id)) {
      seen.add(h.id);
      out.push(h);
    }
  }
  return out;
}
