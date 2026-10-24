export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-sand rounded-3xl flex items-center justify-center mb-4">
          <Icon size={28} className="text-clay" />
        </div>
      )}
      <h3 className="font-display text-lg font-bold text-charcoal mb-2">{title}</h3>
      {description && <p className="text-sm text-clay max-w-xs mb-5 leading-relaxed">{description}</p>}
      {action}
    </div>
  );
}
