import { useStore } from '../state/store';
import { t } from '../i18n';
import { FREE_GAMES, STAR_PRICE, TELEGRAM_BOT_URL } from '../config';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function PaywallDialog() {
  const lang = useStore((s) => s.lang);
  const open = useStore((s) => s.paywallOpen);
  const setOpen = useStore((s) => s.setPaywallOpen);
  const inTelegram = useStore((s) => s.inTelegram);
  const purchase = useStore((s) => s.purchase);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#12301f] text-white border-amber-400/30">
        <DialogHeader>
          <DialogTitle className="text-amber-300">{t(lang, 'paywallTitle')}</DialogTitle>
          <DialogDescription className="text-white/70">
            {t(lang, 'paywallBody', { n: FREE_GAMES })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {inTelegram ? (
            <Button onClick={purchase} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold">
              ⭐ {t(lang, 'paywallUnlock', { stars: STAR_PRICE })}
            </Button>
          ) : (
            <>
              <Button asChild className="w-full bg-[#2AABEE] hover:bg-[#249ad8] text-white font-bold">
                <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer">
                  ✈️ {t(lang, 'paywallOpenTg')}
                </a>
              </Button>
              <p className="text-white/50 text-xs">{t(lang, 'paywallWebNote')}</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
