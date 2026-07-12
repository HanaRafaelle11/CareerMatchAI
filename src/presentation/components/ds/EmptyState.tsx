import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary mb-5">
        {icon}
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-2 text-lg">{title}</h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm leading-relaxed mb-6">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-xl shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all cursor-pointer text-sm"
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </div>
  );
}
