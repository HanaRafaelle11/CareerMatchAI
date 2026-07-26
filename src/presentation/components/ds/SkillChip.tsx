import React from 'react';

interface SkillChipProps {
  name: string;
  level?: 1 | 2 | 3 | 4 | 5;
  category?: 'hard' | 'soft' | 'tool' | 'method' | 'language';
  size?: 'sm' | 'md';
  className?: string;
}

const categoryStyles: Record<string, string> = {
  hard: 'border-indigo-500/35 bg-indigo-500/15 text-indigo-300 dark:text-indigo-200 light:text-indigo-900 font-semibold',
  soft: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300 dark:text-emerald-200 light:text-emerald-900 font-semibold',
  tool: 'border-cyan-500/35 bg-cyan-500/15 text-cyan-300 dark:text-cyan-200 light:text-cyan-900 font-semibold',
  method: 'border-amber-500/35 bg-amber-500/15 text-amber-300 dark:text-amber-200 light:text-amber-900 font-semibold',
  language: 'border-purple-500/35 bg-purple-500/15 text-purple-300 dark:text-purple-200 light:text-purple-900 font-semibold',
};

const levelNames: Record<number, string> = {
  1: 'Iniciante',
  2: 'Básico',
  3: 'Intermediário',
  4: 'Avançado',
  5: 'Especialista'
};

export function SkillChip({ name, level, category = 'hard', size = 'md', className = '' }: SkillChipProps) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  const style = categoryStyles[category] || categoryStyles.hard;
  const levelText = level ? (levelNames[level] || `Nível ${level}`) : '';

  return (
    <span 
      className={`inline-flex items-center gap-1.5 rounded-lg border shadow-xs ${style} ${sizeClass} ${className}`}
      title={levelText ? `${name} - Nível: ${levelText}` : name}
    >
      <span className="truncate max-w-[160px]">{name}</span>
      {level && (
        <span className="flex items-center gap-px shrink-0">
          {[1, 2, 3, 4, 5].map(i => (
            <span
              key={i}
              className={`w-1 h-1 rounded-full ${i <= level ? 'bg-current opacity-90' : 'bg-current opacity-25'}`}
            />
          ))}
        </span>
      )}
    </span>
  );
}
