import React from 'react';

// 1. PageContainer — Contêiner padronizado de nível de página
export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}

export function PageContainer({ 
  children, 
  className = '', 
  maxWidth = '7xl',
  ...props 
}: PageContainerProps) {
  const maxWMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div 
      className={`w-full min-w-0 ${maxWMap[maxWidth]} mx-auto space-y-6 font-sans block ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// 2. SectionContainer — Seções internas de uma página ou landing page
export interface SectionContainerProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function SectionContainer({ children, className = '', ...props }: SectionContainerProps) {
  return (
    <section 
      className={`w-full min-w-0 space-y-4 font-sans block ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

// 3. ResponsiveGrid — Grid responsivo seguro com min-w-0
export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
}

export function ResponsiveGrid({ children, className = '', cols = 3, ...props }: ResponsiveGridProps) {
  const colsMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div 
      className={`grid ${colsMap[cols]} gap-6 w-full min-w-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// 4. CardContainer — Card padronizado com prevenção de colapso
export interface CardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContainer({ children, className = '', ...props }: CardContainerProps) {
  return (
    <div 
      className={`w-full min-w-0 font-sans bg-white dark:bg-[#242B36] border border-slate-200/80 dark:border-white/8 rounded-2xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-white/15 transition-all duration-150 ease-out ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// 5. FormContainer — Formulários padronizados para evitar campos ovoides/colapsados
export interface FormContainerProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function FormContainer({ children, className = '', maxWidth = 'xl', ...props }: FormContainerProps) {
  const maxWMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  return (
    <form 
      className={`space-y-5 w-full min-w-0 ${maxWMap[maxWidth]} font-sans block ${className}`}
      {...props}
    >
      {children}
    </form>
  );
}

// 6. DrawerContainer — Modais laterais / drawers com largura segura
export interface DrawerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DrawerContainer({ children, className = '', ...props }: DrawerContainerProps) {
  return (
    <div 
      className={`w-full max-w-lg min-w-0 font-sans block ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// 7. ModalContainer — Modais de diálogo com largura total e responsividade
export interface ModalContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export function ModalContainer({ children, className = '', maxWidth = '2xl', ...props }: ModalContainerProps) {
  const maxWMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl'
  };

  return (
    <div 
      className={`w-full min-w-0 ${maxWMap[maxWidth]} mx-auto font-sans block ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
