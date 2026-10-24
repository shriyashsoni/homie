/*
 * Real, licensed stock photography wired into the app.
 * - Room interiors: Unsplash CDN (verified photo IDs), sized on the fly.
 * - People portraits: randomuser.me (real faces, gendered, stable paths).
 * These load on localhost / any normal host. Swap or reshuffle freely —
 * change an id below and the whole UI updates.
 */

/* Unsplash sizing helper */
const U = (id, w = 800, h = 600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&crop=entropy&q=72&auto=format`;

/* ── Verified interior photos (bedrooms / living rooms / apartments) ── */
export const ROOM_IDS = [
  '1522708323590-d24dbb6b0267', // fallbacks replaced below if needed
];

/* Curated, verified Unsplash interior IDs */
const INTERIORS = [
  '1552858725-a19e7fcd3ac4',
  '1499916078039-922301b0eb9b',
  '1552558636-f6a8f071c2b3',
  '1541004995602-b3e898709909',
  '1616418928117-4e6d19be2df1',
  '1622429420441-60dd67f737a6',
  '1583847268964-b28dc8f51f92',
  '1613575831056-0acd5da8f085',
  '1600493505873-cddd69453072',
  '1612419299101-6c294dc2901d',
];

export const roomPhoto = (i, w = 800, h = 560) => U(INTERIORS[i % INTERIORS.length], w, h);

/* Deterministic photo for a real listing (by id/index) so Discover looks real */
export const photoForListing = (seed, w = 800, h = 560) => {
  const n = typeof seed === 'number'
    ? seed
    : String(seed || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return U(INTERIORS[n % INTERIORS.length], w, h);
};

/* A wide, bright interior for hero / banners */
export const heroRoom = (w = 1100, h = 900) => U('1600493505873-cddd69453072', w, h);
export const ctaRoom  = (w = 1200, h = 500) => U('1583847268964-b28dc8f51f92', w, h);

/* ── People portraits (randomuser.me — real faces) ── */
export const portrait = (gender, n) =>
  `https://randomuser.me/api/portraits/${gender === 'f' ? 'women' : 'men'}/${n}.jpg`;

/* Deterministic, stable avatar for any user/person object.
 * Uses a real uploaded avatar if present, else a consistent real portrait. */
export const avatarFor = (person = {}) => {
  if (person?.avatarUrl) return person.avatarUrl;
  if (person?.img) return person.img;
  const name = (person?.firstName || person?.name || 'homie').toString();
  const key  = (person?.id || person?.email || name).toString();
  const h = key.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return portrait(h % 2 ? 'f' : 'm', h % 90);
};

/* Named demo people used across the landing page */
export const PEOPLE = {
  ananya:  { name: 'Ananya N.', age: 26, role: 'Product Designer',   area: 'Koramangala', img: portrait('f', 68) },
  priya:   { name: 'Priya M.',  age: 27, role: 'UX Designer',        area: 'Koramangala', img: portrait('f', 44) },
  deepika: { name: 'Deepika S.',age: 24, role: 'MBA · IIM Bangalore',area: 'HSR Layout',  img: portrait('f', 65) },
  meera:   { name: 'Meera R.',  age: 25, role: 'Marketing Lead',     area: 'Indiranagar', img: portrait('f', 12) },
  rahul:   { name: 'Rahul K.',  age: 28, role: 'Software Engineer',  area: 'Indiranagar', img: portrait('m', 32) },
  vikram:  { name: 'Vikram M.', age: 29, role: 'Data Scientist',     area: 'Bellandur',   img: portrait('m', 75) },
  arjun:   { name: 'Arjun P.',  age: 26, role: 'Founder',            area: 'HSR Layout',  img: portrait('m', 45) },
  karthik: { name: 'Karthik V.',age: 27, role: 'Finance Analyst',    area: 'BTM Layout',  img: portrait('m', 11) },
};
