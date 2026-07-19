// Rules AI chat — LLM backend with a built-in offline fallback.
import { useRef, useState } from 'react';
import { useStore } from '../state/store';
import { t } from '../i18n';
import { API_BASE } from '../config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Msg { role: 'user' | 'assistant'; content: string }

// --- tiny built-in fallback (used only if the API is unreachable) -----------
const FAQ: { keys: string[]; en: string; zh: string }[] = [
  {
    keys: ['charleston', '查尔斯顿', 'pass'],
    en: 'The Charleston is a tile-exchange ritual before play begins. Everyone passes 3 unwanted tiles: right → across → left. The table may then vote for a second Charleston (left → across → right), and finally an optional courtesy pass (0–3 tiles) with the player across. Jokers may never be passed.',
    zh: '查尔斯顿是开局前的换牌环节。每人传 3 张不要的牌：先传右手 → 对面 → 左手。随后可全体投票进行第二轮（左手 → 对面 → 右手），最后可与对面玩家进行 0–3 张的礼节性换牌。百搭不能传。',
  },
  {
    keys: ['joker', '百搭', 'wild'],
    en: 'Jokers are wild, but only inside pungs, kongs and quints (3+ identical tiles). They can NEVER be used in singles, pairs, or groups like NEWS or 2025. On your turn you may swap the real tile for a joker in anyone\'s exposure. A discarded joker is dead — nobody can call it.',
    zh: '百搭是万能牌，但只能用于碰、杠、五同（3 张以上相同牌）中，绝不能用于单张、对子，以及 NEWS、2025 这类组合。轮到你时，可以用真牌换出任何人亮牌中的百搭。打出的百搭是死牌，没人能叫。',
  },
  {
    keys: ['call', 'pung', 'kong', 'quint', '叫', '碰', '杠'],
    en: 'You may call a discard to complete a pung (3), kong (4) or quint (5) — the group is then exposed face-up on your rack and you discard. You can also call ANY tile (even a single or for a pair) if it completes your mah-jongg. Mah-jongg calls take priority over exposure calls. You cannot call when playing a concealed (C) hand, except for the winning tile.',
    zh: '你可以叫别人的弃牌来组成碰（3 张）、杠（4 张）或五同（5 张）——组成的牌组要亮在牌架上，然后你打出一张。如果某张牌能让你胡牌，任何牌都可以叫（包括单张或对子）。胡牌优先于亮牌叫牌。打门清（C）牌型时不能叫牌，除非叫的就是胡牌那张。',
  },
  {
    keys: ['score', 'point', 'pay', '分', '计分'],
    en: 'Each hand on the card has a value. If you win on someone\'s discard, the discarder pays double the value and the other two players pay the value once. If you self-pick, all three pay double. A jokerless win doubles everything again.',
    zh: '牌型卡上每个牌型都有分值。点炮胡牌时，放炮者付双倍，其余两家各付一倍；自摸则三家都付双倍。如果胡牌时整手没有百搭，全部再翻倍。',
  },
  {
    keys: ['card', 'nmjl', '2025', '卡', '牌型'],
    en: 'American mahjong is played against the yearly NMJL card: only the printed combinations win. Sections on the 2025 card: 2025, 2468, Any Like Numbers, Quints, Consecutive Run, 13579, Winds & Dragons, 369, and Singles & Pairs. X lines may be exposed; C lines must stay concealed. Check the Card tab here for every line.',
    zh: '美式麻将必须按照每年 NMJL 牌型卡上的组合胡牌。2025 卡的板块有：2025、2468、同数、五同、连号、13579、风与龙、369、单张与对子。标 X 的可以亮牌，标 C 的必须门清。可以查看本站的「2025 牌型卡」页面。',
  },
  {
    keys: ['flower', '花'],
    en: 'Flowers are suitless bonus tiles used by many hands on the card as pairs, pungs or kongs. They can never be used as a number tile, and on the 2025 card there is no hand with a single flower — so a lone flower is usually a safe-ish early discard.',
    zh: '花牌不属于任何花色，许多牌型需要花牌的对子、碰或杠。花牌不能当数字牌用。2025 卡上没有需要单张花牌的牌型，所以单张花牌通常可以较早安全打出。',
  },
];

function fallbackAnswer(q: string, lang: 'en' | 'zh'): string {
  const lower = q.toLowerCase();
  for (const f of FAQ) {
    if (f.keys.some((k) => lower.includes(k.toLowerCase()))) return f[lang];
  }
  return lang === 'zh'
    ? '我主要回答美式麻将规则问题，比如查尔斯顿、百搭用法、叫牌时机、计分方式、2025 牌型卡等。换个相关的问题试试？'
    : 'I focus on American mahjong rules — the Charleston, jokers, calling discards, scoring, the 2025 NMJL card. Try asking about one of those!';
}

export default function RulesSection() {
  const lang = useStore((s) => s.lang);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const ask = async (q: string) => {
    if (!q.trim() || busy) return;
    const next = [...msgs, { role: 'user' as const, content: q }];
    setMsgs(next);
    setInput('');
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-10), lang }),
      });
      if (!r.ok) throw new Error('bad status');
      const d = await r.json();
      setMsgs([...next, { role: 'assistant', content: d.reply }]);
    } catch {
      setMsgs([...next, { role: 'assistant', content: `${t(lang, 'rulesOffline')}\n\n${fallbackAnswer(q, lang)}` }]);
    } finally {
      setBusy(false);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }), 50);
    }
  };

  const suggestions = [t(lang, 'suggestedQ1'), t(lang, 'suggestedQ2'), t(lang, 'suggestedQ3'), t(lang, 'suggestedQ4')];

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-white mb-1">{t(lang, 'rulesTitle')}</h2>
      <p className="text-white/60 text-sm mb-4">{t(lang, 'rulesHint')}</p>
      <div ref={listRef} className="rounded-xl bg-[#12301f] border border-white/10 p-3 h-[380px] overflow-y-auto space-y-3">
        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((q) => (
              <button key={q} onClick={() => ask(q)} className="text-xs rounded-full border border-amber-400/40 text-amber-200 px-3 py-1 hover:bg-amber-400/10">
                {q}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span
              className={
                m.role === 'user'
                  ? 'inline-block rounded-2xl rounded-tr-sm bg-amber-500 text-black text-sm px-3 py-2 max-w-[85%] text-left'
                  : 'inline-block rounded-2xl rounded-tl-sm bg-white/10 text-white/90 text-sm px-3 py-2 max-w-[85%] whitespace-pre-wrap'
              }
            >
              {m.content}
            </span>
          </div>
        ))}
        {busy && <div className="text-white/50 text-sm">{t(lang, 'thinking')}</div>}
      </div>
      <form
        className="flex gap-2 mt-3"
        onSubmit={(e) => { e.preventDefault(); ask(input); }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t(lang, 'rulesPlaceholder')}
          className="bg-[#12301f] border-white/10 text-white"
        />
        <Button type="submit" disabled={busy} className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
          {t(lang, 'send')}
        </Button>
      </form>
    </div>
  );
}
