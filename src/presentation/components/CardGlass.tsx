import React from 'react';

interface CardGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: 'brand' | 'violet' | 'blue' | 'none';
}

export function CardGlass({ children, glowColor = 'none', className = '', ...props }: CardGlassProps) {
  const glowClasses = {
    brand: 'glow-brand',
    violet: 'glow-violet',
    blue: 'glow-blue',
    none: ''
  };

  return (
    <div
      className={`glass-panel p-6 rounded-2xl transition-all duration-300 hover:border-slate-700/60 dark:hover:border-slate-700/80 ${glowClasses[glowColor]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
