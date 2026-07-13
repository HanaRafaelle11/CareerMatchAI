import { type ReactNode } from 'react';

interface ProgressRingProps {
  value: number;           // 0-100
  size?: number;           // px
  strokeWidth?: number;
  color?: string;          // tailwind color class
  bgColor?: string;
  label?: ReactNode;
  showValue?: boolean;
  className?: string;
}

export function ProgressRing({
  value,
  size = 48,
  strokeWidth = 4,
  color = 'stroke-primary',
  bgColor = 'stroke-surface-container-high',
  label,
  showValue = true,
  className = ''
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && !label && (
          <span className="text-on-surface font-bold" style={{ fontSize: Math.max(9, size * 0.28) }}>
            {Math.round(value)}%
          </span>
        )}
        {label}
      </div>
    </div>
  );
}
