// Business API (Hono app, mounted at /api): rules-AI chat, Telegram
// entitlement & Stars payments, Telegram bot webhook.
// Served as Vercel serverless functions via api/[...slug].ts
import { Hono } from "hono";
import { z } from "zod";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "./db.js";
import { entitlements } from "../db/schema";

const STAR_PRICE = () => parseInt(process.env.STAR_PRICE || "150", 10);
const BOT_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN || "";
const MINI_APP_URL = () => process.env.MINI_APP_URL || "https://play.jybmahjong.com";

export const app = new Hono().basePath("/api");

// ---------------------------------------------------------------------------
// Telegram helpers
// ---------------------------------------------------------------------------
function validateInitData(initData: string): { userId: string } | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash || !BOT_TOKEN()) return null;
    params.delete("hash");
    const dataCheck = [...params.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join("\n");
    const secret = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN()).digest();
    const calc = crypto.createHmac("sha256", secret).update(dataCheck).digest("hex");
    if (calc !== hash) return null;
    const user = JSON.parse(params.get("user") || "{}");
    return user?.id ? { userId: String(user.id) } : null;
  } catch {
    return null;
  }
}

async function botApi<T = Record<string, unknown>>(method: string, body: unknown): Promise<T> {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await r.json()) as T;
}

async function isUnlocked(telegramUserId: string): Promise<boolean> {
  const row = await getDb().query.entitlements.findFirst({
    where: eq(entitlements.telegramUserId, telegramUserId),
  });
  return !!row;
}

// ---------------------------------------------------------------------------
// Rules AI chat — proxies an OpenAI-compatible LLM (key stays server-side)
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are the rules expert of JYB Mahjong (play.jybmahjong.com), an American mahjong (NMJL rules) game played with the I Love Mahj (ILM) card. Answer questions about American mahjong rules, the I Love Mahj card, and beginner strategy.

Core facts you must follow:
- American mahjong uses 152 tiles: 3 suits (Bam/Crak/Dot, 1–9, 4 each), 4 winds (N/E/W/S, 4 each), 3 dragons (Red/Green/Soap-white, 4 each), 8 flowers, 8 jokers.
- The goal: build one of the hands printed on the I Love Mahj card. Its sections: 2468, Any Like Numbers, Math, Quints, Consecutive Runs, 13579, Winds-Dragons, 369, Singles and Pairs. X = exposures allowed, C = concealed only. The Math section is special: the hand's number groups form an equation (e.g. kong 4s + kong 8s + a 3 and a 2 for "4 x 8 = 32"); the operators and result digits are part of the hand.
- Group sizes: pair 2, pung 3, kong 4, quint 5. Jokers substitute ONLY inside pungs/kongs/quints (3+ identical tiles) — never in singles, pairs, or mixed groups like NEWS.
- Jokers may never be passed in the Charleston. A discarded joker is dead and cannot be called. On your turn you may exchange the real tile for a joker in anyone's exposure.
- The Charleston (before play): everyone passes 3 tiles right → across → left (compulsory), optional second Charleston left → across → right if the whole table agrees, then an optional courtesy pass of 0–3 tiles with the player across. Blind pass of 1–3 tiles is allowed on the last pass of each Charleston.
- Calling discards: you may call to complete a pung/kong/quint (the group is then exposed on your rack, and you discard), or call ANY tile — including a single or one for a pair — only if it completes mah-jongg. Mah-jongg calls beat exposure calls; among exposure callers the player nearest in turn order wins. Concealed (C) hands may not call except for the winning tile.
- Scoring: each card line has a value. Win on a discard → the discarder pays double the value, the other two pay the value once. Self-pick → all three pay double. Jokerless win → everything doubles again. A wall game (exhausted wall) has no payments.
- ILM card notes: most open hands are worth 25, quints 35–45, concealed hands 30–35, Singles & Pairs 50–75. Zeros are always soaps (white dragons) and are suitless. Dragons match suits: red=crak, green=bam, soap=dot.

Style: answer in the SAME language as the user's message (Chinese or English). Be concise, friendly, use short examples. If asked something unrelated to mahjong, briefly answer and steer back to the game. Never invent card lines; if unsure about an exact ILM line, say so and suggest checking the Card tab.`;

const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(20),
  lang: z.enum(["en", "zh"]).default("en"),
});

app.post("/chat", async (c) => {
  const parsed = chatSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid input" }, 400);
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) return c.json({ error: "LLM not configured" }, 503);
  const base = (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  try {
    const r = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...parsed.data.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    if (!r.ok) throw new Error(`llm ${r.status}`);
    const d = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = d.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("empty reply");
    return c.json({ reply });
  } catch {
    return c.json({ error: "LLM unavailable" }, 502);
  }
});

// ---------------------------------------------------------------------------
// Entitlement & Stars invoice
// ---------------------------------------------------------------------------
const initSchema = z.object({ initData: z.string().min(1) });

app.post("/entitlement", async (c) => {
  const parsed = initSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid input" }, 400);
  const v = validateInitData(parsed.data.initData);
  if (!v) return c.json({ unlocked: false }, 401);
  return c.json({ unlocked: await isUnlocked(v.userId) });
});

app.post("/invoice", async (c) => {
  const parsed = initSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid input" }, 400);
  const v = validateInitData(parsed.data.initData);
  if (!v) return c.json({ error: "unauthorized" }, 401);
  if (await isUnlocked(v.userId)) return c.json({ url: null, already: true });
  const resp = await botApi<{ ok: boolean; result?: string; description?: string }>("createInvoiceLink", {
    title: "JYB Mahjong — Full Unlock",
    description: "Unlimited American mahjong games, all future NMJL cards and the Rules AI.",
    payload: `unlock_${v.userId}`,
    currency: "XTR", // Telegram Stars
    prices: [{ label: "Full Unlock", amount: STAR_PRICE() }],
  });
  if (!resp.ok || !resp.result) return c.json({ error: resp.description ?? "invoice failed" }, 502);
  return c.json({ url: resp.result });
});

// ---------------------------------------------------------------------------
// Telegram bot webhook
// ---------------------------------------------------------------------------
app.post("/telegram/webhook", async (c) => {
  const update = (await c.req.json().catch(() => null)) as Record<string, any> | null;
  if (!update) return c.json({ ok: true });

  // /start → Mini App button
  const msg = update.message ?? update.edited_message;
  if (msg?.text?.startsWith("/start") && msg.chat?.id) {
    await botApi("sendMessage", {
      chat_id: msg.chat.id,
      text: "🀄 Welcome to JYB Mahjong! Play American mahjong online — free trial inside.",
      reply_markup: {
        inline_keyboard: [[{ text: "🀄 Play JYB Mahjong", web_app: { url: MINI_APP_URL() } }]],
      },
    });
    return c.json({ ok: true });
  }

  // Stars checkout
  if (update.pre_checkout_query) {
    await botApi("answerPreCheckoutQuery", {
      pre_checkout_query_id: update.pre_checkout_query.id,
      ok: true,
    });
    return c.json({ ok: true });
  }
  if (msg?.successful_payment) {
    const userId = String(msg.from?.id ?? "");
    const charge = msg.successful_payment;
    if (userId && String(charge.currency) === "XTR") {
      await getDb()
        .insert(entitlements)
        .values({
          telegramUserId: userId,
          stars: Number(charge.total_amount ?? 0),
          payload: String(charge.invoice_payload ?? ""),
        })
        .onConflictDoUpdate({
          target: entitlements.telegramUserId,
          set: { stars: Number(charge.total_amount ?? 0) },
        });
      await botApi("sendMessage", {
        chat_id: msg.chat.id,
        text: "✅ Unlocked! Enjoy unlimited games at JYB Mahjong 🀄",
      });
    }
    return c.json({ ok: true });
  }

  return c.json({ ok: true });
});
