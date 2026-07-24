import { type ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'premium';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-500/10 text-[#22C7A8] border-emerald-200/80 dark:border-emerald-800/80',
  warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/80',
  error: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200/80 dark:border-red-800/80',
  info: 'bg-blue-50 dark:bg-blue-500/10 text-[#4F8EF7] border-blue-200/80 dark:border-blue-800/80',
  neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  premium: 'bg-blue-50 dark:bg-blue-500/10 text-[#4F8EF7] border-blue-200/80 dark:border-blue-800/80',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-[#22C7A8]',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-[#4F8EF7]',
  neutral: 'bg-slate-400',
  premium: 'bg-[#4F8EF7]',
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
