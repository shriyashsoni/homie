import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';

/*
 * International location autocomplete via OpenStreetMap Nominatim.
 * Works for any city / area / country. Debounced to respect the usage policy.
 * Props: value, onChange(text), onSelect({ label, area, city, country, lat, lon }), placeholder
 */
function parse(item) {
  const a = item.address || {};
  const area = a.suburb || a.neighbourhood || a.city_district || a.village || a.town || '';
  const city = a.city || a.town || a.municipality || a.state_district || a.state || '';
  const country = a.country || '';
  const label = [area, city, country].filter(Boolean).join(', ') || item.display_name;
  return { label, area: area || city, city: city || area, country, lat: item.lat, lon: item.lon };
}

export default function LocationSearch({ value = '', onChange, onSelect, placeholder = 'Search any city or area…' }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!query || query.trim().length < 3) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, { signal: abortRef.current.signal, headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        setResults(Array.isArray(data) ? data.map(parse) : []);
        setOpen(true);
      } catch { /* aborted or offline */ }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const choose = (r) => {
    setQuery(r.label);
    onChange?.(r.label);
    onSelect?.(r);
    setOpen(false);
  };

  const clear = () => { setQuery(''); onChange?.(''); onSelect?.(null); setResults([]); };

  return (
    <div className="relative" ref={boxRef}>
      <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" />
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange?.(e.target.value); }}
        onFocus={() => results.length && setOpen(true)}
        placeholder={placeholder}
        className="w-full h-12 pl-10 pr-9 rounded-xl border border-charcoal/12 bg-card text-sm text-charcoal placeholder-clay/55 focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 transition-all"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {loading ? <Loader2 size={15} className="animate-spin text-clay" />
          : query ? <button type="button" onClick={clear} className="text-clay hover:text-charcoal"><X size={15} /></button>
          : null}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1.5 w-full bg-card border border-charcoal/10 rounded-2xl shadow-elevated overflow-hidden max-h-72 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => choose(r)}
              className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left hover:bg-sand/50 transition-colors"
            >
              <MapPin size={14} className="text-clay mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-charcoal font-medium truncate">{r.area || r.city}</p>
                <p className="text-2xs text-clay truncate">{r.label}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
