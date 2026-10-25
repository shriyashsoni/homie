import { ConvexReactClient } from "convex/react";

// Reactive client for live subscriptions (real-time chat, inbox).
const url = import.meta.env.VITE_CONVEX_URL || "https://chatty-flamingo-542.convex.cloud";

export const convexReact = new ConvexReactClient(url);
