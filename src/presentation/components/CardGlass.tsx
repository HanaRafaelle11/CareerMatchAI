import React from 'react';

interface CardGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: 'brand' | 'violet' | 'blue' | 'none';
}

export function CardGlass({ children, className = '', ...props }: CardGlassProps) {
  return (
    <div
      className={`w-full min-w-0 font-sans bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-xs hover:-translate-y-0.5 hover:border-border/80 transition-all duration-150 ease-out ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
