// ============================================================================
// I LOVE MAHJ Card — winning hands data (ilovemahj.com/ilmCard).
// ----------------------------------------------------------------------------
// Transcribed from the official ILM card PDF provided by the operator.
// Color semantics follow standard American-mahjong card conventions:
//   - one color            → all number groups in the SAME suit
//   - two/three colors     → each color is a DIFFERENT suit
//   - D in a color         → the dragon matching that color's suit
//   - 0                    → soap (white dragon)
// Each hand is expanded into concrete instances (suit / number assignments).
// ============================================================================

import {
  SUITS, suitKey, windKey, dragonKey, FLOWER, dragonForSuit,
} from './tiles';
import type { SuitName, TileKey, DragonColor } from './tiles';

export type SectionId =
  | 'e2468' | 'aln' | 'math' | 'quints' | 'cr' | 'o13579' | 'wd' | 't369' | 'sp';

export interface GroupSpec {
  tiles: TileKey[];
  jokerOk: boolean;
}

export interface CardHand {
  id: string;
  section: SectionId;
  groups: GroupSpec[];
  concealed: boolean;
  value: number;
  noteEn: string;
  noteZh: string;
}

const g = (t: TileKey, n: number): GroupSpec => ({ tiles: Array(n).fill(t), jokerOk: n >= 3 });
const p = (t: TileKey): GroupSpec => ({ tiles: [t, t], jokerOk: false });
const s = (...ts: TileKey[]): GroupSpec => ({ tiles: ts, jokerOk: false });

const F = FLOWER;
const DR = dragonKey;
const W = windKey;
const sk = (suit: SuitName, n: number) => suitKey(suit, n);
const df = (suit: SuitName) => dragonKey(dragonForSuit(suit));
const NEWS = () => s(W('N'), W('E'), W('W'), W('S'));

function perms3(): [SuitName, SuitName, SuitName][] {
  const out: [SuitName, SuitName, SuitName][] = [];
  for (const a of SUITS) for (const b of SUITS) for (const c of SUITS)
    if (a !== b && b !== c && a !== c) out.push([a, b, c]);
  return out;
}
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

const DRAGONS: DragonColor[] = ['R', 'G', 'W'];
const DRAGON_PAIRS: [DragonColor, DragonColor][] = [['R', 'G'], ['R', 'W'], ['G', 'W']];

// ============================================================================
// 2468
// ============================================================================
// L1: FFFF 2 44 666 8888 — 1 suit, x25
for (const a of SUITS)
  add('2468-1', 'e2468', false, 25, '1 suit', '一种花色',
    [g(F, 4), s(sk(a, 2)), p(sk(a, 4)), g(sk(a, 6), 3), g(sk(a, 8), 4)]);

// L2: 22 4444 666 666 88 — 3 suits, x25
for (const [a, b, c] of perms3())
  add('2468-2', 'e2468', false, 25, '3 suits', '三种花色',
    [p(sk(a, 2)), g(sk(a, 4), 4), g(sk(b, 6), 3), g(sk(c, 6), 3), p(sk(a, 8))]);

// L3: 222 444 6666 8888 — 2 suits, x25
for (const [a, b] of perms2())
  add('2468-3', 'e2468', false, 25, '2 suits', '两种花色',
    [g(sk(a, 2), 3), g(sk(a, 4), 3), g(sk(b, 6), 4), g(sk(b, 8), 4)]);

// L4: 22 44 444 666 8888 — 3 suits, x25
for (const [a, b, c] of perms3())
  add('2468-4', 'e2468', false, 25, '3 suits', '三种花色',
    [p(sk(a, 2)), p(sk(a, 4)), g(sk(b, 4), 3), g(sk(b, 6), 3), g(sk(c, 8), 4)]);

// L5: FF 4444 8888 DDDD — 1 suit, x25
for (const a of SUITS)
  add('2468-5', 'e2468', false, 25, '1 suit', '一种花色',
    [g(F, 2), g(sk(a, 4), 4), g(sk(a, 8), 4), g(df(a), 4)]);

// L6: FF 4444 8888 DDDD — 3 suits, x25
for (const [a, b, c] of perms3())
  add('2468-6', 'e2468', false, 25, '3 suits', '三种花色',
    [g(F, 2), g(sk(a, 4), 4), g(sk(b, 8), 4), g(df(c), 4)]);

// L7: FF 2222 44 66 8888 — 3 suits, x30
for (const [a, b, c] of perms3())
  add('2468-7', 'e2468', false, 30, '3 suits', '三种花色',
    [g(F, 2), g(sk(a, 2), 4), p(sk(b, 4)), p(sk(b, 6)), g(sk(c, 8), 4)]);

// L8: 222 444 666 888 DD — 1 suit, c30
for (const a of SUITS)
  add('2468-8', 'e2468', true, 30, '1 suit', '一种花色',
    [g(sk(a, 2), 3), g(sk(a, 4), 3), g(sk(a, 6), 3), g(sk(a, 8), 3), p(df(a))]);

// ============================================================================
// ANY LIKE NUMBERS (n = 1..9)
// ============================================================================
for (let n = 1; n <= 9; n++) {
  // L1: FFFF 1111 11 1111 — 3 suits, x25
  for (const [a, b, c] of perms3())
    add('ALN-1', 'aln', false, 25, 'any like number, 3 suits', '任意同数，三种花色',
      [g(F, 4), g(sk(a, n), 4), p(sk(b, n)), g(sk(c, n), 4)]);

  // L2: FF 1111 DD 1111 DD — 2 suits, x25
  for (const [a, b] of perms2())
    add('ALN-2', 'aln', false, 25, 'any like number, 2 suits', '任意同数，两种花色',
      [g(F, 2), g(sk(a, n), 4), p(df(a)), g(sk(b, n), 4), p(df(b))]);

  // L3: FFF 1111 DDD 1111 — 3 suits, x25
  for (const [a, b, c] of perms3())
    add('ALN-3', 'aln', false, 25, 'any like number, 3 suits', '任意同数，三种花色',
      [g(F, 3), g(sk(a, n), 4), g(df(c), 3), g(sk(b, n), 4)]);

  // L4: 11 DD 111 DDD 1111 — 3 suits, c30
  for (const [a, b, c] of perms3())
    add('ALN-4', 'aln', true, 30, 'any like number, 3 suits', '任意同数，三种花色',
      [p(sk(a, n)), p(df(a)), g(sk(b, n), 3), g(df(b), 3), g(sk(c, n), 4)]);
}

// ============================================================================
// MATH
// ============================================================================
// L1: FFFF 4444 x 8888 = 32 — 3 suits, x25
for (const [a, b, c] of perms3())
  add('MATH-1', 'math', false, 25, '4 x 8 = 32', '4 x 8 = 32',
    [g(F, 4), g(sk(a, 4), 4), g(sk(b, 8), 4), s(sk(c, 3), sk(c, 2))]);

// L2: DDDD 3333 x 7777 = 21 — 3 suits, x25
for (const [a, b, c] of perms3())
  add('MATH-2', 'math', false, 25, '3 x 7 = 21', '3 x 7 = 21',
    [g(df(c), 4), g(sk(a, 3), 4), g(sk(b, 7), 4), s(sk(c, 2), sk(c, 1))]);

// L3: FF 3333 + 4444 = 7777 — 1 suit, x25
for (const a of SUITS)
  add('MATH-3', 'math', false, 25, '3 + 4 = 7, 1 suit', '3 + 4 = 7，一种花色',
    [g(F, 2), g(sk(a, 3), 4), g(sk(a, 4), 4), g(sk(a, 7), 4)]);

// L4: FF 3333 + 4444 = 7777 — 3 suits, x25
for (const [a, b, c] of perms3())
  add('MATH-4', 'math', false, 25, '3 + 4 = 7, 3 suits', '3 + 4 = 7，三种花色',
    [g(F, 2), g(sk(a, 3), 4), g(sk(b, 4), 4), g(sk(c, 7), 4)]);

// L5: FFFF 5555 + 6666 = 11 — 1 suit, x25
for (const a of SUITS)
  add('MATH-5', 'math', false, 25, '5 + 6 = 11, 1 suit', '5 + 6 = 11，一种花色',
    [g(F, 4), g(sk(a, 5), 4), g(sk(a, 6), 4), p(sk(a, 1))]);

// L6: FFFF 5555 + 6666 = 11 — 3 suits, x25
for (const [a, b, c] of perms3())
  add('MATH-6', 'math', false, 25, '5 + 6 = 11, 3 suits', '5 + 6 = 11，三种花色',
    [g(F, 4), g(sk(a, 5), 4), g(sk(b, 6), 4), p(sk(c, 1))]);

// L7: DD 8888 - 3333 = 5555 — 1 suit, x25
for (const a of SUITS)
  add('MATH-7', 'math', false, 25, '8 - 3 = 5, 1 suit', '8 - 3 = 5，一种花色',
    [p(df(a)), g(sk(a, 8), 4), g(sk(a, 3), 4), g(sk(a, 5), 4)]);

// L8: DD 8888 - 3333 = 5555 — 3 suits, x25
for (const [a, b, c] of perms3())
  add('MATH-8', 'math', false, 25, '8 - 3 = 5, 3 suits', '8 - 3 = 5，三种花色',
    [p(df(c)), g(sk(a, 8), 4), g(sk(b, 3), 4), g(sk(c, 5), 4)]);

// L9: 333 + 444 - 555 - 222 = 00 — 1 suit, c30
for (const a of SUITS)
  add('MATH-9', 'math', true, 30, '3+4-5-2 = 0, 1 suit', '3+4-5-2 = 0，一种花色',
    [g(sk(a, 3), 3), g(sk(a, 4), 3), g(sk(a, 5), 3), g(sk(a, 2), 3), p(DR('W'))]);

// ============================================================================
// QUINTS
// ============================================================================
// L1: NNNNN (n+1)(n+1)(n+1)(n+1) (n+2)(n+2)(n+2) (n+3)(n+3) — 1 suit, any 4
// consecutive #s, x40
for (let n = 1; n <= 6; n++) for (const a of SUITS)
  add('QUINT-1', 'quints', false, 40, 'any 4 consecutive #s, 1 suit', '任意 4 连号，一种花色',
    [g(sk(a, n), 5), g(sk(a, n + 1), 4), g(sk(a, n + 2), 3), p(sk(a, n + 3))]);

// L2: FFFFF DDDDD 1111 — any #, x45
for (const d of DRAGONS) for (const a of SUITS) for (let n = 1; n <= 9; n++)
  add('QUINT-2', 'quints', false, 45, 'any #, any dragon', '任意数字，任意龙',
    [g(F, 5), g(dragonKey(d), 5), g(sk(a, n), 4)]);

// L3: 11111 3333 555 DD — these #s only, 1 suit, x40
for (const a of SUITS)
  add('QUINT-3', 'quints', false, 40, '1-3-5 only, 1 suit', '仅 1-3-5，一种花色',
    [g(sk(a, 1), 5), g(sk(a, 3), 4), g(sk(a, 5), 3), p(df(a))]);

// L4: 55555 7777 999 DD — these #s only, 1 suit, x40
for (const a of SUITS)
  add('QUINT-4', 'quints', false, 40, '5-7-9 only, 1 suit', '仅 5-7-9，一种花色',
    [g(sk(a, 5), 5), g(sk(a, 7), 4), g(sk(a, 9), 3), p(df(a))]);

// L5: FFFFF 33 666 9999 — these #s only, 1 suit, x35
for (const a of SUITS)
  add('QUINT-5', 'quints', false, 35, '3-6-9 only, 1 suit', '仅 3-6-9，一种花色',
    [g(F, 5), p(sk(a, 3)), g(sk(a, 6), 3), g(sk(a, 9), 4)]);

// L6: FFFFF 33 666 9999 — these #s only, 3 suits, x35
for (const [a, b, c] of perms3())
  add('QUINT-6', 'quints', false, 35, '3-6-9 only, 3 suits', '仅 3-6-9，三种花色',
    [g(F, 5), p(sk(a, 3)), g(sk(b, 6), 3), g(sk(c, 9), 4)]);

// ============================================================================
// CONSECUTIVE RUNS
// ============================================================================
// L1: 11 22 333 444 5555 — these #s only, 1 suit, x25
for (const a of SUITS)
  add('CR-1', 'cr', false, 25, '1-5 only, 1 suit', '仅 1-5，一种花色',
    [p(sk(a, 1)), p(sk(a, 2)), g(sk(a, 3), 3), g(sk(a, 4), 3), g(sk(a, 5), 4)]);

// L2: 55 66 777 888 9999 — these #s only, 1 suit, x25
for (const a of SUITS)
  add('CR-2', 'cr', false, 25, '5-9 only, 1 suit', '仅 5-9，一种花色',
    [p(sk(a, 5)), p(sk(a, 6)), g(sk(a, 7), 3), g(sk(a, 8), 3), g(sk(a, 9), 4)]);

// L3: 11 2222 3333 4444 — any 4 consecutive #s, 1 suit, x25
for (let n = 1; n <= 6; n++) for (const a of SUITS)
  add('CR-3', 'cr', false, 25, 'any 4 consecutive #s, 1 suit', '任意 4 连号，一种花色',
    [p(sk(a, n)), g(sk(a, n + 1), 4), g(sk(a, n + 2), 4), g(sk(a, n + 3), 4)]);

// L4: 1111 222 3333 DDD — any 3 consecutive #s, 2 suits, x25
for (let n = 1; n <= 7; n++) for (const [a, b] of perms2())
  add('CR-4', 'cr', false, 25, 'any 3 consecutive #s, 2 suits', '任意 3 连号，两种花色',
    [g(sk(a, n), 4), g(sk(a, n + 1), 3), g(sk(b, n + 2), 4), g(df(b), 3)]);

// L5: FFF 1111 2222 DDD — any 2 consecutive #s, 3 suits, x25
for (let n = 1; n <= 8; n++) for (const [a, b, c] of perms3())
  add('CR-5', 'cr', false, 25, 'any 2 consecutive #s, 3 suits', '任意 2 连号，三种花色',
    [g(F, 3), g(sk(a, n), 4), g(sk(b, n + 1), 4), g(df(c), 3)]);

// L6: 1111 22 22 22 3333 — any 3 consecutive #s, 3 suits, x30
for (let n = 1; n <= 7; n++) for (const [a, b, c] of perms3())
  add('CR-6', 'cr', false, 30, 'any 3 consecutive #s, 3 suits', '任意 3 连号，三种花色',
    [g(sk(a, n), 4), p(sk(b, n + 1)), p(sk(a, n + 1)), p(sk(c, n + 1)), g(sk(a, n + 2), 4)]);

// L7: FF 11 222 33 444 DD — any 4 consecutive #s, 3 suits, x30
for (let n = 1; n <= 6; n++) for (const [a, b, c] of perms3())
  add('CR-7', 'cr', false, 30, 'any 4 consecutive #s, 3 suits', '任意 4 连号，三种花色',
    [g(F, 2), p(sk(a, n)), g(sk(a, n + 1), 3), p(sk(b, n + 2)), g(sk(b, n + 3), 3), p(df(c))]);

// L8: 111 22 333 DDD DDD — any 3 consecutive #s, 3 suits, c30
for (let n = 1; n <= 7; n++) for (const [a, b, c] of perms3())
  add('CR-8', 'cr', true, 30, 'any 3 consecutive #s, 3 suits', '任意 3 连号，三种花色',
    [g(sk(a, n), 3), p(sk(a, n + 1)), g(sk(a, n + 2), 3), g(df(b), 3), g(df(c), 3)]);

// ============================================================================
// 13579
// ============================================================================
// L1: 11 333 5555 777 99 — 1 suit, x25
for (const a of SUITS)
  add('13579-1', 'o13579', false, 25, '1 suit', '一种花色',
    [p(sk(a, 1)), g(sk(a, 3), 3), g(sk(a, 5), 4), g(sk(a, 7), 3), p(sk(a, 9))]);

// L2: 11 333 5555 777 99 — 3 suits, x25
for (const [a, b, c] of perms3())
  add('13579-2', 'o13579', false, 25, '3 suits', '三种花色',
    [p(sk(a, 1)), g(sk(a, 3), 3), g(sk(b, 5), 4), g(sk(c, 7), 3), p(sk(c, 9))]);

// L3: 1111 3333 333 555 — 2 suits, x25
for (const [a, b] of perms2())
  add('13579-3', 'o13579', false, 25, '2 suits', '两种花色',
    [g(sk(a, 1), 4), g(sk(a, 3), 4), g(sk(b, 3), 3), g(sk(b, 5), 3)]);

// L4: 5555 7777 777 999 — 2 suits, x25
for (const [a, b] of perms2())
  add('13579-4', 'o13579', false, 25, '2 suits', '两种花色',
    [g(sk(a, 5), 4), g(sk(a, 7), 4), g(sk(b, 7), 3), g(sk(b, 9), 3)]);

// L5: 1111 333 5555 DDD — 2 suits, x25
for (const [a, b] of perms2())
  add('13579-5', 'o13579', false, 25, '2 suits', '两种花色',
    [g(sk(a, 1), 4), g(sk(a, 3), 3), g(sk(b, 5), 4), g(df(b), 3)]);

// L6: 5555 777 9999 DDD — 2 suits, x25
for (const [a, b] of perms2())
  add('13579-6', 'o13579', false, 25, '2 suits', '两种花色',
    [g(sk(a, 5), 4), g(sk(a, 7), 3), g(sk(b, 9), 4), g(df(b), 3)]);

// L7: 11 333 DDDD 333 55 — 3 suits, x25
for (const [a, b, c] of perms3())
  add('13579-7', 'o13579', false, 25, '3 suits', '三种花色',
    [p(sk(a, 1)), g(sk(a, 3), 3), g(df(b), 4), g(sk(c, 3), 3), p(sk(c, 5))]);

// L8: 55 777 DDDD 777 99 — 3 suits, x25
for (const [a, b, c] of perms3())
  add('13579-8', 'o13579', false, 25, '3 suits', '三种花色',
    [p(sk(a, 5)), g(sk(a, 7), 3), g(df(b), 4), g(sk(c, 7), 3), p(sk(c, 9))]);

// L9: 11 33 55 7777 9999 — 3 suits, x30
for (const [a, b, c] of perms3())
  add('13579-9', 'o13579', false, 30, '3 suits', '三种花色',
    [p(sk(a, 1)), p(sk(a, 3)), p(sk(a, 5)), g(sk(b, 7), 4), g(sk(c, 9), 4)]);

// L10: 111 3333 555 NEWS — 3 suits, c30
for (const [a, b, c] of perms3())
  add('13579-10', 'o13579', true, 30, '3 suits', '三种花色',
    [g(sk(a, 1), 3), g(sk(b, 3), 4), g(sk(c, 5), 3), NEWS()]);

// L11: 555 7777 999 NEWS — 3 suits, c30
for (const [a, b, c] of perms3())
  add('13579-11', 'o13579', true, 30, '3 suits', '三种花色',
    [g(sk(a, 5), 3), g(sk(b, 7), 4), g(sk(c, 9), 3), NEWS()]);

// ============================================================================
// WINDS-DRAGONS
// ============================================================================
// L1: NNNN EEE WWW SSSS — x25
add('WD-1', 'wd', false, 25, '', '',
  [g(W('N'), 4), g(W('E'), 3), g(W('W'), 3), g(W('S'), 4)]);

// L2: FF DDDD NEWS DDDD — any 2 dragons, x25
for (const [d1, d2] of DRAGON_PAIRS)
  add('WD-2', 'wd', false, 25, 'any 2 dragons', '任意两种龙',
    [g(F, 2), g(dragonKey(d1), 4), NEWS(), g(dragonKey(d2), 4)]);

// L3: FFFF NNNN RR SSSS — red dragons only, x25
add('WD-3', 'wd', false, 25, 'red dragons only', '仅红龙',
  [g(F, 4), g(W('N'), 4), p(DR('R')), g(W('S'), 4)]);

// L4: FFFF EEEE GG WWWW — green dragons only, x25
add('WD-4', 'wd', false, 25, 'green dragons only', '仅绿龙',
  [g(F, 4), g(W('E'), 4), p(DR('G')), g(W('W'), 4)]);

// L5: FFFF N EE WWW SSSS — x25
add('WD-5', 'wd', false, 25, '', '',
  [g(F, 4), s(W('N')), p(W('E')), g(W('W'), 3), g(W('S'), 4)]);

// L6: FF NN 1111 2222 SS — any 2 consecutive #s, 2 suits, x30
for (let n = 1; n <= 8; n++) for (const [a, b] of perms2())
  add('WD-6', 'wd', false, 30, 'any 2 consecutive #s, 2 suits', '任意 2 连号，两种花色',
    [g(F, 2), p(W('N')), g(sk(a, n), 4), g(sk(b, n + 1), 4), p(W('S'))]);

// L7: FF EE 1111 2222 WW — any 2 consecutive #s, 2 suits, x30
for (let n = 1; n <= 8; n++) for (const [a, b] of perms2())
  add('WD-7', 'wd', false, 30, 'any 2 consecutive #s, 2 suits', '任意 2 连号，两种花色',
    [g(F, 2), p(W('E')), g(sk(a, n), 4), g(sk(b, n + 1), 4), p(W('W'))]);

// L8: NNNN DD DD DD SSSS — 3 dragons, x30
add('WD-8', 'wd', false, 30, 'all 3 dragons', '三种龙各一对',
  [g(W('N'), 4), p(DR('R')), p(DR('G')), p(DR('W')), g(W('S'), 4)]);

// L9: EEEE DD DD DD WWWW — 3 dragons, x30
add('WD-9', 'wd', false, 30, 'all 3 dragons', '三种龙各一对',
  [g(W('E'), 4), p(DR('R')), p(DR('G')), p(DR('W')), g(W('W'), 4)]);

// L10: NN 111 1111 111 SS — odd like #s, 3 suits, c30
for (const n of [1, 3, 5, 7, 9]) for (const [a, b, c] of perms3())
  add('WD-10', 'wd', true, 30, 'odd like #s, 3 suits', '奇数同数，三种花色',
    [p(W('N')), g(sk(a, n), 3), g(sk(b, n), 4), g(sk(c, n), 3), p(W('S'))]);

// L11: EE 222 2222 222 WW — even like #s, 3 suits, c30
for (const n of [2, 4, 6, 8]) for (const [a, b, c] of perms3())
  add('WD-11', 'wd', true, 30, 'even like #s, 3 suits', '偶数同数，三种花色',
    [p(W('E')), g(sk(a, n), 3), g(sk(b, n), 4), g(sk(c, n), 3), p(W('W'))]);

// ============================================================================
// 369
// ============================================================================
// L1: 33 666 333 66 9999 — 3 suits, x25
for (const [a, b, c] of perms3())
  add('369-1', 't369', false, 25, '3 suits', '三种花色',
    [p(sk(a, 3)), g(sk(a, 6), 3), g(sk(b, 3), 3), p(sk(b, 6)), g(sk(c, 9), 4)]);

// L2: FFFF 33 666 99 DDD — 1 suit, x25
for (const a of SUITS)
  add('369-2', 't369', false, 25, '1 suit', '一种花色',
    [g(F, 4), p(sk(a, 3)), g(sk(a, 6), 3), p(sk(a, 9)), g(df(a), 3)]);

// L3: 3333 66 9999 DDDD — 1 suit, x25
for (const a of SUITS)
  add('369-3', 't369', false, 25, '1 suit', '一种花色',
    [g(sk(a, 3), 4), p(sk(a, 6)), g(sk(a, 9), 4), g(df(a), 4)]);

// L4: FF 3333 6666 9999 — 1 suit, x25
for (const a of SUITS)
  add('369-4', 't369', false, 25, '1 suit', '一种花色',
    [g(F, 2), g(sk(a, 3), 4), g(sk(a, 6), 4), g(sk(a, 9), 4)]);

// L5: FF 3333 6666 9999 — 3 suits, x25
for (const [a, b, c] of perms3())
  add('369-5', 't369', false, 25, '3 suits', '三种花色',
    [g(F, 2), g(sk(a, 3), 4), g(sk(b, 6), 4), g(sk(c, 9), 4)]);

// L6: FF 33 66 99 DDD DDD — 1 suit + 2 dragons, x30
for (const a of SUITS) for (const [d1, d2] of DRAGON_PAIRS)
  add('369-6', 't369', false, 30, '1 suit, any 2 dragons', '一种花色，任意两种龙',
    [g(F, 2), p(sk(a, 3)), p(sk(a, 6)), p(sk(a, 9)), g(dragonKey(d1), 3), g(dragonKey(d2), 3)]);

// L7: FF 3 66 999 3 66 999 — 2 suits, c35
for (const [a, b] of perms2())
  add('369-7', 't369', true, 35, '2 suits', '两种花色',
    [g(F, 2), s(sk(a, 3)), p(sk(a, 6)), g(sk(a, 9), 3), s(sk(b, 3)), p(sk(b, 6)), g(sk(b, 9), 3)]);

// ============================================================================
// SINGLES AND PAIRS
// ============================================================================
// L1: NN EE WW SS 11 11 11 — like #s, 3 suits, c50
for (let n = 1; n <= 9; n++) for (const [a, b, c] of perms3())
  add('SP-1', 'sp', true, 50, 'like #s, 3 suits', '同数，三种花色',
    [p(W('N')), p(W('E')), p(W('W')), p(W('S')), p(sk(a, n)), p(sk(b, n)), p(sk(c, n))]);

// L2: FF 11 33 55 77 99 DD — 1 suit, c50
for (const a of SUITS)
  add('SP-2', 'sp', true, 50, 'odds, 1 suit', '奇数，一种花色',
    [g(F, 2), p(sk(a, 1)), p(sk(a, 3)), p(sk(a, 5)), p(sk(a, 7)), p(sk(a, 9)), p(df(a))]);

// L3: 11 22 33 44 55 66 DD — any 6 consecutive #s, 1 suit, c50
for (let n = 1; n <= 4; n++) for (const a of SUITS)
  add('SP-3', 'sp', true, 50, 'any 6 consecutive #s, 1 suit', '任意 6 连号，一种花色',
    [p(sk(a, n)), p(sk(a, n + 1)), p(sk(a, n + 2)), p(sk(a, n + 3)), p(sk(a, n + 4)), p(sk(a, n + 5)), p(df(a))]);

// L4: FF 2 4 66 88 22 44 6 8 — 2 suits, c50
for (const [a, b] of perms2())
  add('SP-4', 'sp', true, 50, 'evens, 2 suits', '偶数，两种花色',
    [g(F, 2), s(sk(a, 2), sk(a, 4)), p(sk(a, 6)), p(sk(a, 8)), p(sk(b, 2)), p(sk(b, 4)), s(sk(b, 6), sk(b, 8))]);

// L5: 3 66 3 66 99 33 66 99 — 3 suits, c50
for (const [a, b, c] of perms3())
  add('SP-5', 'sp', true, 50, '3-6-9, 3 suits', '3-6-9，三种花色',
    [s(sk(a, 3)), p(sk(a, 6)), s(sk(b, 3)), p(sk(b, 6)), p(sk(b, 9)), p(sk(c, 3)), p(sk(c, 6)), p(sk(c, 9))]);

// L6: FF 11 22 33 DD DD DD — any 3 consecutive #s, 1 suit, c60
for (let n = 1; n <= 7; n++) for (const a of SUITS)
  add('SP-6', 'sp', true, 60, 'any 3 consecutive #s, 1 suit', '任意 3 连号，一种花色',
    [g(F, 2), p(sk(a, n)), p(sk(a, n + 1)), p(sk(a, n + 2)), p(DR('R')), p(DR('G')), p(DR('W'))]);

// L7: FF 0123 0123 0123 — these #s only, 3 suits, c75
add('SP-7', 'sp', true, 75, '0-3 only (0 = soap)', '仅 0-3（0 为白板）',
  [g(F, 2),
   s(DR('W'), sk('bam', 1), sk('bam', 2), sk('bam', 3)),
   s(DR('W'), sk('crak', 1), sk('crak', 2), sk('crak', 3)),
   s(DR('W'), sk('dot', 1), sk('dot', 2), sk('dot', 3))]);

// ============================================================================
export const CARD: CardHand[] = hands;

export const SECTIONS: { id: SectionId; en: string; zh: string }[] = [
  { id: 'e2468', en: '2468', zh: '2468（偶数）' },
  { id: 'aln', en: 'Any Like Numbers', zh: '同数' },
  { id: 'math', en: 'Math', zh: '数学' },
  { id: 'quints', en: 'Quints', zh: '五同' },
  { id: 'cr', en: 'Consecutive Runs', zh: '连号' },
  { id: 'o13579', en: '13579', zh: '13579（奇数）' },
  { id: 'wd', en: 'Winds-Dragons', zh: '风与龙' },
  { id: 't369', en: '369', zh: '369' },
  { id: 'sp', en: 'Singles and Pairs', zh: '单张与对子' },
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
