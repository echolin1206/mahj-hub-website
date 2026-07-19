import { useEffect, useState } from 'react';
import { useStore, bootstrapTelegram } from './state/store';
import { t } from './i18n';
import PlaySection from './sections/PlaySection';
import CardSection from './sections/CardSection';
import RulesSection from './sections/RulesSection';
import ShopSection from './sections/ShopSection';
import PaywallDialog from './components/PaywallDialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SHOP_URL } from './config';

type Tab = 'play' | 'card' | 'rules' | 'shop';

export default function App() {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const [tab, setTab] = useState<Tab>('play');

  useEffect(() => { bootstrapTelegram(); }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'play', label: t(lang, 'navPlay') },
    { id: 'card', label: t(lang, 'navCard') },
    { id: 'rules', label: t(lang, 'navRules') },
    { id: 'shop', label: t(lang, 'navShop') },
  ];

  return (
    <div className="min-h-screen bg-[#0b2417] text-white">
      <header className="sticky top-0 z-20 bg-[#0b2417]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-3 py-2 flex items-center gap-2 flex-wrap">
          <a href="/" className="flex items-center gap-2 mr-2">
            <span className="w-8 h-8 rounded bg-gradient-to-br from-amber-300 to-amber-600 text-black font-black flex items-center justify-center">🀄</span>
            <span className="font-black text-amber-300">{t(lang, 'title')}</span>
          </a>
          <nav className="flex gap-1 flex-1">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={cn(
                  'px-3 py-1 rounded-full text-sm transition-colors',
                  tab === tb.id ? 'bg-amber-500 text-black font-bold' : 'text-white/70 hover:text-white',
                )}
              >
                {tb.label}
              </button>
            ))}
          </nav>
          <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-amber-300 text-xs hidden sm:block">
            jybmahjong.com
          </a>
          <Button size="sm" variant="outline" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="border-white/20 text-white">
            {t(lang, 'langBtn')}
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 py-4">
        {tab === 'play' && <PlaySection />}
        {tab === 'card' && <CardSection />}
        {tab === 'rules' && <RulesSection />}
        {tab === 'shop' && <ShopSection />}
      </main>

      <footer className="border-t border-white/10 py-4 text-center text-white/40 text-xs">
        © {new Date().getFullYear()} JYB Mahjong · <a href={SHOP_URL} className="hover:text-amber-300" target="_blank" rel="noopener noreferrer">jybmahjong.com</a>
      </footer>

      <PaywallDialog />
    </div>
  );
}
