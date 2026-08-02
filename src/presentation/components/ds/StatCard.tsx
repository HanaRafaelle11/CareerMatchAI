import { type ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean } | null;
  action?: { label: string; onClick: () => void };
  accent?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning';
  className?: string;
  isLoading?: boolean;
}

const accentBg: Record<string, string> = {
  primary: 'bg-blue-50 dark:bg-white/5 text-[#4F8EF7]',
  secondary: 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-[#B8C2CC]',
  tertiary: 'bg-emerald-50 dark:bg-emerald-500/10 text-[#22C7A8]',
  success: 'bg-emerald-50 dark:bg-emerald-500/10 text-[#22C7A8]',
  warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

export function StatCard({ icon, label, value, trend, action, accent = 'primary', className = '', isLoading = false }: StatCardProps) {
  const handleClick = () => {
    if (action?.onClick) {
      action.onClick();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`bg-white dark:bg-[#242B36] border border-slate-200/90 dark:border-white/8 rounded-2xl p-5 shadow-xs transition-all duration-150 group ${action ? 'cursor-pointer hover:border-slate-300 dark:hover:border-white/15' : ''} ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentBg[accent]}`}>
          {icon}
        </div>
        {trend && !isLoading && (
          <span className={`text-[11px] font-semibold ${trend.positive ? 'text-[#22C7A8]' : 'text-red-500'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
        {isLoading && <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />}
      </div>

      {isLoading ? (
        /* Skeleton placeholder — evita piscar de "0" → valor real (Item 9) */
        <div className="h-7 w-12 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse mb-1.5" />
      ) : (
        <p className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight mb-0.5">{value}</p>
      )}

      <p className="text-xs text-slate-500 dark:text-[#B8C2CC] font-medium">{label}</p>
      {action && !isLoading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          className="mt-2 text-xs text-[#4F8EF7] font-medium hover:underline cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
        >
          <span>{action.label}</span>
          <span>→</span>
        </button>
      )}
    </div>
  );
}
