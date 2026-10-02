import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(9).max(30),
  qty: z.number().int().min(1).max(1000),
  total: z.number().int().min(0).max(1000000),
});

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const sendOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
    const TELEGRAM_API_KEY = process.env["TELEGRAM_API_KEY"];
    const CHAT_ID = process.env["TELEGRAM_CHAT_ID"];
    if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY || !CHAT_ID) {
      console.error("Telegram is not configured");
      return { ok: false };
    }
    const text =
      `🛒 <b>Нове замовлення</b>\n\n` +
      `👤 Ім'я: ${esc(data.name)}\n` +
      `📞 Телефон: ${esc(data.phone)}\n` +
      `📦 Кількість: ${data.qty} шт\n` +
      `💰 Сума: ${data.total} ₴`;
    const res = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML" }),
    });
    if (!res.ok) {
      console.error(`Telegram failed [${res.status}]: ${await res.text()}`);
      return { ok: false };
    }
    return { ok: true };
  });
