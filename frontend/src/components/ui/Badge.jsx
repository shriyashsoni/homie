const colors = {
  green:  'bg-olive/12 text-olive',
  red:    'bg-brand-50 text-brand-600',
  orange: 'bg-honey/15 text-[#9A6B10]',
  blue:   'bg-slate/12 text-slate',
  gray:   'bg-sand text-clay',
  brand:  'bg-brand-50 text-brand-600',
  purple: 'bg-slate/12 text-slate',
};

export default function Badge({ children, color = 'gray', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold ${colors[color]} ${className}`}>
      {children}
    </span>
  );
}
