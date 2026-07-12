interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'avatar' | 'stat' | 'list';
  lines?: number;
  className?: string;
}

function Pulse({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-surface-container-high ${className}`} />
  );
}

export function SkeletonLoader({ variant = 'card', lines = 3, className = '' }: SkeletonLoaderProps) {
  if (variant === 'text') {
    return (
      <div className={`space-y-2.5 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <Pulse key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    );
  }

  if (variant === 'avatar') {
    return <Pulse className={`w-10 h-10 rounded-full ${className}`} />;
  }

  if (variant === 'stat') {
    return (
      <div className={`premium-card rounded-xl p-lg space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <Pulse className="w-9 h-9 rounded-lg" />
          <Pulse className="w-10 h-3" />
        </div>
        <Pulse className="w-16 h-7" />
        <Pulse className="w-24 h-3" />
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Pulse className="w-8 h-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Pulse className="h-3 w-3/4" />
              <Pulse className="h-2.5 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: card
  return (
    <div className={`premium-card rounded-xl p-lg space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Pulse className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Pulse className="h-4 w-2/3" />
          <Pulse className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Pulse key={i} className={`h-3 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
        ))}
      </div>
    </div>
  );
}
