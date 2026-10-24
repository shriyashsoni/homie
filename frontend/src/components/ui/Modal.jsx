import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative bg-card rounded-3xl shadow-elevated border border-charcoal/[0.06] w-full ${widths[size]} max-h-[90vh] overflow-y-auto animate-fade-up`}>
        {title && (
          <div className="flex items-center justify-between p-5 rule-b">
            <h2 className="font-display text-lg font-bold text-charcoal">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-xl text-clay hover:bg-sand hover:text-charcoal transition-colors">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
