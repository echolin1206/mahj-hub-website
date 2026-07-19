// Global store: engine wrapper, bot scheduler, i18n, trial/paywall, Telegram.
import { create } from 'zustand';
import { Engine } from '../game/engine';
import type { GameState } from '../game/engine';
import { tileNameEn, tileNameZh, JOKER } from '../game/tiles';
import type { TileKey } from '../game/tiles';
import * as bot from '../game/bot';
import type { Lang } from '../i18n';
import { API_BASE, FREE_GAMES } from '../config';

interface TgWebApp {
  initData?: string;
  ready?: () => void;
  expand?: () => void;
  openInvoice?: (url: string, cb?: (status: string) => void) => void;
  openTelegramLink?: (url: string) => void;
}
declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

const LS_PLAYED = 'jyb_games_played';
const LS_UNLOCKED = 'jyb_unlocked';
const LS_LANG = 'jyb_lang';

function loadNum(k: string): number {
  try { return parseInt(localStorage.getItem(k) ?? '0', 10) || 0; } catch { return 0; }
}

let botTimer: ReturnType<typeof setTimeout> | null = null;

interface Store {
  lang: Lang;
  setLang: (l: Lang) => void;

  engine: Engine | null;
  gs: GameState | null;
  tick: number;
  newGame: () => void;

  // UI selection
  selected: TileKey[];
  toggleSelect: (t: TileKey) => void;
  clearSelection: () => void;

  // entitlement
  gamesPlayed: number;
  unlocked: boolean;
  paywallOpen: boolean;
  setPaywallOpen: (b: boolean) => void;
  inTelegram: boolean;
  purchase: () => Promise<void>;

  // derived helpers
  seatName: (seat: number) => string;
  tileName: (t: TileKey) => string;
}

export const useStore = create<Store>((set, get) => {
  const attach = (engine: Engine) => {
    engine.subscribe(() => set((s) => ({ tick: s.tick + 1 })));
  };

  return {
    lang: (localStorage.getItem(LS_LANG) as Lang) || (navigator.language.startsWith('zh') ? 'zh' : 'en'),
    setLang: (l) => { localStorage.setItem(LS_LANG, l); set({ lang: l }); },

    engine: null,
    gs: null,
    tick: 0,
    newGame: () => {
      const { unlocked, gamesPlayed, engine: old } = get();
      if (!unlocked) {
        // a free game is consumed when the round STARTS (not when it ends),
        // so quitting mid-game still counts
        if (gamesPlayed >= FREE_GAMES) {
          set({ paywallOpen: true });
          return;
        }
        const n = gamesPlayed + 1;
        localStorage.setItem(LS_PLAYED, String(n));
        set({ gamesPlayed: n });
      }
      const scores = old ? old.state.players.map((p) => p.score) : [0, 0, 0, 0];
      const dealer = old ? (old.state.dealer + 1) % 4 : 0;
      const engine = new Engine(scores, dealer);
      attach(engine);
      set({ engine, gs: engine.state, tick: 0, selected: [] });
    },

    selected: [],
    toggleSelect: (t) => set((s) => ({
      selected: s.selected.includes(t) ? s.selected.filter((x) => x !== t) : [...s.selected, t],
    })),
    clearSelection: () => set({ selected: [] }),

    gamesPlayed: loadNum(LS_PLAYED),
    unlocked: localStorage.getItem(LS_UNLOCKED) === '1',
    paywallOpen: false,
    setPaywallOpen: (b) => set({ paywallOpen: b }),
    inTelegram: false,
    purchase: async () => {
      const tg = window.Telegram?.WebApp;
      if (!tg?.initData) return;
      try {
        const r = await fetch(`${API_BASE}/api/invoice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: tg.initData }),
        });
        const { url } = await r.json();
        tg.openInvoice?.(url, async (status) => {
          if (status === 'paid') {
            localStorage.setItem(LS_UNLOCKED, '1');
            set({ unlocked: true, paywallOpen: false });
          }
        });
      } catch {
        // backend offline — keep paywall
      }
    },

    seatName: (seat) => {
      const { lang } = get();
      return seat === 0 ? (lang === 'zh' ? '你' : 'You') : ['', 'Joy', 'Mei', 'Lily'][seat];
    },
    tileName: (tile) => (get().lang === 'zh' ? tileNameZh(tile) : tileNameEn(tile)),
  };
});

// ---------------------------------------------------------------------------
// Trial & Telegram bootstrap
// ---------------------------------------------------------------------------
export function bootstrapTelegram() {
  const tg = window.Telegram?.WebApp;
  if (!tg?.initData) return;
  useStore.setState({ inTelegram: true });
  tg.ready?.();
  tg.expand?.();
  fetch(`${API_BASE}/api/entitlement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: tg.initData }),
  })
    .then((r) => r.json())
    .then((d) => {
      if (d?.unlocked) {
        localStorage.setItem(LS_UNLOCKED, '1');
        useStore.setState({ unlocked: true });
      }
    })
    .catch(() => { /* static deploy without backend — local trial only */ });
}

// ---------------------------------------------------------------------------
// Bot scheduler — call after every tick change.
// ---------------------------------------------------------------------------
export function scheduleBots() {
  if (botTimer) { clearTimeout(botTimer); botTimer = null; }
  const { engine, gs } = useStore.getState();
  if (!engine || !gs) return;

  const act = (fn: () => void, delay = 650) => {
    const tickAtSchedule = useStore.getState().tick;
    botTimer = setTimeout(() => {
      if (useStore.getState().tick !== tickAtSchedule) return; // stale
      fn();
    }, delay);
  };

  // game over: if the free quota is used up, open the paywall
  if (gs.phase === 'over') {
    const st = useStore.getState();
    if (!st.unlocked && st.gamesPlayed >= FREE_GAMES && !st.paywallOpen) {
      useStore.setState({ paywallOpen: true });
    }
    return;
  }

  if (gs.phase === 'charleston-pass') {
    const b = [1, 2, 3].find((s) => gs.charleston.picks[s] === null);
    if (b !== undefined) {
      act(() => {
        const hand = engine.state.players[b].hand;
        engine.charlestonPick(b, bot.charlestonPass(hand));
      }, 400);
    }
    return;
  }
  if (gs.phase === 'charleston-vote') {
    const b = [1, 2, 3].find((s) => gs.charleston.votes[s] === null);
    if (b !== undefined) {
      act(() => engine.charlestonVote(b, bot.voteSecondCharleston(engine.state.players[b].hand)), 450);
    }
    return;
  }
  if (gs.phase === 'courtesy') {
    const b = [1, 2, 3].find((s) => gs.charleston.picks[s] === null);
    if (b !== undefined) {
      act(() => {
        const hand = engine.state.players[b].hand;
        engine.courtesyPick(b, bot.courtesyPass(hand, bot.courtesyCount()));
      }, 400);
    }
    return;
  }
  if (gs.phase === 'turn' && gs.current !== 0) {
    const seat = gs.current;
    if (gs.stage === 'pick') {
      act(() => engine.pick(seat), 600);
      return;
    }
    // stage 'act': joker swaps, then win or discard
    act(() => {
      const pl = engine.state.players[seat];
      const swaps = bot.findJokerSwaps(
        pl.hand,
        engine.state.players.map((p) => ({ seat: p.seat, melds: p.melds })),
      );
      for (const sw of swaps) engine.jokerSwap(seat, sw.seat, sw.meldIdx);
      if (engine.declareMahjong(seat)) return;
      const tile = bot.chooseDiscard(engine.state.players[seat].hand, engine.state.players[seat].melds);
      engine.discard(seat, tile);
    }, 800);
    return;
  }
  if (gs.phase === 'call-window') {
    // a bot that has options but hasn't responded
    const by = gs.lastDiscard?.by;
    if (by === undefined) return;
    const b = [1, 2, 3]
      .map((d) => (by + d) % 4)
      .find((s) => s !== 0 && !gs.callResponses.has(s) && (engine.callOptions(s).mahjong || engine.callOptions(s).melds.length > 0));
    if (b !== undefined) {
      act(() => {
        const pl = engine.state.players[b];
        const decision = bot.decideCall(pl.hand, pl.melds, gs.lastDiscard!.tile);
        engine.submitCall(b, decision);
      }, 700);
    }
    return;
  }
}

/** helper for UI: does the human still need to respond in the call window? */
export function humanCallPending(gs: GameState | null, engine: Engine | null): boolean {
  if (!gs || !engine || gs.phase !== 'call-window' || !gs.lastDiscard) return false;
  if (gs.lastDiscard.by === 0) return false;
  if (gs.callResponses.has(0)) return false;
  const opts = engine.callOptions(0);
  return opts.mahjong || opts.melds.length > 0;
}

export function canHumanActDiscard(gs: GameState | null): boolean {
  return !!gs && gs.phase === 'turn' && gs.current === 0 && gs.stage === 'act';
}
export function canHumanPick(gs: GameState | null): boolean {
  return !!gs && gs.phase === 'turn' && gs.current === 0 && gs.stage === 'pick';
}
export { JOKER };
