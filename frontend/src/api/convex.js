// Thin adapter: call Convex functions imperatively and return data in the
// axios-compatible shape ({ data: { data: <result> } }) the pages already read.
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const url = import.meta.env.VITE_CONVEX_URL;
if (!url) console.warn("VITE_CONVEX_URL is not set — Convex calls will fail.");

export const convex = new ConvexHttpClient(url);
export { api };

export const getToken = () => localStorage.getItem("fmh_token") || undefined;

const wrap = (result) => ({ data: { data: result } });

/** query with auto-injected token */
export const q = async (fn, args = {}) => wrap(await convex.query(fn, { token: getToken(), ...args }));
/** mutation with auto-injected token */
export const m = async (fn, args = {}) => wrap(await convex.mutation(fn, { token: getToken(), ...args }));
/** action with auto-injected token */
export const a = async (fn, args = {}) => wrap(await convex.action(fn, { token: getToken(), ...args }));
/** query/mutation without a token (public auth calls) */
export const qPublic = async (fn, args = {}) => wrap(await convex.query(fn, args));
export const aPublic = async (fn, args = {}) => wrap(await convex.action(fn, args));
