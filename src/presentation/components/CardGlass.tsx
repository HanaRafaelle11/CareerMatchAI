import React from 'react';

interface CardGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: 'brand' | 'violet' | 'blue' | 'none';
}

export function CardGlass({ children, className = '', ...props }: CardGlassProps) {
  return (
    <div
      className={`w-full bg-white dark:bg-[#242B36] border border-slate-200/80 dark:border-white/8 rounded-2xl p-6 shadow-xs hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-150 ease-out ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
