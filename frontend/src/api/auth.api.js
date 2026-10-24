// Auth API backed by Convex. Returns the axios-style shape the app expects:
//   register/login → { data: { data: { user, accessToken, refreshToken } } }
//   getMe          → { data: { data: { user } } }
import { convex, api, qPublic, aPublic, getToken } from './convex';

export const authApi = {
  register: async (data) => {
    const res = await convex.action(api.auth.signUp, {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName || undefined,
      phone: data.phone || undefined,
      intent: data.intent || undefined,
    });
    return { data: { data: { user: res.user, accessToken: res.token, refreshToken: res.token } } };
  },

  login: async (data) => {
    const res = await convex.action(api.auth.signIn, { email: data.email, password: data.password });
    return { data: { data: { user: res.user, accessToken: res.token, refreshToken: res.token } } };
  },

  googleLogin: async (idToken) => {
    const res = await convex.action(api.auth.googleSignIn, { idToken });
    return { data: { data: { user: res.user, accessToken: res.token, refreshToken: res.token } } };
  },

  logout: async () => {
    const token = getToken();
    if (token) { try { await convex.mutation(api.auth.signOut, { token }); } catch {} }
    return { data: { data: { ok: true } } };
  },

  getMe: async () => {
    const user = await convex.query(api.auth.me, { token: getToken() });
    return { data: { data: { user } } };
  },

  // Not yet implemented on Convex — resolve gracefully so UI flows don't break.
  refreshToken: async () => ({ data: { data: {} } }),
  forgotPassword: async () => ({ data: { data: { ok: true } } }),
  resetPassword: async () => ({ data: { data: { ok: true } } }),
  verifyEmail: async () => ({ data: { data: { ok: true } } }),
  resendVerification: async () => ({ data: { data: { ok: true } } }),
};
