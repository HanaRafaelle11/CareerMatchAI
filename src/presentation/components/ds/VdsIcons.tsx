import React from 'react';
import {
  Search,
  Brain,
  Target,
  FileText,
  ScanSearch,
  MessagesSquare,
  LayoutDashboard,
  Briefcase,
  Columns3,
  BarChart3,
  Trophy,
  ShieldCheck,
  LogIn,
  UserRound,
  Building2,
  BriefcaseBusiness,
  Bot,
  Sparkles,
  TrendingUp,
  Crown,
  BadgeCheck,
  LifeBuoy
} from 'lucide-react';

export type LucideIconComponent = React.ComponentType<{ 
  size?: number | string; 
  strokeWidth?: number | string; 
  className?: string 
}>;

export interface BrandIconProps {
  icon: LucideIconComponent;
  size?: number;
  strokeWidth?: number;
  className?: string;
  containerClassName?: string;
  variant?: 'brand' | 'accent' | 'subtle' | 'warning';
}

/**
 * Vocentro Design System (VDS) - Container Base de Ícone Proprietário
 */
export const BrandIcon: React.FC<BrandIconProps> = ({
  icon: IconComponent,
  size = 20,
  strokeWidth = 1.75,
  className = '',
  containerClassName = '',
  variant = 'brand'
}) => {
  const variantStyles = {
    brand: 'bg-brand-500/10 border-brand-500/20 text-brand-400 dark:text-brand-400 light:text-brand-600',
    accent: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 dark:text-emerald-400 light:text-emerald-600',
    subtle: 'bg-slate-800/50 border-slate-700/50 text-slate-300 dark:text-slate-300 light:text-slate-700',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400 dark:text-amber-400 light:text-amber-600'
  };

  return (
    <div
      className={`inline-flex items-center justify-center p-2 rounded-[12px] border shadow-xs transition-colors shrink-0 ${variantStyles[variant]} ${containerClassName}`}
    >
      <IconComponent size={size} strokeWidth={strokeWidth} className={className} />
    </div>
  );
};

/* Specialized VDS Component Wrappers for Domain Consistency */

export const FeatureIcon: React.FC<{ icon: LucideIconComponent; size?: number; variant?: 'brand' | 'accent' | 'subtle' }> = ({
  icon,
  size = 20,
  variant = 'brand'
}) => <BrandIcon icon={icon} size={size} variant={variant} />;

export const MetricIcon: React.FC<{ icon?: LucideIconComponent; size?: number }> = ({ icon = Trophy, size = 18 }) => (
  <BrandIcon icon={icon} size={size} variant="accent" />
);

export const StepIcon: React.FC<{ icon: LucideIconComponent; size?: number }> = ({ icon, size = 18 }) => (
  <BrandIcon icon={icon} size={size} variant="brand" />
);

export const SecurityIcon: React.FC<{ icon?: LucideIconComponent; size?: number }> = ({ icon = ShieldCheck, size = 18 }) => (
  <BrandIcon icon={icon} size={size} variant="brand" />
);

export const PremiumBadge: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <BrandIcon icon={Crown} size={size} variant="warning" />
);

/* Mapa Oficial de Ícones da Marca Vocentro */
export const VdsMap = {
  Search,
  Brain,
  Target,
  FileText,
  ScanSearch,
  MessagesSquare,
  LayoutDashboard,
  Briefcase,
  Columns3,
  BarChart3,
  Trophy,
  ShieldCheck,
  LogIn,
  UserRound,
  Building2,
  BriefcaseBusiness,
  Bot,
  Sparkles,
  TrendingUp,
  Crown,
  BadgeCheck,
  LifeBuoy
};
