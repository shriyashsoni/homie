import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, icon: Icon, hint, className = '', ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-charcoal mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay/70">
            <Icon size={16} />
          </span>
        )}
        <input
          ref={ref}
          className={`
            w-full h-12 px-4 rounded-xl border text-sm transition-all duration-150
            bg-card text-charcoal placeholder-clay/50
            focus:outline-none focus:ring-2
            ${Icon ? 'pl-10' : ''}
            ${error
              ? 'border-brand-400 focus:ring-brand-500/15'
              : 'border-charcoal/12 hover:border-charcoal/25 focus:border-brand-500 focus:ring-brand-500/15'
            }
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-brand-600">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-clay">{hint}</p>}
    </div>
  );
});

export default Input;
