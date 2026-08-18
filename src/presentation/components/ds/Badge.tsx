import { type ReactNode } from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'processing' | 'premium';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  info: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-[#4F8EF7] border-blue-200/90 dark:border-blue-500/30',
  warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-200/90 dark:border-amber-500/30',
  success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-[#22C7A8] border-emerald-200/90 dark:border-emerald-500/30',
  error: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200/90 dark:border-rose-500/30',
  neutral: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80',
  processing: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 animate-pulse',
  premium: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200/90 dark:border-indigo-500/30',
};

const dotColors: Record<BadgeVariant, string> = {
  info: 'bg-[#4F8EF7]',
  warning: 'bg-amber-500',
  success: 'bg-[#22C7A8]',
  error: 'bg-rose-500',
  neutral: 'bg-slate-400',
  processing: 'bg-slate-400 animate-ping',
  premium: 'bg-indigo-500',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'h-5 text-[10px] px-1.5 gap-1 font-medium',
  md: 'h-6 text-xs px-2 gap-1.5 font-medium',
  lg: 'h-7 text-xs px-2.5 gap-1.5 font-medium',
};

export function Badge({ children, variant = 'neutral', size = 'md', icon, dot, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} shrink-0`} />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
