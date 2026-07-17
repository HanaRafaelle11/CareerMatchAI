interface SkillChipProps {
  name: string;
  level?: 1 | 2 | 3 | 4 | 5;
  category?: 'hard' | 'soft' | 'tool' | 'method' | 'language';
  size?: 'sm' | 'md';
  className?: string;
}

const categoryStyles: Record<string, string> = {
  hard: 'border-blue-450/25 bg-blue-500/5 text-blue-400 light:border-primary/25 light:bg-primary/5 light:text-primary',
  soft: 'border-indigo-450/25 bg-indigo-500/5 text-indigo-400 light:border-secondary/25 light:bg-secondary/5 light:text-secondary',
  tool: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-400 light:text-emerald-600',
  method: 'border-amber-500/25 bg-amber-500/5 text-amber-400 light:text-amber-700',
  language: 'border-emerald-400/25 bg-emerald-400/5 text-emerald-400 light:text-emerald-700',
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
      className={`inline-flex items-center gap-1.5 rounded-lg border font-medium ${style} ${sizeClass} ${className}`}
      title={levelText ? `${name} - Nível: ${levelText}` : name}
    >
      <span className="truncate max-w-[140px]">{name}</span>
      {level && (
        <span className="flex items-center gap-px shrink-0">
          {[1, 2, 3, 4, 5].map(i => (
            <span
              key={i}
              className={`w-1 h-1 rounded-full ${i <= level ? 'bg-current opacity-90' : 'bg-current opacity-20'}`}
            />
          ))}
        </span>
      )}
    </span>
  );
}
