import { useState } from 'react';
import { RoomArtwork } from '../icons';

/* Real interior photography with graceful fallback to hand-drawn artwork. */
export function img(id, w = 640) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;
}

export default function RoomPhoto({ id, tint = '#C41E1E', className = '', alt = '' }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <RoomArtwork tint={tint} className={className} />;
  return (
    <img
      src={img(id)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`w-full h-full object-cover ${className}`}
    />
  );
}
