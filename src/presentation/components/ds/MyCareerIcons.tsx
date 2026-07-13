interface IconProps {
  className?: string;
}

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'horizontal' | 'vertical' | 'symbol';
  colorMode?: 'default' | 'white' | 'black' | 'monochrome';
}

export function TalentaLogo({ 
  className = "h-8", 
  showText = true, 
  variant = 'horizontal', 
  colorMode = 'default' 
}: LogoProps) {
  
  let fillGradient = colorMode === 'default';
  let topFill = "url(#logo-t-top-grad)";
  let stemFill = "url(#logo-t-stem-grad)";
  let starFill = "url(#logo-star-grad)";
  let textClassPrimary = "text-on-surface";

  if (colorMode === 'white') {
    topFill = "#FFFFFF";
    stemFill = "#FFFFFF";
    starFill = "#FFFFFF";
    textClassPrimary = "text-white";
  } else if (colorMode === 'black') {
    topFill = "#000000";
    stemFill = "#000000";
    starFill = "#000000";
    textClassPrimary = "text-black";
  } else if (colorMode === 'monochrome') {
    topFill = "currentColor";
    stemFill = "currentColor";
    starFill = "currentColor";
    textClassPrimary = "text-current";
  }

  const isVertical = variant === 'vertical';
  const isSymbolOnly = variant === 'symbol';

  return (
    <div className={`flex ${isVertical ? 'flex-col text-center' : 'flex-row'} items-center gap-2.5 select-none ${className}`}>
      <svg 
        viewBox="0 0 96 96" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={`${isVertical ? 'h-16 w-16 mb-2' : 'h-full aspect-square'} shrink-0`}
      >
        {fillGradient && (
          <defs>
            <linearGradient id="logo-t-top-grad" x1="16" y1="48" x2="80" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
            <linearGradient id="logo-t-stem-grad" x1="48" y1="84" x2="48" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
            <linearGradient id="logo-star-grad" x1="40" y1="28" x2="56" y2="12" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
        )}
        
        {/* Stem of T (Rounded bottom) */}
        <path d="M 40 56 H 56 V 76 A 8 8 0 0 1 40 76 Z" fill={stemFill} />

        {/* Top Bar of T (Rounded Capsule) */}
        <rect x="16" y="40" width="64" height="16" rx="8" ry="8" fill={topFill} />

        {/* Sparkle Star */}
        <path d="M 48 12 Q 48 20 56 20 Q 48 20 48 28 Q 48 20 40 20 Q 48 20 48 12" fill={starFill} />
      </svg>
      
      {showText && !isSymbolOnly && (
        <div className={`flex flex-col ${isVertical ? 'items-center text-center' : 'items-start'} leading-none`}>
          <span className={`font-display ${isVertical ? 'text-2xl' : 'text-lg'} font-bold tracking-tight select-none ${textClassPrimary}`}>
            Talenta
          </span>
          {isVertical ? (
            <span className="text-[9px] font-medium tracking-[0.05em] text-slate-400 dark:text-slate-500 mt-1.5 max-w-[200px]">
              Transformando <span className="text-blue-500 font-semibold">talento</span> em <span className="text-purple-500 font-semibold">oportunidades</span>
            </span>
          ) : (
            <span className="text-[7px] font-semibold tracking-[0.15em] text-slate-400 dark:text-slate-500 uppercase mt-1">
              Inteligência Artificial
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Alias for backward compatibility
export { TalentaLogo as MyCareerLogo };

// 👤 User Profile: Ícone de usuário com uma engrenagem de configuração
export function UserProfileIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 19c0-2.21-1.79-4-4-4H5c-2.21 0-4 1.79-4 4v2h13v-2z" />
      <circle cx="7.5" cy="7.5" r="4" />
      <circle cx="19" cy="14" r="2" />
      <path d="M19 10.5v1.5M19 16v1.5M15.5 14h1.5M21 14h1.5" />
    </svg>
  );
}

// 🔍 Job Search: Lupa sobreposta a uma folha de documento
export function JobSearchIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <circle cx="11.5" cy="14.5" r="2.5" />
      <line x1="13.3" y1="16.3" x2="16" y2="19" />
    </svg>
  );
}

// 📈 Growth Path: Gráfico de barras ascendente com uma seta para cima
export function GrowthPathIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="14" width="3" height="6" rx="0.5" />
      <rect x="9" y="10" width="3" height="10" rx="0.5" />
      <rect x="15" y="6" width="3" height="14" rx="0.5" />
      <path d="M3 18L10 11L15 15L21 8" />
      <polyline points="17 8 21 8 21 12" />
    </svg>
  );
}

// 💡 Skills: Lâmpada com linhas de brilho e uma estrela central
export function SkillsIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 14c.78-.73 1.2-1.77 1.2-2.82A4.2 4.2 0 0 0 12 7a4.2 4.2 0 0 0-4.2 4.18c0 1.05.42 2.09 1.2 2.82v1.5h6v-1.5z" />
      <path d="M10 20h4" />
      <path d="M11 22h2" />
      <path d="M12 9.5l.5 1 1.2.2-.9.8.2 1.2-1-.6-1 .6.2-1.2-.9-.8 1.2-.2z" fill="currentColor" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="5" y1="5" x2="6.4" y2="6.4" />
      <line x1="2" y1="11" x2="4" y2="11" />
      <line x1="20" y1="11" x2="22" y2="11" />
      <line x1="19" y1="5" x2="17.6" y2="6.4" />
    </svg>
  );
}

// 🎓 Education: Chapéu de formatura (cap de estudante)
export function EducationIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  );
}

// 🌐 Network: Círculos conectados em rede (nós de conexão)
export function NetworkIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="5" cy="5" r="2.5" />
      <circle cx="19" cy="5" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <line x1="6.8" y1="6.8" x2="9.8" y2="9.8" />
      <line x1="17.2" y1="6.8" x2="14.2" y2="9.8" />
      <line x1="6.8" y1="17.2" x2="9.8" y2="14.2" />
      <line x1="17.2" y1="17.2" x2="14.2" y2="14.2" />
    </svg>
  );
}

// 📁 Portfolio: Pasta de arquivos com documentos internos visíveis
export function PortfolioIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <path d="M12 11h6M12 15h4" strokeWidth="1.5" />
    </svg>
  );
}

// 📊 Insights: Painel/Gráfico de linha com pontos de dados de analytics
export function InsightsIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 16l4-5 4 3 4-6" />
      <circle cx="7" cy="16" r="1.2" fill="currentColor" />
      <circle cx="11" cy="11" r="1.2" fill="currentColor" />
      <circle cx="15" cy="14" r="1.2" fill="currentColor" />
      <circle cx="19" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

// 💬 Mentorship: Dois balões de fala/diálogo sobrepostos
export function MentorshipIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 8v1a4 4 0 0 1-4 4H7.5L4 16V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v2" />
      <path d="M20 8v8a2 2 0 0 1-2 2h-3.5L11 21v-3.5A4 4 0 0 1 7 14v-.5" />
    </svg>
  );
}

// 📅 Opportunities: Calendário com uma marcação de estrela
export function OpportunitiesIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M12 13l.4.8.8.1-.6.6.1.8-.7-.4-.7.4.1-.8-.6-.6.8-.1z" fill="currentColor" />
    </svg>
  );
}
