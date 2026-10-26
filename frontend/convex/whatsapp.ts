import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/** Send a WhatsApp text via the Meta Cloud API. */
export const sendWhatsApp = internalAction({
  args: { to: v.string(), text: v.string() },
  handler: async (_ctx, { to, text }) => {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const version = process.env.WHATSAPP_API_VERSION || "v21.0";
    if (!token || !phoneId) { console.error("WhatsApp not configured"); return { ok: false }; }
    const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
    });
    if (!res.ok) console.error("WhatsApp send failed", res.status, await res.text());
    return { ok: res.ok };
  },
});

/** Test the agent without a live WhatsApp number — returns the reply text. */
export const simulate = action({
  args: { phone: v.string(), text: v.string() },
  handler: async (ctx, { phone, text }): Promise<{ reply: string }> => {
    const reply = await ctx.runAction(internal.agent.handleMessage, { phone, text });
    return { reply };
  },
});
