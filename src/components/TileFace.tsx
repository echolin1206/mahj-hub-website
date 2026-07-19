// CSS-rendered mahjong tile face.
import { parseTile } from '../game/tiles';
import type { TileKey } from '../game/tiles';
import { cn } from '@/lib/utils';

const SUIT_COLOR: Record<string, string> = {
  bam: '#1a7f37',
  crak: '#c62828',
  dot: '#1565c0',
};

export function TileFace({
  tile, size = 'md', selected = false, onClick, dim = false, highlight = false,
}: {
  tile: TileKey;
  size?: 'xs' | 'sm' | 'md';
  selected?: boolean;
  onClick?: () => void;
  dim?: boolean;
  highlight?: boolean;
}) {
  const t = parseTile(tile);
  const sz =
    size === 'xs' ? 'w-6 h-8 text-[10px]' : size === 'sm' ? 'w-8 h-11 text-xs' : 'w-10 h-14 text-sm';

  let content: React.ReactNode = null;
  if (t.kind === 'suit') {
    const color = SUIT_COLOR[t.suit];
    content = (
      <div className="flex flex-col items-center leading-none">
        <span className="font-bold" style={{ color }}>{t.n}</span>
        {t.suit === 'bam' && (
          <div className="flex gap-[2px] mt-[2px]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-[3px] rounded-sm" style={{ background: color, height: size === 'md' ? 16 : 10 }} />
            ))}
          </div>
        )}
        {t.suit === 'dot' && (
          <div
            className="rounded-full mt-[2px] border-2"
            style={{ borderColor: color, width: size === 'md' ? 14 : 9, height: size === 'md' ? 14 : 9 }}
          />
        )}
        {t.suit === 'crak' && (
          <span className="font-bold" style={{ color, fontSize: size === 'md' ? 16 : 10, lineHeight: 1 }}>万</span>
        )}
      </div>
    );
  } else if (t.kind === 'wind') {
    const zh = { E: '東', S: '南', W: '西', N: '北' }[t.dir];
    content = (
      <div className="flex flex-col items-center leading-none">
        <span className="font-bold text-slate-800" style={{ fontSize: size === 'md' ? 17 : 11 }}>{zh}</span>
        <span className="text-slate-500" style={{ fontSize: size === 'md' ? 9 : 7 }}>{t.dir}</span>
      </div>
    );
  } else if (t.kind === 'dragon') {
    const map = { R: { ch: '中', c: '#c62828' }, G: { ch: '發', c: '#1a7f37' }, W: { ch: '白', c: '#90a4ae' } }[t.color];
    content = (
      <div className="flex flex-col items-center leading-none">
        <span className="font-bold" style={{ color: map.c, fontSize: size === 'md' ? 17 : 11 }}>{map.ch}</span>
        <span className="text-slate-400" style={{ fontSize: size === 'md' ? 8 : 6 }}>
          {t.color === 'W' ? 'SOAP' : t.color === 'R' ? 'RED' : 'GREEN'}
        </span>
      </div>
    );
  } else if (t.kind === 'flower') {
    content = (
      <div className="flex flex-col items-center leading-none">
        <span style={{ fontSize: size === 'md' ? 16 : 10 }}>🌸</span>
        <span className="text-pink-500" style={{ fontSize: size === 'md' ? 8 : 6 }}>FLOWER</span>
      </div>
    );
  } else {
    content = (
      <div className="flex flex-col items-center leading-none">
        <span className="font-black" style={{ color: '#7b1fa2', fontSize: size === 'md' ? 15 : 10 }}>JOKER</span>
        <span style={{ fontSize: size === 'md' ? 12 : 8 }}>🃏</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'rounded-[4px] bg-gradient-to-b from-white to-[#f3ecd8] border border-[#d8ceb2] shadow-[0_1px_2px_rgba(0,0,0,0.35)]',
        'flex items-center justify-center select-none transition-transform',
        sz,
        onClick && 'hover:-translate-y-1 cursor-pointer',
        selected && '-translate-y-2 ring-2 ring-amber-400 border-amber-400',
        highlight && 'ring-2 ring-emerald-400',
        dim && 'opacity-60',
      )}
    >
      {content}
    </button>
  );
}

/** Face-down tile */
export function TileBack({ size = 'md' }: { size?: 'xs' | 'sm' | 'md' }) {
  const sz = size === 'xs' ? 'w-6 h-8' : size === 'sm' ? 'w-8 h-11' : 'w-10 h-14';
  return (
    <div
      className={cn(
        'rounded-[4px] border border-[#0d3b24] shadow-[0_1px_2px_rgba(0,0,0,0.35)]',
        'bg-gradient-to-br from-[#1d6b45] to-[#0f4a2d]',
        sz,
      )}
    />
  );
}
