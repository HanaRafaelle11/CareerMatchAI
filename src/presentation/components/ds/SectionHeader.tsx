import { type ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: { label: string; onClick: () => void; icon?: ReactNode };
  badge?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, icon, action, badge, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-lg ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-on-surface tracking-tight truncate">{title}</h2>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-on-surface-variant mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline cursor-pointer shrink-0"
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </div>
  );
}
