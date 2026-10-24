/* Simple gender glyphs for same-gender roommate matching. */
export const IconMale = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="10" cy="14" r="5" /><path d="M14 10 20 4M15 4h5v5" />
  </svg>
);
export const IconFemale = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="9" r="5" /><path d="M12 14v7M9 18h6" />
  </svg>
);
