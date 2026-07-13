import { type ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean } | null;
  action?: { label: string; onClick: () => void };
  accent?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning';
  className?: string;
}

const accentBg: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  tertiary: 'bg-tertiary/10 text-tertiary',
  success: 'bg-emerald-500/10 text-emerald-400 light:text-emerald-600',
  warning: 'bg-amber-500/10 text-amber-400 light:text-amber-700',
};

export function StatCard({ icon, label, value, trend, action, accent = 'primary', className = '' }: StatCardProps) {
  const handleClick = () => {
    if (action?.onClick) {
      action.onClick();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`premium-card rounded-xl p-lg group ${action ? 'cursor-pointer hover:border-slate-800 transition-all hover:scale-[1.01] active:scale-[0.99]' : ''} ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accentBg[accent]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-bold ${trend.positive ? 'text-emerald-400 light:text-emerald-600' : 'text-red-400 light:text-red-600'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-on-surface tracking-tight mb-0.5">{value}</p>
      <p className="text-xs text-on-surface-variant font-medium">{label}</p>
      {action && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          className="mt-3 text-xs text-primary font-semibold hover:underline cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {action.label} →
        </button>
      )}
    </div>
  );
}
