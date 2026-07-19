// ============================================================================
// SITE CONFIG — edit these values to match your store & bot.
// ============================================================================

/** Your Shopify store */
export const SHOP_URL = 'https://jybmahjong.com';

/** Products shown in the Shop section (edit names/urls/prices freely) */
export const PRODUCTS: { nameEn: string; nameZh: string; url: string; tagEn: string; tagZh: string }[] = [
  {
    nameEn: 'American Mahjong Tile Sets',
    nameZh: '美式麻将牌套装',
    url: `${SHOP_URL}/collections/mahjong-sets`,
    tagEn: 'Shop tile sets',
    tagZh: '选购牌具',
  },
  {
    nameEn: '2025 NMJL Cards & Scorecards',
    nameZh: '2025 NMJL 规则卡',
    url: `${SHOP_URL}/collections/nmjl-cards`,
    tagEn: 'Get the card',
    tagZh: '购买规则卡',
  },
  {
    nameEn: 'Racks, Pushers & Mats',
    nameZh: '牌尺、推牌器、桌垫',
    url: `${SHOP_URL}/collections/accessories`,
    tagEn: 'Accessories',
    tagZh: '周边配件',
  },
  {
    nameEn: 'All Mahjong Products',
    nameZh: '全部麻将商品',
    url: `${SHOP_URL}/collections/all`,
    tagEn: 'Browse all',
    tagZh: '浏览全部',
  },
];

/** Telegram bot username (create with @BotFather, then set it here) */
export const TELEGRAM_BOT = 'jybmahjong_bot';
export const TELEGRAM_BOT_URL = `https://t.me/${TELEGRAM_BOT}`;

/** Backend API base. Same-origin in production; override with VITE_API_BASE. */
export const API_BASE: string = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_BASE ?? '';

/** Free trial: number of complete games before the paywall */
export const FREE_GAMES = 3;

/** Unlock price in Telegram Stars */
export const STAR_PRICE = 150;
