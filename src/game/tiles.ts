// American Mahjong (NMJL) tile model — 152 tiles:
// 3 suits x 1-9 x 4 = 108, winds 4x4 = 16, dragons 3x4 = 12, flowers 8, jokers 8.

export type SuitName = 'bam' | 'crak' | 'dot';
export type WindDir = 'N' | 'E' | 'W' | 'S';
export type DragonColor = 'R' | 'G' | 'W'; // W = soap (white dragon, also "0")

export type TileKind =
  | { kind: 'suit'; suit: SuitName; n: number }
  | { kind: 'wind'; dir: WindDir }
  | { kind: 'dragon'; color: DragonColor }
  | { kind: 'flower' }
  | { kind: 'joker' };

/** Canonical tile key, e.g. "bam3", "windN", "dragonW", "flower", "joker" */
export type TileKey = string;

export function suitKey(suit: SuitName, n: number): TileKey {
  return `${suit}${n}`;
}
export function windKey(dir: WindDir): TileKey {
  return `wind${dir}`;
}
export function dragonKey(color: DragonColor): TileKey {
  return `dragon${color}`;
}
export const FLOWER: TileKey = 'flower';
export const JOKER: TileKey = 'joker';

export function parseTile(key: TileKey): TileKind {
  if (key === 'flower') return { kind: 'flower' };
  if (key === 'joker') return { kind: 'joker' };
  if (key.startsWith('wind')) return { kind: 'wind', dir: key.slice(4) as WindDir };
  if (key.startsWith('dragon')) return { kind: 'dragon', color: key.slice(6) as DragonColor };
  const m = key.match(/^(bam|crak|dot)(\d)$/);
  if (m) return { kind: 'suit', suit: m[1] as SuitName, n: parseInt(m[2], 10) };
  throw new Error(`bad tile key: ${key}`);
}

export const SUITS: SuitName[] = ['bam', 'crak', 'dot'];

/** Build the full 152-tile wall, shuffled. */
export function buildWall(rng: () => number = Math.random): TileKey[] {
  const wall: TileKey[] = [];
  for (const s of SUITS) for (let n = 1; n <= 9; n++) for (let i = 0; i < 4; i++) wall.push(suitKey(s, n));
  for (const d of ['N', 'E', 'W', 'S'] as WindDir[]) for (let i = 0; i < 4; i++) wall.push(windKey(d));
  for (const c of ['R', 'G', 'W'] as DragonColor[]) for (let i = 0; i < 4; i++) wall.push(dragonKey(c));
  for (let i = 0; i < 8; i++) wall.push(FLOWER);
  for (let i = 0; i < 8; i++) wall.push(JOKER);
  // Fisher-Yates
  for (let i = wall.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [wall[i], wall[j]] = [wall[j], wall[i]];
  }
  return wall;
}

export function tileSortRank(key: TileKey): number {
  const t = parseTile(key);
  switch (t.kind) {
    case 'suit': {
      const sRank = { bam: 0, crak: 1, dot: 2 }[t.suit];
      return sRank * 100 + t.n;
    }
    case 'dragon': return 300 + { R: 0, G: 1, W: 2 }[t.color];
    case 'wind': return 400 + { E: 0, S: 1, W: 2, N: 3 }[t.dir];
    case 'flower': return 500;
    case 'joker': return 600;
  }
}

export function sortTiles(tiles: TileKey[]): TileKey[] {
  return [...tiles].sort((a, b) => tileSortRank(a) - tileSortRank(b));
}

export function countBy(tiles: TileKey[]): Map<TileKey, number> {
  const m = new Map<TileKey, number>();
  for (const t of tiles) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

/** Dragon that matches a suit (crak=red, bam=green, dot=soap). */
export function dragonForSuit(suit: SuitName): DragonColor {
  return suit === 'crak' ? 'R' : suit === 'bam' ? 'G' : 'W';
}

/** Suit that matches a dragon. */
export function suitForDragon(color: DragonColor): SuitName {
  return color === 'R' ? 'crak' : color === 'G' ? 'bam' : 'dot';
}

export function isSuitTile(key: TileKey, n?: number): boolean {
  const t = parseTile(key);
  return t.kind === 'suit' && (n === undefined || t.n === n);
}

export function tileNumber(key: TileKey): number | null {
  const t = parseTile(key);
  return t.kind === 'suit' ? t.n : null;
}

/** Short display label for a tile (suit symbols handled by the TileFace component). */
export function tileNameEn(key: TileKey): string {
  const t = parseTile(key);
  switch (t.kind) {
    case 'suit': return `${t.n} ${t.suit === 'bam' ? 'Bam' : t.suit === 'crak' ? 'Crak' : 'Dot'}`;
    case 'wind': return { N: 'North', E: 'East', W: 'West', S: 'South' }[t.dir];
    case 'dragon': return { R: 'Red Dragon', G: 'Green Dragon', W: 'Soap' }[t.color];
    case 'flower': return 'Flower';
    case 'joker': return 'Joker';
  }
}

export function tileNameZh(key: TileKey): string {
  const t = parseTile(key);
  switch (t.kind) {
    case 'suit': return `${t.n}${t.suit === 'bam' ? '条' : t.suit === 'crak' ? '万' : '筒'}`;
    case 'wind': return { N: '北风', E: '东风', W: '西风', S: '南风' }[t.dir];
    case 'dragon': return { R: '红中', G: '发财', W: '白板' }[t.color];
    case 'flower': return '花牌';
    case 'joker': return '百搭';
  }
}
