import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Meta webhook verification (GET).
http.route({
  path: "/whatsapp/webhook",
  method: "GET",
  handler: httpAction(async (_ctx, req) => {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const challenge = url.searchParams.get("hub.challenge");
    const verify = url.searchParams.get("hub.verify_token");
    if (mode === "subscribe" && verify === process.env.WHATSAPP_VERIFY_TOKEN) {
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }),
});

// Incoming WhatsApp messages (POST).
http.route({
  path: "/whatsapp/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body: any = await req.json();
      const value = body?.entry?.[0]?.changes?.[0]?.value;
      const msg = value?.messages?.[0];
      if (msg && msg.type === "text" && msg.from) {
        const reply = await ctx.runAction(internal.agent.handleMessage, {
          phone: msg.from,
          text: msg.text?.body ?? "",
        });
        await ctx.runAction(internal.whatsapp.sendWhatsApp, { to: msg.from, text: reply });
      }
    } catch (e) {
      console.error("webhook error", e);
    }
    // Always 200 so Meta doesn't retry endlessly.
    return new Response("OK", { status: 200 });
  }),
});

export default http;
