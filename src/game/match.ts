// Hand matching against the NMJL 2025 card.
//
// Key insight: for one card-hand instance the demanded tiles are fixed, so an
// exact win check is linear: exact (no-joker) groups must be fully covered by
// real tiles; remaining real tiles go to joker-allowed groups; the leftover
// deficit must be covered by jokers in hand.

import { CARD } from './cardIlm';
import type { CardHand } from './cardIlm';
import { JOKER, countBy } from './tiles';
import type { TileKey } from './tiles';

export interface Meld {
  tiles: TileKey[]; // exposed group on the rack (may contain jokers)
}

function demandOf(hand: CardHand): {
  exact: Map<TileKey, number>;
  wild: Map<TileKey, number>;
  wildGroups: { tile: TileKey; size: number }[];
} {
  const exact = new Map<TileKey, number>();
  const wild = new Map<TileKey, number>();
  const wildGroups: { tile: TileKey; size: number }[] = [];
  for (const grp of hand.groups) {
    const same = grp.tiles.every((t) => t === grp.tiles[0]);
    if (grp.jokerOk && same) {
      wild.set(grp.tiles[0], (wild.get(grp.tiles[0]) ?? 0) + grp.tiles.length);
      wildGroups.push({ tile: grp.tiles[0], size: grp.tiles.length });
    } else {
      for (const t of grp.tiles) exact.set(t, (exact.get(t) ?? 0) + 1);
    }
  }
  return { exact, wild, wildGroups };
}

/** Can the exposed melds be assigned to joker-allowed groups of this hand? */
function meldsFit(hand: CardHand, melds: Meld[]): boolean {
  if (melds.length === 0) return true;
  if (hand.concealed) return false;
  const { wildGroups } = demandOf(hand);
  const used = new Array(wildGroups.length).fill(false);
  for (const meld of melds) {
    const real = meld.tiles.filter((t) => t !== JOKER);
    const tile = real[0];
    if (!real.every((t) => t === tile)) return false; // corrupted meld
    let ok = false;
    for (let i = 0; i < wildGroups.length; i++) {
      if (!used[i] && wildGroups[i].tile === tile && wildGroups[i].size === meld.tiles.length) {
        used[i] = true;
        ok = true;
        break;
      }
    }
    if (!ok) return false;
  }
  return true;
}

function tilesFit(hand: CardHand, counts: Map<TileKey, number>, jokers: number): boolean {
  const { exact, wild } = demandOf(hand);
  const remaining = new Map(counts);
  // exact groups: must be fully real
  for (const [t, q] of exact) {
    const have = remaining.get(t) ?? 0;
    if (have < q) return false;
    remaining.set(t, have - q);
  }
  // wild groups: real first, jokers cover deficit
  let deficit = 0;
  for (const [t, q] of wild) {
    const have = remaining.get(t) ?? 0;
    if (have < q) deficit += q - have;
  }
  return deficit <= jokers;
}

/** Exact mah-jongg check. Returns the best (highest value) matching hand. */
export function matchWin(concealedTiles: TileKey[], melds: Meld[]): CardHand | null {
  const real = concealedTiles.filter((t) => t !== JOKER);
  const jokers = concealedTiles.length - real.length;
  const counts = countBy(real);
  let best: CardHand | null = null;
  for (const hand of CARD) {
    if (hand.concealed && melds.length > 0) continue;
    if (best && hand.value <= best.value) continue;
    if (!meldsFit(hand, melds)) continue;
    if (tilesFit(hand, counts, jokers)) best = hand;
  }
  return best;
}

// ---------------------------------------------------------------------------
// Evaluation (bots & hints): how close is a hand to each card line?
// ---------------------------------------------------------------------------

export interface HandEval {
  hand: CardHand;
  missing: number;   // tiles still needed (after using jokers optimally)
  needed: TileKey[]; // example tiles that would help
}

export function evaluate(concealedTiles: TileKey[], melds: Meld[], limit = 8): HandEval[] {
  const real = concealedTiles.filter((t) => t !== JOKER);
  const jokers = concealedTiles.length - real.length;
  const counts = countBy(real);
  const out: HandEval[] = [];
  for (const hand of CARD) {
    if (hand.concealed && melds.length > 0) continue;
    if (!meldsFit(hand, melds)) continue;
    const { exact, wild } = demandOf(hand);
    const remaining = new Map(counts);
    let missing = 0;
    const needed: TileKey[] = [];
    for (const [t, q] of exact) {
      const have = remaining.get(t) ?? 0;
      const use = Math.min(have, q);
      remaining.set(t, have - use);
      const lack = q - use;
      missing += lack;
      for (let i = 0; i < lack; i++) needed.push(t);
    }
    let wildLack = 0;
    for (const [t, q] of wild) {
      const have = remaining.get(t) ?? 0;
      const use = Math.min(have, q);
      remaining.set(t, have - use);
      wildLack += q - use;
      for (let i = use; i < q && needed.length < 6; i++) needed.push(t);
    }
    missing += Math.max(0, wildLack - jokers);
    // penalty: hands needing many pairs the player doesn't have are riskier
    out.push({ hand, missing, needed });
  }
  out.sort((a, b) => a.missing - b.missing || b.hand.value - a.hand.value);
  return out.slice(0, limit);
}

/** Tiles useful to ANY reasonable target — used for Charleston / discard hints. */
export function usefulTiles(concealedTiles: TileKey[], melds: Meld[]): Set<TileKey> {
  const evals = evaluate(concealedTiles, melds, 6);
  const keep = new Set<TileKey>();
  if (evals.length === 0) return keep;
  for (const ev of evals) {
    for (const grp of ev.hand.groups) for (const t of grp.tiles) keep.add(t);
  }
  return keep;
}

/** What exposures can be formed by calling `tile` from hand? (NMJL: pung/kong/quint only) */
export function callableMelds(handTiles: TileKey[], tile: TileKey): number[] {
  if (tile === JOKER) return []; // a discarded joker can never be called
  const real = handTiles.filter((t) => t !== JOKER);
  const jokers = handTiles.length - real.length;
  const copies = real.filter((t) => t === tile).length;
  const res: number[] = [];
  if (copies + jokers >= 2) res.push(3); // pung
  if (copies + jokers >= 3) res.push(4); // kong
  if (copies + jokers >= 4) res.push(5); // quint
  return res;
}

/** Build the meld tiles for a call: called tile + real copies + jokers to size. */
export function buildMeld(handTiles: TileKey[], tile: TileKey, size: number): { meld: TileKey[]; fromHand: TileKey[] } {
  const need = size - 1;
  const fromHand: TileKey[] = [];
  for (const t of handTiles) {
    if (fromHand.length >= need) break;
    if (t === tile) fromHand.push(t);
  }
  for (const t of handTiles) {
    if (fromHand.length >= need) break;
    if (t === JOKER) fromHand.push(t);
  }
  return { meld: [tile, ...fromHand], fromHand };
}
