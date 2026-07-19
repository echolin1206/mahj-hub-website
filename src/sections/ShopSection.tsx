import { useStore } from '../state/store';
import { t } from '../i18n';
import { PRODUCTS, SHOP_URL } from '../config';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function ShopSection() {
  const lang = useStore((s) => s.lang);
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">{t(lang, 'shopTitle')}</h2>
      <p className="text-white/60 text-sm mb-4">{t(lang, 'shopHint')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {PRODUCTS.map((p) => (
          <a
            key={p.url}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl bg-[#12301f] border border-white/10 p-4 flex items-center justify-between hover:border-amber-400/50 transition-colors"
          >
            <div>
              <div className="text-white font-semibold">{lang === 'zh' ? p.nameZh : p.nameEn}</div>
              <div className="text-amber-300/80 text-sm">{lang === 'zh' ? p.tagZh : p.tagEn}</div>
            </div>
            <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-amber-300" />
          </a>
        ))}
      </div>
      <Button asChild className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-bold">
        <a href={SHOP_URL} target="_blank" rel="noopener noreferrer">{t(lang, 'visitStore')}</a>
      </Button>
    </div>
  );
}
