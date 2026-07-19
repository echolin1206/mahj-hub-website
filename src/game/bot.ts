// Heuristic bots for American Mahjong.
import { evaluate, callableMelds, matchWin } from './match';
import type { Meld } from './match';
import { JOKER, countBy, parseTile } from './tiles';
import type { TileKey } from './tiles';

/** Tiles the bot wants to keep: commit to the best target; widen only while far away. */
function keepSet(hand: TileKey[], melds: Meld[], _topN = 3): Set<TileKey> {
  const evals = evaluate(hand, melds, 4);
  const keep = new Set<TileKey>();
  if (evals.length === 0) return keep;
  const best = evals[0];
  const focus = best.missing <= 4 ? [best] : evals.slice(0, 2); // commit early
  for (const ev of focus) for (const grp of ev.hand.groups) for (const t of grp.tiles) keep.add(t);
  // never ditch jokers/flowers while far away
  if (best.missing > 4) {
    keep.add('flower');
  }
  return keep;
}

function passPriority(t: TileKey): number {
  // lower = more likely to pass away
  const p = parseTile(t);
  if (p.kind === 'wind') return 0;
  if (p.kind === 'flower') return 4; // flowers are valuable on the 2025 card
  if (p.kind === 'dragon') return 3;
  if (p.kind === 'suit') {
    if (p.n === 1 || p.n === 9) return 1;
    if (p.n === 2 || p.n === 8) return 2;
    return 3;
  }
  return 9; // joker — never passed
}

/** Charleston: choose 3 tiles to pass (jokers may not be passed — NMJL rule). */
export function charlestonPass(hand: TileKey[]): TileKey[] {
  const keep = keepSet(hand, [], 3);
  const counts = countBy(hand);
  const scored = hand
    .filter((t) => t !== JOKER)
    .map((t) => ({
      t,
      score: (keep.has(t) ? 100 : 0) + passPriority(t) * 10 + (counts.get(t) ?? 1) * 3,
    }))
    .sort((a, b) => a.score - b.score);
  return scored.slice(0, 3).map((x) => x.t);
}

/** Choose a discard after picking. */
export function chooseDiscard(hand: TileKey[], melds: Meld[]): TileKey {
  const evals = evaluate(hand, melds, 4);
  const keep = keepSet(hand, melds, 4);
  const counts = countBy(hand);
  const candidates = hand.filter((t) => t !== JOKER);
  const pool = candidates.filter((t) => !keep.has(t));
  const finalPool = pool.length > 0 ? pool : candidates;
  if (finalPool.length === 0) return hand[hand.length - 1]; // only jokers — safe discard
  const scored = finalPool.map((t) => ({
    t,
    score: passPriority(t) * 10 + (counts.get(t) ?? 1) * 4 + (evals[0]?.needed.includes(t) ? 50 : 0),
  }));
  scored.sort((a, b) => a.score - b.score);
  return scored[0].t;
}

export type CallDecision = 'pass' | 'pung' | 'kong' | 'quint' | 'mahjong';

/** Decide what to do about someone's discard. */
export function decideCall(hand: TileKey[], melds: Meld[], tile: TileKey): CallDecision {
  if (matchWin([...hand, tile], melds)) return 'mahjong';
  const possible = callableMelds(hand, tile);
  if (possible.length === 0) return 'pass';
  // Would exposing help our best (non-concealed) target?
  const before = evaluate(hand, melds, 1)[0];
  if (!before || before.hand.concealed) return 'pass';
  // direct hit: the tile completes a same-tile group of the target hand —
  // only expose when we're already close (early exposures lock the hand)
  if (before.missing <= 4) {
    for (const grp of before.hand.groups) {
      if (!grp.jokerOk) continue;
      if (grp.tiles[0] !== tile || !grp.tiles.every((x) => x === tile)) continue;
      const size = grp.tiles.length;
      if (possible.includes(size) && !melds.some((m) => m.tiles.length === size && m.tiles.includes(tile))) {
        return size === 5 ? 'quint' : size === 4 ? 'kong' : 'pung';
      }
    }
  }
  const size = Math.max(...possible);
  // simulate: remove size-1 tiles (real copies + jokers) from hand, add meld
  const simHand = [...hand];
  const removed: TileKey[] = [];
  for (let i = simHand.length - 1; i >= 0 && removed.length < size - 1; i--) {
    if (simHand[i] === tile || simHand[i] === JOKER) removed.push(simHand.splice(i, 1)[0]);
  }
  const after = evaluate(simHand, [...melds, { tiles: [tile, ...removed] }], 1)[0];
  if (after && !after.hand.concealed && after.missing <= before.missing) {
    return size === 5 ? 'quint' : size === 4 ? 'kong' : 'pung';
  }
  return 'pass';
}

/** Second Charleston vote: continue if the hand is still far away. */
export function voteSecondCharleston(hand: TileKey[]): boolean {
  const best = evaluate(hand, [], 1)[0];
  return !!best && best.missing >= 4;
}

/** Courtesy pass: give away k least useful tiles. */
export function courtesyPass(hand: TileKey[], k: number): TileKey[] {
  if (k <= 0) return [];
  return charlestonPass(hand).slice(0, k);
}

export function courtesyCount(): number {
  const r = Math.random();
  return r < 0.45 ? 0 : r < 0.75 ? 1 : r < 0.92 ? 2 : 3;
}

/** Joker swaps available to a hand from everyone's exposures. */
export function findJokerSwaps(
  hand: TileKey[], meldOwners: { seat: number; melds: Meld[] }[],
): { seat: number; meldIdx: number; tile: TileKey }[] {
  const swaps: { seat: number; meldIdx: number; tile: TileKey }[] = [];
  const counts = countBy(hand);
  for (const { seat, melds } of meldOwners) {
    melds.forEach((meld, meldIdx) => {
      const real = meld.tiles.find((t) => t !== JOKER);
      if (real && meld.tiles.includes(JOKER) && (counts.get(real) ?? 0) > 0) {
        swaps.push({ seat, meldIdx, tile: real });
      }
    });
  }
  return swaps;
}
