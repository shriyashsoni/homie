/*
 * Custom hand-drawn icon set for Find My Homie.
 * Consistent 24×24 grid, 1.6 stroke, rounded joins — a single branded family,
 * not a generic icon-library look. Each takes { size, className, stroke }.
 */

function Svg({ size = 24, className = '', stroke = 1.6, children, fill = false }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke={fill ? 'none' : 'currentColor'}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* ─── Brand wordmark: approved "homie" lockup in Poppins 700, chilli red ───
 * The brand kit defines the header wordmark as Poppins 700 (not a standalone
 * symbol). Use <LogoImage/> where the full asset lockup fits. */
export function Wordmark({ className = '', style = {} }) {
  return (
    <span
      className={`font-display font-bold text-brand-500 tracking-[-0.02em] lowercase ${className}`}
      style={style}
    >
      homie
    </span>
  );
}

/* Original approved logo asset (public/logo.jpg) — used at larger sizes. */
export function LogoImage({ className = '', height = 28 }) {
  return (
    <img src="/logo.jpg" alt="homie" height={height} style={{ height }} className={`w-auto ${className}`} />
  );
}

/* Back-compat alias so older imports keep working. */
export function LogoMark({ size = 22, className = '' }) {
  return <Wordmark className={className} style={{ fontSize: size }} />;
}

/* ─── Intent / feature icons ─── */
export const IconRoom = (p) => (
  <Svg {...p}>
    <path d="M3 10.5 12 4l9 6.5" />
    <path d="M5 9.5V20h14V9.5" />
    <path d="M9.5 20v-5.5h5V20" />
    <path d="M14.5 14.5h.01" stroke="none" fill="currentColor" />
  </Svg>
);

export const IconHandshake = (p) => (
  <Svg {...p}>
    <path d="m11 17 2 2a1.4 1.4 0 0 0 2 0 1.4 1.4 0 0 0 0-2" />
    <path d="m13 17 2.5 2.5a1.4 1.4 0 0 0 2-2L15 15" />
    <path d="M3 10.5 7 7l4 3.5 2.5-1.5a2 2 0 0 1 2.3.3L21 13" />
    <path d="m3 10.5 3.5 3.5 2-1.2" />
    <path d="M21 7v6M3 7.5v4" />
  </Svg>
);

export const IconKey = (p) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="4.2" />
    <path d="m11 11 8.5 8.5" />
    <path d="m16 16 2-2M18.5 18.5 20.5 16.5" />
  </Svg>
);

export const IconShield = (p) => (
  <Svg {...p}>
    <path d="M12 3 5 6v5.5c0 4.3 2.9 7.6 7 9 4.1-1.4 7-4.7 7-9V6l-7-3Z" />
    <path d="m9 12 2 2 4-4.5" />
  </Svg>
);

export const IconSpark = (p) => (
  <Svg {...p}>
    <path d="M12 3.5c.4 3.9 1.6 5.1 5.5 5.5-3.9.4-5.1 1.6-5.5 5.5-.4-3.9-1.6-5.1-5.5-5.5 3.9-.4 5.1-1.6 5.5-5.5Z" />
    <path d="M18.5 15c.2 1.8.7 2.3 2.5 2.5-1.8.2-2.3.7-2.5 2.5-.2-1.8-.7-2.3-2.5-2.5 1.8-.2 2.3-.7 2.5-2.5Z" />
  </Svg>
);

export const IconChat = (p) => (
  <Svg {...p}>
    <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3.5V16H6a2 2 0 0 1-2-2V6Z" />
    <path d="M8.5 9h7M8.5 12h4" />
  </Svg>
);

export const IconCalendar = (p) => (
  <Svg {...p}>
    <rect x="4" y="5" width="16" height="15" rx="2.2" />
    <path d="M4 9.5h16M8.5 3v4M15.5 3v4" />
    <path d="M8 13.5h2M8 16.5h2M14 13.5h2" />
  </Svg>
);

export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.4-4.4" />
  </Svg>
);

export const IconPin = (p) => (
  <Svg {...p}>
    <path d="M12 21c4.5-4.6 7-7.8 7-11a7 7 0 1 0-14 0c0 3.2 2.5 6.4 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);

export const IconUsers = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6" />
    <path d="M17.5 13.6A5.5 5.5 0 0 1 20.5 19" />
  </Svg>
);

export const IconArrowRight = (p) => (
  <Svg {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </Svg>
);

export const IconCheck = (p) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 6.5" />
  </Svg>
);

export const IconStar = ({ size = 16, className = '', filled = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6"
    strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 3.5l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 17.6 6.7 20l1.1-6L3.4 9.8l6-.8L12 3.5Z" />
  </svg>
);

/* ─── Lifestyle / compatibility dimension icons ─── */
export const IconMoon = (p) => (
  <Svg {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /></Svg>
);
export const IconUtensils = (p) => (
  <Svg {...p}><path d="M5 3v7a2 2 0 0 0 4 0V3M7 10v11M15 3c-1.5 1-2.5 3-2.5 5.5 0 1.8 1 2.8 2.5 3V21" /></Svg>
);
export const IconBroom = (p) => (
  <Svg {...p}><path d="m14 4-5 5M19 9l-8 8-5-1 1-5 8-8a1.4 1.4 0 0 1 2 0l2 2a1.4 1.4 0 0 1 0 2ZM6 16l-2 4 4-2" /></Svg>
);
export const IconLock = (p) => (
  <Svg {...p}><rect x="5" y="10.5" width="14" height="10" rx="2.2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5" /></Svg>
);
export const IconWallet = (p) => (
  <Svg {...p}><path d="M4 7.5A2 2 0 0 1 6 5.5h11a1.5 1.5 0 0 1 1.5 1.5V9M4 7.5V17a2 2 0 0 0 2 2h12a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5H6A2 2 0 0 1 4 8.5Z" /><circle cx="16" cy="13.5" r="1" fill="currentColor" stroke="none" /></Svg>
);
export const IconClock = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>
);

/* ─── Social icons ─── */
export const IconInstagram = (p) => (
  <Svg {...p}><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.6" /><circle cx="17" cy="7" r="0.6" fill="currentColor" stroke="none" /></Svg>
);
export const IconTwitter = (p) => (
  <Svg {...p}><path d="M20 6.5c-.6.3-1.3.5-2 .6a3.4 3.4 0 0 0 1.5-1.9c-.7.4-1.4.7-2.2.8a3.4 3.4 0 0 0-5.8 3.1A9.7 9.7 0 0 1 4.5 5.6a3.4 3.4 0 0 0 1 4.5c-.5 0-1-.2-1.5-.4a3.4 3.4 0 0 0 2.7 3.4c-.5.1-1 .2-1.5 0a3.4 3.4 0 0 0 3.2 2.4A6.8 6.8 0 0 1 4 17.3 9.6 9.6 0 0 0 9.2 19c6.2 0 9.7-5.3 9.5-10 .7-.5 1.2-1.1 1.7-1.8Z" /></Svg>
);
export const IconLinkedin = (p) => (
  <Svg {...p}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 10.5V16M8 7.5v.01" /><path d="M12 16v-3a2 2 0 0 1 4 0v3M12 10.5V16" /></Svg>
);

/* ─────────────────────────────────────────────────────────
 * RoomArtwork — custom minimal interior line illustration.
 * Replaces flat gradient placeholders on listing cards with
 * a crafted, hand-drawn scene tinted to the area's hue.
 * ───────────────────────────────────────────────────────── */
export function RoomArtwork({ tint = '#C41E1E', className = '' }) {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`sky-${tint}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tint} stopOpacity="0.22" />
          <stop offset="1" stopColor={tint} stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#sky-${tint})`} />
      {/* floor line */}
      <path d="M0 140 H320" stroke={tint} strokeOpacity="0.28" strokeWidth="1.4" />
      {/* window */}
      <g stroke={tint} strokeOpacity="0.55" strokeWidth="2" fill="none" strokeLinejoin="round">
        <rect x="186" y="30" width="96" height="74" rx="4" />
        <path d="M234 30v74M186 67h96" />
      </g>
      {/* sun */}
      <circle cx="258" cy="52" r="8" fill={tint} fillOpacity="0.5" />
      {/* bed */}
      <g stroke={tint} strokeOpacity="0.6" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round">
        <path d="M26 140v-22h74a10 10 0 0 1 10 10v12" />
        <path d="M26 124h18a6 6 0 0 1 6 6v4" />
        <path d="M22 140v8M114 140v8" />
      </g>
      {/* plant */}
      <g stroke={tint} strokeOpacity="0.6" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M150 140v-14" />
        <path d="M150 130c-6-2-9-7-8-13 6 1 10 6 8 13Z" fill={tint} fillOpacity="0.14" />
        <path d="M150 128c5-3 7-9 5-15-6 2-9 8-5 15Z" fill={tint} fillOpacity="0.14" />
        <path d="M143 140h14l-1.5 6h-11L143 140Z" />
      </g>
      {/* framed picture */}
      <rect x="150" y="44" width="22" height="28" rx="2" stroke={tint} strokeOpacity="0.45" strokeWidth="2" fill="none" />
    </svg>
  );
}
