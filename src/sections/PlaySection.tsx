import { useEffect, useMemo, useState } from 'react';
import { useStore, scheduleBots, humanCallPending, canHumanActDiscard, canHumanPick } from '../state/store';
import { TileFace, TileBack } from '../components/TileFace';
import { t } from '../i18n';
import { matchWin, evaluate } from '../game/match';
import { JOKER } from '../game/tiles';
import type { TileKey } from '../game/tiles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LogEvent } from '../game/engine';

function DirLabel({ dir }: { dir: 'R' | 'A' | 'L' }) {
  const lang = useStore((s) => s.lang);
  return <span>{dir === 'R' ? t(lang, 'dirR') : dir === 'A' ? t(lang, 'dirA') : t(lang, 'dirL')}</span>;
}

function LogLine({ ev }: { ev: LogEvent }) {
  const lang = useStore((s) => s.lang);
  const seatName = useStore((s) => s.seatName);
  const tileName = useStore((s) => s.tileName);
  const seat = ev.seat !== undefined ? seatName(ev.seat) : '';
  const tile = ev.tile ? tileName(ev.tile) : '';
  const dir = ev.extra
    ? ev.extra === 'R' ? t(lang, 'dirR') : ev.extra === 'A' ? t(lang, 'dirA') : t(lang, 'dirL')
    : '';
  switch (ev.k) {
    case 'start': return <span>{t(lang, 'logStart', { seat })}</span>;
    case 'charleston-pass': return <span>{t(lang, 'logPass', { dir })}</span>;
    case 'charleston-second': return <span>{t(lang, 'logSecond')}</span>;
    case 'courtesy-done': return <span>{t(lang, 'logCourtesy')}</span>;
    case 'turn': return <span className="text-emerald-300">{t(lang, 'logTurn', { seat })}</span>;
    case 'pick': return <span>{t(lang, 'logPick', { seat })}</span>;
    case 'discard': return <span>{t(lang, 'logDiscard', { seat, tile })}</span>;
    case 'pung': return <span className="text-amber-300">{t(lang, 'logPung', { seat, tile })}</span>;
    case 'kong': return <span className="text-amber-300">{t(lang, 'logKong', { seat, tile })}</span>;
    case 'quint': return <span className="text-amber-300">{t(lang, 'logQuint', { seat, tile })}</span>;
    case 'mahjong': return <span className="text-yellow-300 font-semibold">{t(lang, 'logMahjong', { seat, tile, hand: ev.extra ?? '' })}</span>;
    case 'mahjong-self': return <span className="text-yellow-300 font-semibold">{t(lang, 'logMahjongSelf', { seat, hand: ev.extra ?? '' })}</span>;
    case 'joker-swap': return <span className="text-purple-300">{t(lang, 'logSwap', { seat, tile })}</span>;
    case 'wall-game': return <span>{t(lang, 'logWall')}</span>;
    default: return <span>{ev.k}</span>;
  }
}

function Melds({ seat, interactive }: { seat: number; interactive: boolean }) {
  const gs = useStore((s) => s.gs);
  const engine = useStore((s) => s.engine);
  if (!gs || !engine) return null;
  const pl = gs.players[seat];
  const humanTurn = gs.phase === 'turn' && gs.current === 0 && gs.stage === 'act';
  return (
    <div className="flex gap-2 flex-wrap">
      {pl.melds.map((m, i) => (
        <div key={i} className="flex gap-[2px] bg-black/20 rounded px-1 py-[2px]">
          {m.tiles.map((tile, j) => (
            <TileFace
              key={j}
              tile={tile}
              size="xs"
              onClick={
                interactive && humanTurn && tile === JOKER
                  ? () => engine.jokerSwap(0, seat, i)
                  : undefined
              }
              highlight={interactive && humanTurn && tile === JOKER}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function Opponent({ seat, pos }: { seat: number; pos: 'top' | 'left' | 'right' }) {
  const gs = useStore((s) => s.gs);
  const seatName = useStore((s) => s.seatName);
  const lang = useStore((s) => s.lang);
  if (!gs) return null;
  const pl = gs.players[seat];
  const active = gs.phase === 'turn' && gs.current === seat;
  return (
    <div
      className={cn(
        'rounded-xl bg-black/20 p-2 flex flex-col gap-1 min-w-0',
        active && 'ring-2 ring-amber-300',
        pos === 'top' && 'items-center',
      )}
    >
      <div className="flex items-center gap-2 text-white/90 text-xs">
        <span className="font-semibold">{seatName(seat)}</span>
        {gs.dealer === seat && <Badge variant="secondary" className="text-[10px] px-1 py-0">{t(lang, 'east')}</Badge>}
        <span className="text-white/60">{pl.score >= 0 ? `+${pl.score}` : pl.score}</span>
      </div>
      <div className="flex gap-[2px] flex-wrap">
        {pl.hand.map((_, i) => <TileBack key={i} size="xs" />)}
      </div>
      <Melds seat={seat} interactive />
      <div className="flex gap-[2px] flex-wrap min-h-[24px]">
        {pl.discards.map((tile, i) => (
          <TileFace key={i} tile={tile} size="xs" dim={i < pl.discards.length - 1} />
        ))}
      </div>
    </div>
  );
}

export default function PlaySection() {
  const lang = useStore((s) => s.lang);
  const engine = useStore((s) => s.engine);
  const gs = useStore((s) => s.gs);
  const tick = useStore((s) => s.tick);
  const newGame = useStore((s) => s.newGame);
  const selected = useStore((s) => s.selected);
  const toggleSelect = useStore((s) => s.toggleSelect);
  const clearSelection = useStore((s) => s.clearSelection);
  const gamesPlayed = useStore((s) => s.gamesPlayed);
  const unlocked = useStore((s) => s.unlocked);
  const [blind, setBlind] = useState(false);

  useEffect(() => { scheduleBots(); }, [tick, engine]);
  useEffect(() => { clearSelection(); setBlind(false); }, [gs?.phase, gs?.charleston.passIdx, clearSelection]);

  const humanWin = useMemo(() => {
    if (!gs || !engine) return null;
    const pl = gs.players[0];
    if (canHumanActDiscard(gs) && pl.hand.length % 3 === 2) return matchWin(pl.hand, pl.melds);
    return null;
    // engine mutates state in place — must depend on tick to recompute
  }, [gs, engine, tick]);

  // win hints: closest card hands + the tiles still needed
  const hints = useMemo(() => {
    if (!gs || gs.phase === 'over') return [];
    return evaluate(gs.players[0].hand, gs.players[0].melds, 3);
  }, [gs, tick]);

  if (!engine || !gs) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-2xl font-bold text-white">{t(lang, 'title')}</div>
        <div className="text-white/70">{t(lang, 'subtitle')}</div>
        <Button size="lg" onClick={newGame} className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
          {t(lang, 'newGame')}
        </Button>
        {!unlocked && gamesPlayed > 0 && (
          <div className="text-white/60 text-sm">{t(lang, 'gamesLeft', { n: Math.max(0, 3 - gamesPlayed) })}</div>
        )}
      </div>
    );
  }

  const me = gs.players[0];
  const callPending = humanCallPending(gs, engine);
  const callOpts = callPending ? engine.callOptions(0) : { mahjong: false, melds: [] };
  const charlestonMe = gs.phase === 'charleston-pass' && gs.charleston.picks[0] === null;
  const voteMe = gs.phase === 'charleston-vote' && gs.charleston.votes[0] === null;
  const courtesyMe = gs.phase === 'courtesy' && gs.charleston.picks[0] === null;
  const lastPass = gs.charleston.passIdx === 2;

  const onTileClick = (tile: TileKey) => {
    if (charlestonMe || courtesyMe) {
      toggleSelect(tile);
      return;
    }
    if (canHumanActDiscard(gs)) {
      if (selected.includes(tile)) {
        engine.discard(0, tile);
        clearSelection();
      } else {
        useStore.setState({ selected: [tile] });
      }
    }
  };

  const confirmCharleston = () => {
    if (blind ? selected.length > 3 : selected.length !== 3) return;
    engine.charlestonPick(0, selected, blind);
    clearSelection();
    setBlind(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* table */}
      <div className="flex-1 min-w-0">
        <div className="relative rounded-2xl bg-gradient-to-br from-[#14603c] to-[#0c4028] border-4 border-[#5d4023] shadow-2xl p-3 flex flex-col gap-2">
          {/* top opponent */}
          <Opponent seat={2} pos="top" />
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch">
            <Opponent seat={3} pos="left" />
            {/* center */}
            <div className="flex flex-col items-center justify-center gap-2 px-2 min-w-[140px]">
              <div className="text-white/80 text-xs">{t(lang, 'wallLeft')}: <span className="font-bold text-amber-300">{gs.wall.length}</span></div>
              {gs.lastDiscard && (
                <div className="flex flex-col items-center gap-1">
                  <TileFace tile={gs.lastDiscard.tile} size="md" highlight />
                  <div className="text-[10px] text-white/60">{useStore.getState().tileName(gs.lastDiscard.tile)}</div>
                </div>
              )}
              {gs.phase === 'charleston-pass' && (
                <div className="text-center text-amber-200 text-sm font-semibold">
                  {t(lang, 'charleston')} — <DirLabel dir={gs.charleston.dirs[gs.charleston.passIdx]} />
                </div>
              )}
              {gs.phase === 'courtesy' && <div className="text-amber-200 text-sm font-semibold text-center">{t(lang, 'courtesy')}</div>}
              {gs.phase === 'over' && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-2xl">
                  <div className="bg-[#123f2b] border border-amber-400/40 rounded-2xl p-6 max-w-md text-center shadow-2xl">
                    {gs.wallGame ? (
                      <div className="text-xl text-white font-bold mb-4">{t(lang, 'wallGame')}</div>
                    ) : gs.winner ? (
                      <>
                        <div className="text-2xl text-amber-300 font-black mb-1">{t(lang, 'winTitle')}</div>
                        <div className="text-white font-semibold">{useStore.getState().seatName(gs.winner.seat)}</div>
                        <div className="text-white/80 text-sm mt-1">
                          {t(lang, 'handLabel')}: <span className="text-amber-200 font-semibold">{gs.winner.hand.id}</span>
                          {' · '}{t(lang, 'value')}: {gs.winner.hand.value}
                        </div>
                        <div className="text-white/70 text-sm">{gs.winner.selfPick ? t(lang, 'selfPick') : t(lang, 'discardWin')}</div>
                        {gs.winner.jokerless && <Badge className="mt-2 bg-purple-600">{t(lang, 'jokerless')}</Badge>}
                        <div className="flex justify-center gap-1 mt-3 flex-wrap">
                          {gs.players[gs.winner.seat].hand.map((tile, i) => <TileFace key={i} tile={tile} size="xs" />)}
                        </div>
                        <div className="flex justify-center gap-3 mt-3 text-sm">
                          {gs.winner.deltas.map((d, s) => (
                            <span key={s} className={d >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                              {useStore.getState().seatName(s)} {d >= 0 ? `+${d}` : d}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : null}
                    <Button onClick={newGame} className="mt-5 bg-amber-500 hover:bg-amber-600 text-black font-bold">
                      {t(lang, 'nextGame')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <Opponent seat={1} pos="right" />
          </div>

          {/* player area */}
          <div className={cn('rounded-xl bg-black/25 p-2', gs.phase === 'turn' && gs.current === 0 && 'ring-2 ring-amber-300')}>
            <div className="flex items-center gap-2 text-white/90 text-xs mb-1">
              <span className="font-semibold">{t(lang, 'you')}</span>
              {gs.dealer === 0 && <Badge variant="secondary" className="text-[10px] px-1 py-0">{t(lang, 'east')}</Badge>}
              <span className="text-white/60">{me.score >= 0 ? `+${me.score}` : me.score}</span>
              <Melds seat={0} interactive />
            </div>
            <div className="flex gap-[3px] flex-wrap">
              {me.hand.map((tile, i) => (
                <TileFace
                  key={`${tile}-${i}`}
                  tile={tile}
                  size="md"
                  selected={selected.includes(tile)}
                  onClick={() => onTileClick(tile)}
                />
              ))}
            </div>
            {/* own discards */}
            {me.discards.length > 0 && (
              <div className="mt-2">
                <div className="text-white/50 text-[10px] mb-[2px]">{t(lang, 'yourDiscards')}</div>
                <div className="flex gap-[2px] flex-wrap">
                  {me.discards.map((tile, i) => (
                    <TileFace key={i} tile={tile} size="xs" dim={i < me.discards.length - 1} />
                  ))}
                </div>
              </div>
            )}
            {/* action bar */}
            <div className="flex items-center gap-2 mt-2 flex-wrap min-h-[40px]">
              {charlestonMe && (
                <>
                  <span className="text-white/80 text-sm">{t(lang, 'selectTiles', { n: blind ? '0–3' : 3 })}: {selected.length}</span>
                  {lastPass && (
                    <label className="flex items-center gap-1 text-white/70 text-sm">
                      <input type="checkbox" checked={blind} onChange={(e) => setBlind(e.target.checked)} />
                      {t(lang, 'blindPass')}
                    </label>
                  )}
                  <Button size="sm" onClick={confirmCharleston} disabled={blind ? selected.length > 3 : selected.length !== 3} className="bg-amber-500 text-black hover:bg-amber-600">
                    {t(lang, 'confirmPass')}
                  </Button>
                </>
              )}
              {gs.phase === 'charleston-pass' && !charlestonMe && <span className="text-white/60 text-sm">{t(lang, 'waiting')}</span>}
              {voteMe && (
                <>
                  <span className="text-white/80 text-sm">{t(lang, 'secondCharlestonQ')}</span>
                  <Button size="sm" onClick={() => engine.charlestonVote(0, true)} className="bg-emerald-500 text-black hover:bg-emerald-600">{t(lang, 'voteYes')}</Button>
                  <Button size="sm" variant="outline" onClick={() => engine.charlestonVote(0, false)}>{t(lang, 'voteNo')}</Button>
                </>
              )}
              {gs.phase === 'charleston-vote' && !voteMe && <span className="text-white/60 text-sm">{t(lang, 'waiting')}</span>}
              {courtesyMe && (
                <>
                  <span className="text-white/80 text-sm">{t(lang, 'courtesyHint')}: {selected.length}</span>
                  <Button size="sm" onClick={() => { engine.courtesyPick(0, selected); clearSelection(); }} className="bg-amber-500 text-black hover:bg-amber-600">
                    {t(lang, 'confirmPass')}
                  </Button>
                </>
              )}
              {canHumanPick(gs) && (
                <Button size="sm" onClick={() => engine.pick(0)} className="bg-emerald-500 text-black hover:bg-emerald-600 font-bold">
                  {t(lang, 'pick')}
                </Button>
              )}
              {canHumanActDiscard(gs) && (
                <>
                  <span className="text-white/70 text-sm">{t(lang, 'yourTurnDiscard')}</span>
                  {selected.length === 1 && (
                    <Button size="sm" onClick={() => { engine.discard(0, selected[0]); clearSelection(); }} className="bg-amber-500 text-black hover:bg-amber-600">
                      {t(lang, 'discard')}
                    </Button>
                  )}
                  {humanWin && (
                    <Button size="sm" onClick={() => engine.declareMahjong(0)} className="bg-yellow-400 text-black hover:bg-yellow-500 font-black animate-pulse">
                      {t(lang, 'mahjong')}
                    </Button>
                  )}
                </>
              )}
              {callPending && (
                <>
                  <span className="text-amber-200 text-sm font-semibold">{t(lang, 'callPrompt')}</span>
                  {callOpts.mahjong && (
                    <Button size="sm" onClick={() => engine.submitCall(0, 'mahjong')} className="bg-yellow-400 text-black font-black">{t(lang, 'mahjong')}</Button>
                  )}
                  {callOpts.melds.includes(3) && <Button size="sm" onClick={() => engine.submitCall(0, 'pung')} className="bg-emerald-500 text-black">{t(lang, 'pung')}</Button>}
                  {callOpts.melds.includes(4) && <Button size="sm" onClick={() => engine.submitCall(0, 'kong')} className="bg-emerald-500 text-black">{t(lang, 'kong')}</Button>}
                  {callOpts.melds.includes(5) && <Button size="sm" onClick={() => engine.submitCall(0, 'quint')} className="bg-emerald-500 text-black">{t(lang, 'quint')}</Button>}
                  <Button size="sm" variant="outline" onClick={() => engine.submitCall(0, 'pass')}>{t(lang, 'pass')}</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* sidebar: scores + log */}
      <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-3">
        <div className="rounded-xl bg-[#12301f] border border-white/10 p-3">
          <div className="flex gap-2">
            <Button onClick={newGame} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold" size="sm">
              {t(lang, 'newGame')}
            </Button>
          </div>
          {!unlocked && (
            <div className="text-white/60 text-xs mt-2">{t(lang, 'gamesLeft', { n: Math.max(0, 3 - gamesPlayed) })}</div>
          )}
          <div className="mt-3 space-y-1">
            {gs.players.map((p) => (
              <div key={p.seat} className="flex justify-between text-sm text-white/80">
                <span>{useStore.getState().seatName(p.seat)}{gs.dealer === p.seat ? ' 🀄' : ''}</span>
                <span className={p.score >= 0 ? 'text-emerald-300' : 'text-red-300'}>{p.score >= 0 ? `+${p.score}` : p.score}</span>
              </div>
            ))}
          </div>
        </div>
        {/* win hints */}
        {hints.length > 0 && (
          <div className="rounded-xl bg-[#12301f] border border-amber-400/30 p-3">
            <div className="text-amber-200 text-xs font-bold mb-2">{t(lang, 'hintTitle')}</div>
            <div className="space-y-2">
              {hints.map((h, i) => (
                <div key={`${h.hand.id}-${i}`} className={i > 0 ? 'opacity-70' : ''}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/90 font-semibold">{h.hand.id} · {h.hand.value}pt</span>
                    <span className={h.missing === 0 ? 'text-yellow-300 font-bold' : 'text-emerald-300'}>
                      {h.missing === 0 ? t(lang, 'hintDone') : t(lang, 'hintMissing', { n: h.missing })}
                    </span>
                  </div>
                  <div className="text-white/45 text-[10px] leading-tight">{lang === 'zh' ? h.hand.noteZh : h.hand.noteEn}</div>
                  {h.missing > 0 && h.needed.length > 0 && (
                    <div className="flex gap-[2px] mt-1 flex-wrap">
                      {[...new Set(h.needed)].slice(0, 8).map((tile) => (
                        <TileFace key={tile} tile={tile} size="xs" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="rounded-xl bg-[#12301f] border border-white/10 p-3 flex-1 min-h-[200px] max-h-[420px] overflow-y-auto">
          <div className="space-y-1 text-xs text-white/70 flex flex-col-reverse">
            {[...gs.log].reverse().map((ev) => (
              <div key={ev.id}><LogLine ev={ev} /></div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
