import { Loader2 } from 'lucide-react';

const variants = {
  primary:   'bg-brand-500 text-white hover:bg-brand-600 shadow-sm hover:shadow-md',
  dark:      'bg-charcoal text-white hover:bg-ink shadow-sm',
  outline:   'border border-charcoal/15 text-charcoal bg-transparent hover:border-charcoal/35 hover:bg-charcoal/[0.03]',
  ghost:     'text-clay hover:bg-sand/70 hover:text-charcoal',
  secondary: 'bg-sand text-charcoal hover:bg-sand/70',
  danger:    'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
};

const sizes = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export default function Button({
  children, variant = 'primary', size = 'md',
  loading, disabled, className = '', ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold rounded-full
        transition-all duration-150 active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}
