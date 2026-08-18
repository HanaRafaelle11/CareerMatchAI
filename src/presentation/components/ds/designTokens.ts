/**
 * Vocentro Design System - Centralized Design Tokens (VDS)
 *
 * Centralizes standard spacing, radius, typography scale,
 * 8-state component matrix, and the unified 5-state visual system.
 */

export const VDS_SPACING = {
  xs: '4px',    // 1 (0.25rem)
  sm: '8px',    // 2 (0.5rem)
  md: '12px',   // 3 (0.75rem)
  lg: '16px',   // 4 (1rem)
  xl: '24px',   // 6 (1.5rem)
  '2xl': '32px' // 8 (2rem)
} as const;

export const VDS_RADIUS = {
  sm: '8px',    // rounded-lg / rounded-md
  md: '12px',   // rounded-xl
  lg: '16px',   // rounded-2xl
  full: '9999px' // rounded-full
} as const;

export const VDS_TYPOGRAPHY = {
  h1: {
    fontSize: '1.875rem', // 30px
    lineHeight: '2.25rem',
    fontWeight: '700',
    className: 'text-2xl sm:text-3xl font-bold tracking-tight'
  },
  h2: {
    fontSize: '1.5rem', // 24px
    lineHeight: '2rem',
    fontWeight: '700',
    className: 'text-xl sm:text-2xl font-bold tracking-tight'
  },
  h3: {
    fontSize: '1.125rem', // 18px
    lineHeight: '1.75rem',
    fontWeight: '600',
    className: 'text-base sm:text-lg font-semibold'
  },
  body: {
    fontSize: '0.875rem', // 14px
    lineHeight: '1.25rem',
    fontWeight: '400',
    className: 'text-xs sm:text-sm font-normal leading-relaxed'
  },
  caption: {
    fontSize: '0.75rem', // 12px
    lineHeight: '1rem',
    fontWeight: '400',
    className: 'text-xs font-normal'
  },
  label: {
    fontSize: '0.6875rem', // 11px
    lineHeight: '0.875rem',
    fontWeight: '700',
    className: 'text-[11px] font-bold uppercase tracking-wider'
  }
} as const;

export const VDS_COMPONENT_STATES = {
  default: {
    className: 'transition-all duration-200 cursor-pointer'
  },
  hover: {
    className: 'hover:opacity-90 hover:scale-[1.01] hover:border-brand-500/40 transition-all'
  },
  active: {
    className: 'active:scale-[0.98] transition-transform'
  },
  disabled: {
    className: 'opacity-50 cursor-not-allowed pointer-events-none select-none'
  },
  loading: {
    className: 'animate-pulse pointer-events-none cursor-wait'
  },
  success: {
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
  },
  warning: {
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  },
  error: {
    className: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
  }
} as const;

export const VDS_VISUAL_STATES = {
  info: {
    id: 'info',
    name: 'Informação',
    colorHex: '#3b82f6',
    brandHex: '#4F8EF7',
    badgeClass: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-[#4F8EF7] border-blue-200 dark:border-blue-500/30',
    toastClass: 'bg-blue-950/95 light:bg-blue-50 border-blue-500/50 light:border-blue-300 text-blue-100 light:text-blue-900'
  },
  warning: {
    id: 'warning',
    name: 'Atenção',
    colorHex: '#f59e0b',
    badgeClass: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    toastClass: 'bg-amber-950/95 light:bg-amber-50 border-amber-500/50 light:border-amber-300 text-amber-100 light:text-amber-900'
  },
  success: {
    id: 'success',
    name: 'Sucesso',
    colorHex: '#10b981',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
    toastClass: 'bg-emerald-950/95 light:bg-emerald-50 border-emerald-500/50 light:border-emerald-300 text-emerald-100 light:text-emerald-900'
  },
  error: {
    id: 'error',
    name: 'Erro',
    colorHex: '#ef4444',
    badgeClass: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30',
    toastClass: 'bg-red-950/95 light:bg-red-50 border-red-500/50 light:border-red-300 text-red-100 light:text-red-900'
  },
  processing: {
    id: 'processing',
    name: 'Processando',
    colorHex: '#64748b',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    toastClass: 'bg-slate-900/95 light:bg-slate-100 border-slate-700/50 light:border-slate-300 text-slate-100 light:text-slate-900'
  }
} as const;
