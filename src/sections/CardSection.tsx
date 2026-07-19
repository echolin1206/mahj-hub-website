import { useStore } from '../state/store';
import { t } from '../i18n';
import { cardLines, SECTIONS } from '../game/card2025';
import type { SectionId } from '../game/card2025';
import { TileFace } from '../components/TileFace';
import { Badge } from '@/components/ui/badge';

export default function CardSection() {
  const lang = useStore((s) => s.lang);
  const lines = cardLines();
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">{t(lang, 'cardTitle')}</h2>
      <p className="text-white/60 text-sm mb-4">{t(lang, 'cardHint')}</p>
      <div className="space-y-6">
        {SECTIONS.map((sec) => (
          <div key={sec.id}>
            <h3 className="text-amber-300 font-semibold mb-2">{lang === 'zh' ? sec.zh : sec.en}</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {lines.filter((l) => l.section === (sec.id as SectionId)).map((line) => (
                <div key={line.id} className="rounded-lg bg-[#12301f] border border-white/10 p-2 flex items-center gap-2 flex-wrap">
                  <div className="flex gap-[2px] flex-wrap flex-1">
                    {line.groups.map((grp, gi) => (
                      <div key={gi} className="flex gap-[1px] bg-black/20 rounded px-[2px] py-[1px]">
                        {grp.tiles.map((tile, ti) => (
                          <TileFace key={ti} tile={tile} size="xs" dim={tile === 'joker'} />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex gap-1 items-center">
                      <Badge variant={line.concealed ? 'destructive' : 'secondary'} className="text-[10px] px-1 py-0">
                        {line.concealed ? t(lang, 'concealed') : t(lang, 'exposed')}
                      </Badge>
                      <span className="text-amber-300 font-bold text-sm">{line.value}</span>
                    </div>
                    {(line.noteEn || line.noteZh) && (
                      <div className="text-[10px] text-white/50 max-w-[180px] text-right">
                        {lang === 'zh' ? line.noteZh : line.noteEn}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
