// American Mahjong game engine (NMJL rules): deal, Charleston, picks/discards,
// calls with priority, joker swaps, mah-jongg & scoring.

import { JOKER, buildWall, sortTiles } from './tiles';
import type { TileKey } from './tiles';
import { matchWin, callableMelds, buildMeld } from './match';
import type { Meld } from './match';
import type { CardHand } from './cardIlm';

export type Phase =
  | 'charleston-pass'
  | 'charleston-vote'
  | 'courtesy'
  | 'turn'
  | 'call-window'
  | 'over';

export interface LogEvent {
  id: number;
  k: string;            // i18n key
  seat?: number;
  tile?: TileKey;
  extra?: string;
}

export interface PlayerState {
  seat: number;
  isBot: boolean;
  hand: TileKey[];
  melds: Meld[];
  discards: TileKey[];
  score: number; // cumulative session points
}

export interface WinInfo {
  seat: number;
  hand: CardHand;
  tile: TileKey;
  selfPick: boolean;
  jokerless: boolean;
  deltas: number[]; // score change per seat
}

export interface GameState {
  phase: Phase;
  wall: TileKey[];
  players: PlayerState[];
  dealer: number;
  current: number;
  stage: 'pick' | 'act';
  lastDiscard: { tile: TileKey; by: number } | null;
  callResponses: Map<number, string>; // seat -> action during call-window
  charleston: {
    round: 1 | 2;
    passIdx: number;
    dirs: ('R' | 'A' | 'L')[];
    picks: (TileKey[] | null)[];
    blinds: boolean[];
    votes: (boolean | null)[];
  };
  winner: WinInfo | null;
  wallGame: boolean;
  log: LogEvent[];
}

export type EngineListener = () => void;

const DIRS_ROUND_1: ('R' | 'A' | 'L')[] = ['R', 'A', 'L'];
const DIRS_ROUND_2: ('R' | 'A' | 'L')[] = ['L', 'A', 'R'];

let logId = 0;

export class Engine {
  state: GameState;
  private listeners = new Set<EngineListener>();

  constructor(scores: number[] = [0, 0, 0, 0], dealer = 0) {
    const wall = buildWall();
    const players: PlayerState[] = [0, 1, 2, 3].map((seat) => ({
      seat,
      isBot: seat !== 0,
      hand: [],
      melds: [],
      discards: [],
      score: scores[seat] ?? 0,
    }));
    // deal: dealer 14, others 13
    for (let round = 0; round < 13; round++) {
      for (let s = 0; s < 4; s++) players[(dealer + s) % 4].hand.push(wall.pop()!);
    }
    players[dealer].hand.push(wall.pop()!);
    for (const pl of players) pl.hand = sortTiles(pl.hand);

    this.state = {
      phase: 'charleston-pass',
      wall,
      players,
      dealer,
      current: dealer,
      stage: 'act', // East discards first after Charleston
      lastDiscard: null,
      callResponses: new Map(),
      charleston: {
        round: 1,
        passIdx: 0,
        dirs: DIRS_ROUND_1,
        picks: [null, null, null, null],
        blinds: [false, false, false, false],
        votes: [null, null, null, null],
      },
      winner: null,
      wallGame: false,
      log: [],
    };
    this.pushLog('start', dealer);
  }

  subscribe(fn: EngineListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit() {
    for (const fn of this.listeners) fn();
  }
  private pushLog(k: string, seat?: number, tile?: TileKey, extra?: string) {
    this.state.log.push({ id: ++logId, k, seat, tile, extra });
    if (this.state.log.length > 120) this.state.log.shift();
  }

  // -------------------------------------------------------------------------
  // Charleston
  // -------------------------------------------------------------------------
  private passOffset(dir: 'R' | 'A' | 'L'): number {
    return dir === 'R' ? 1 : dir === 'A' ? 2 : 3;
  }

  charlestonPick(seat: number, tiles: TileKey[], blind = false): boolean {
    const st = this.state;
    if (st.phase !== 'charleston-pass') return false;
    const ch = st.charleston;
    const lastPass = ch.passIdx === 2;
    if (blind && !lastPass) return false;
    if (blind ? tiles.length > 3 : tiles.length !== 3) return false;
    if (tiles.includes(JOKER)) return false; // jokers may not be passed
    const pl = st.players[seat];
    const tmp = [...pl.hand];
    for (const t of tiles) {
      const i = tmp.indexOf(t);
      if (i < 0) return false;
      tmp.splice(i, 1);
    }
    pl.hand = tmp;
    ch.picks[seat] = tiles;
    ch.blinds[seat] = blind;
    if (ch.picks.every((x) => x !== null)) this.resolvePass();
    this.emit();
    return true;
  }

  private resolvePass() {
    const st = this.state;
    const ch = st.charleston;
    const off = this.passOffset(ch.dirs[ch.passIdx]);
    // incoming bundle for each seat (from seat-off)
    const incoming = [0, 1, 2, 3].map((s) => ch.picks[(s - off + 4) % 4]!);
    // blind passes: draw the shortfall at random from the incoming bundle
    for (let s = 0; s < 4; s++) {
      if (!ch.blinds[s]) continue;
      const need = 3 - ch.picks[s]!.length;
      const src = incoming[s];
      for (let i = 0; i < need && src.length > 0; i++) {
        const j = Math.floor(Math.random() * src.length);
        ch.picks[s]!.push(src.splice(j, 1)[0]);
      }
    }
    // deliver
    for (let s = 0; s < 4; s++) {
      const recv = (s + off) % 4;
      st.players[recv].hand = sortTiles([...st.players[recv].hand, ...ch.picks[s]!]);
    }
    this.pushLog('charleston-pass', undefined, undefined, ch.dirs[ch.passIdx]);
    ch.picks = [null, null, null, null];
    ch.blinds = [false, false, false, false];
    if (ch.passIdx < 2) {
      ch.passIdx++;
    } else if (ch.round === 1) {
      st.phase = 'charleston-vote';
    } else {
      st.phase = 'courtesy';
    }
  }

  charlestonVote(seat: number, yes: boolean) {
    const st = this.state;
    if (st.phase !== 'charleston-vote') return;
    st.charleston.votes[seat] = yes;
    if (st.charleston.votes.every((v) => v !== null)) {
      if (st.charleston.votes.every(Boolean)) {
        st.charleston.round = 2;
        st.charleston.passIdx = 0;
        st.charleston.dirs = DIRS_ROUND_2;
        st.phase = 'charleston-pass';
        this.pushLog('charleston-second');
      } else {
        st.phase = 'courtesy';
      }
      st.charleston.votes = [null, null, null, null];
    }
    this.emit();
  }

  courtesyPick(seat: number, tiles: TileKey[]): boolean {
    const st = this.state;
    if (st.phase !== 'courtesy') return false;
    if (tiles.length > 3 || tiles.includes(JOKER)) return false;
    const pl = st.players[seat];
    const tmp = [...pl.hand];
    for (const t of tiles) {
      const i = tmp.indexOf(t);
      if (i < 0) return false;
      tmp.splice(i, 1);
    }
    pl.hand = tmp;
    st.charleston.picks[seat] = tiles;
    if (st.charleston.picks.every((x) => x !== null)) {
      const p = st.charleston.picks as TileKey[][];
      for (const [a, b] of [[0, 2], [1, 3]] as const) {
        const k = Math.min(p[a].length, p[b].length);
        const giveA = p[a].slice(0, k);
        const giveB = p[b].slice(0, k);
        // return unexchanged tiles
        st.players[a].hand = sortTiles([...st.players[a].hand, ...p[a].slice(k), ...giveB]);
        st.players[b].hand = sortTiles([...st.players[b].hand, ...p[b].slice(k), ...giveA]);
      }
      st.charleston.picks = [null, null, null, null];
      st.phase = 'turn';
      st.current = st.dealer;
      st.stage = 'act'; // East discards first
      this.pushLog('courtesy-done');
      this.pushLog('turn', st.dealer);
    }
    this.emit();
    return true;
  }

  // -------------------------------------------------------------------------
  // Normal play
  // -------------------------------------------------------------------------
  pick(seat: number): boolean {
    const st = this.state;
    if (st.phase !== 'turn' || st.stage !== 'pick' || st.current !== seat) return false;
    const tile = st.wall.pop();
    if (tile === undefined) {
      this.endWallGame();
      this.emit();
      return true;
    }
    st.players[seat].hand.push(tile);
    st.stage = 'act';
    this.pushLog('pick', seat);
    this.emit();
    return true;
  }

  /** tiles the current player may use to swap jokers out of exposures */
  jokerSwap(seat: number, ownerSeat: number, meldIdx: number): boolean {
    const st = this.state;
    if (st.phase !== 'turn' || st.current !== seat || st.stage !== 'act') return false;
    const meld = st.players[ownerSeat].melds[meldIdx];
    if (!meld || !meld.tiles.includes(JOKER)) return false;
    const real = meld.tiles.find((t) => t !== JOKER)!;
    const hand = st.players[seat].hand;
    const i = hand.indexOf(real);
    if (i < 0) return false;
    hand.splice(i, 1);
    const j = meld.tiles.indexOf(JOKER);
    meld.tiles[j] = real;
    hand.push(JOKER);
    st.players[seat].hand = sortTiles(hand);
    this.pushLog('joker-swap', seat, real);
    this.emit();
    return true;
  }

  discard(seat: number, tile: TileKey): boolean {
    const st = this.state;
    if (st.phase !== 'turn' || st.current !== seat || st.stage !== 'act') return false;
    const pl = st.players[seat];
    const i = pl.hand.indexOf(tile);
    if (i < 0) return false;
    pl.hand.splice(i, 1);
    pl.discards.push(tile);
    st.lastDiscard = { tile, by: seat };
    this.pushLog('discard', seat, tile);

    // who can react?
    const others = [1, 2, 3].map((d) => (seat + d) % 4);
    const canReact = others.filter((s) => {
      const h = st.players[s];
      if (matchWin([...h.hand, tile], h.melds)) return true;
      return callableMelds(h.hand, tile).length > 0;
    });
    if (canReact.length === 0) {
      this.advanceTurn(seat);
    } else {
      st.phase = 'call-window';
      st.callResponses = new Map();
    }
    this.emit();
    return true;
  }

  private advanceTurn(fromSeat: number) {
    const st = this.state;
    const next = (fromSeat + 1) % 4;
    if (st.wall.length === 0) {
      this.endWallGame();
      return;
    }
    st.current = next;
    st.stage = 'pick';
    st.phase = 'turn';
    this.pushLog('turn', next);
  }

  /** options for a reacting seat during the call window */
  callOptions(seat: number): { mahjong: boolean; melds: number[] } {
    const st = this.state;
    if (!st.lastDiscard) return { mahjong: false, melds: [] };
    const pl = st.players[seat];
    const tile = st.lastDiscard.tile;
    return {
      mahjong: !!matchWin([...pl.hand, tile], pl.melds),
      melds: callableMelds(pl.hand, tile),
    };
  }

  submitCall(seat: number, action: 'pass' | 'pung' | 'kong' | 'quint' | 'mahjong') {
    const st = this.state;
    if (st.phase !== 'call-window' || !st.lastDiscard) return;
    const opts = this.callOptions(seat);
    if (action === 'mahjong' && !opts.mahjong) action = 'pass';
    const size = action === 'pung' ? 3 : action === 'kong' ? 4 : action === 'quint' ? 5 : 0;
    if (size > 0 && !opts.melds.includes(size)) action = 'pass';
    st.callResponses.set(seat, action);

    const others = [1, 2, 3].map((d) => (st.lastDiscard!.by + d) % 4);
    const waiting = others.filter((s) => this.callOptions(s).mahjong || this.callOptions(s).melds.length > 0);
    if (!waiting.every((s) => st.callResponses.has(s))) {
      this.emit();
      return;
    }
    // resolve: mahjong first, then exposure by proximity to discarder
    const by = st.lastDiscard.by;
    const tile = st.lastDiscard.tile;
    for (const d of [1, 2, 3]) {
      const s = (by + d) % 4;
      if (st.callResponses.get(s) === 'mahjong') {
        this.declareWin(s, tile, false);
        this.emit();
        return;
      }
    }
    for (const d of [1, 2, 3]) {
      const s = (by + d) % 4;
      const a = st.callResponses.get(s);
      if (a === 'pung' || a === 'kong' || a === 'quint') {
        const sz = a === 'pung' ? 3 : a === 'kong' ? 4 : 5;
        const pl = st.players[s];
        const { meld, fromHand } = buildMeld(pl.hand, tile, sz);
        for (const t of fromHand) pl.hand.splice(pl.hand.indexOf(t), 1);
        pl.melds.push({ tiles: meld });
        this.pushLog(a, s, tile);
        // caller discards without picking
        st.phase = 'turn';
        st.current = s;
        st.stage = 'act';
        st.lastDiscard = null;
        st.callResponses = new Map();
        this.pushLog('turn', s);
        this.emit();
        return;
      }
    }
    // everyone passed
    st.lastDiscard = null;
    st.callResponses = new Map();
    this.advanceTurn(by);
    this.emit();
  }

  /** self-pick mah-jongg (during own turn after picking) */
  declareMahjong(seat: number): boolean {
    const st = this.state;
    if (st.phase !== 'turn' || st.current !== seat || st.stage !== 'act') return false;
    const pl = st.players[seat];
    if (pl.hand.length % 3 !== 2) return false; // must hold 14 (incl. just-picked)
    const hand = matchWin(pl.hand, pl.melds);
    if (!hand) return false;
    this.declareWin(seat, pl.hand[pl.hand.length - 1], true, hand);
    this.emit();
    return true;
  }

  private declareWin(seat: number, tile: TileKey, selfPick: boolean, known?: CardHand) {
    const st = this.state;
    const pl = st.players[seat];
    const allTiles = selfPick ? pl.hand : [...pl.hand, tile];
    const hand = known ?? matchWin(allTiles, pl.melds);
    if (!hand) return;
    // move winning tile into hand for display
    if (!selfPick) {
      pl.hand.push(tile);
      pl.hand = sortTiles(pl.hand);
    }
    const jokerless = ![...allTiles, ...pl.melds.flatMap((m) => m.tiles)].includes(JOKER);
    const v = hand.value;
    const mult = jokerless ? 2 : 1;
    const deltas = [0, 0, 0, 0];
    if (selfPick) {
      for (const s of [0, 1, 2, 3]) if (s !== seat) deltas[s] = -2 * v * mult;
    } else {
      const by = st.lastDiscard?.by ?? ((seat + 3) % 4);
      for (const s of [0, 1, 2, 3]) {
        if (s === seat) continue;
        deltas[s] = s === by ? -2 * v * mult : -v * mult;
      }
    }
    deltas[seat] = -deltas.reduce((a, b) => a + b, 0);
    for (let s = 0; s < 4; s++) st.players[s].score += deltas[s];
    st.winner = { seat, hand, tile, selfPick, jokerless, deltas };
    st.phase = 'over';
    this.pushLog(selfPick ? 'mahjong-self' : 'mahjong', seat, tile, hand.id);
  }

  private endWallGame() {
    this.state.wallGame = true;
    this.state.phase = 'over';
    this.pushLog('wall-game');
  }
}
