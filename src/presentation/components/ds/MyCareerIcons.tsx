interface IconProps {
  className?: string;
}

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'horizontal' | 'vertical' | 'symbol';
  colorMode?: 'default' | 'white' | 'black' | 'monochrome';
}

export function MyCareerLogo({ 
  className = "h-8", 
  showText = true, 
  variant = 'horizontal', 
  colorMode = 'default' 
}: LogoProps) {
  
  let fillGradient = true;
  let strokeColor = "url(#logo-grad)";
  let headFill = "url(#logo-grad)";
  let textClassPrimary = "text-on-surface";
  let textClassSecondary = "text-on-surface";
  let textClassAi = "text-primary";

  if (colorMode === 'white') {
    fillGradient = false;
    strokeColor = "#FFFFFF";
    headFill = "#FFFFFF";
    textClassPrimary = "text-white";
    textClassSecondary = "text-white";
    textClassAi = "text-white opacity-90";
  } else if (colorMode === 'black') {
    fillGradient = false;
    strokeColor = "#000000";
    headFill = "#000000";
    textClassPrimary = "text-black";
    textClassSecondary = "text-black";
    textClassAi = "text-black";
  } else if (colorMode === 'monochrome') {
    fillGradient = false;
    strokeColor = "currentColor";
    headFill = "currentColor";
    textClassPrimary = "text-current";
    textClassSecondary = "text-current";
    textClassAi = "text-current opacity-80";
  }

  const isVertical = variant === 'vertical';
  const isSymbolOnly = variant === 'symbol';

  return (
    <div className={`flex ${isVertical ? 'flex-col text-center' : 'flex-row'} items-center gap-2.5 select-none ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${isVertical ? 'h-14 w-14 mb-1' : 'h-full aspect-square'} shrink-0`}>
        {fillGradient && (
          <defs>
            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        )}
        <path 
          d="M 22 75 C 22 45, 34 32, 46 45 C 50 49, 50 49, 54 45 C 66 32, 78 45, 78 75" 
          stroke={strokeColor} 
          strokeWidth="12" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <circle cx="50" cy="26" r="9" fill={headFill} />
      </svg>
      
      {showText && !isSymbolOnly && (
        <div className={`flex flex-col ${isVertical ? 'items-center' : 'items-start'} leading-none`}>
          <span className="font-display text-sm tracking-tight select-none flex items-center gap-0.5">
            <span className={`font-normal ${textClassPrimary}`}>My</span>
            <span className={`font-bold ${textClassSecondary}`}>Career</span>
            <span className={`font-extrabold ${textClassAi}`}>AI</span>
          </span>
          <span className="text-[6px] font-semibold tracking-[0.2em] text-slate-400 uppercase mt-0.5">
            SEU COPILOTO DE CARREIRA
          </span>
        </div>
      )}
    </div>
  );
}

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
