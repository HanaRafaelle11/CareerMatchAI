import { useMyProfileAi } from '../../application/hooks/useMyProfileAi';
import { CardGlass } from '../components/CardGlass';
import { 
  Sparkles, Award, MapPin, Calendar, Briefcase, 
  CheckCircle, AlertCircle, ShieldCheck, ChevronRight,
  Brain, Zap, FileText, Star
} from 'lucide-react';

interface MyProfileAiProps {
  userId: string | undefined;
  setActiveTab: (tab: string) => void;
}

export function MyProfileAi({ userId, setActiveTab }: MyProfileAiProps) {
  const { data, isLoading } = useMyProfileAi(userId);
  const { profile, insights } = data;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
        <p className="text-slate-400 text-sm">Carregando Perfil Profissional IA...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 max-w-lg mx-auto p-8 bg-slate-900/10">
        <Sparkles size={48} className="mb-4 text-brand-500 animate-pulse" />
        <h3 className="font-display font-bold text-lg text-slate-200">Seu Perfil IA está pronto para ser gerado</h3>
        <p className="text-slate-400 text-xs mt-2 max-w-sm">
          Faça o upload do seu currículo em PDF na aba "Meu Currículo" para analisarmos suas experiências com IA e gerarmos seu perfil estruturado premium.
        </p>
        <button
          onClick={() => setActiveTab('profile')}
          className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/10 transition-all"
        >
          Ir para Upload de Currículo
        </button>
      </div>
    );
  }

  // Renderização das Badges de Transparência
  const renderSourceBadge = (type: 'extracted' | 'inferred' | 'recommended') => {
    if (type === 'extracted') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
          <FileText size={10} />
          Extraído do currículo
        </span>
      );
    }
    if (type === 'inferred') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
          <Brain size={10} />
          Inferência da IA
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
        <Zap size={10} />
        Recomendação da IA
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      {/* 1. Header Profissional */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/40 p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6">
        <div className="absolute top-0 right-0 h-40 w-40 bg-brand-500/5 rounded-full filter blur-3xl -z-10" />
        
        <div className="space-y-4 max-w-3xl">
          <div className="space-y-1">
            <h1 className="font-display font-bold text-3xl md:text-4xl text-slate-100 tracking-tight">
              {profile.personal?.fullName || "Profissional Cadastrado"}
            </h1>
            <p className="text-brand-400 font-semibold text-lg flex items-center gap-2">
              {profile.personal?.headline || "Especialista em Tecnologia"}
              {renderSourceBadge('extracted')}
            </p>
          </div>

          {profile.summary && (
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
              {profile.summary}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-900">
            {profile.personal?.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-500" />
                {profile.personal.location}
              </span>
            )}
            {profile.personal?.email && (
              <span className="flex items-center gap-1.5">
                <FileText size={14} className="text-slate-500" />
                {profile.personal.email}
              </span>
            )}
            {profile.personal?.phone && (
              <span className="flex items-center gap-1.5">
                <FileText size={14} className="text-slate-500" />
                {profile.personal.phone}
              </span>
            )}
          </div>
        </div>

        {/* Badge de Aprovação do Perfil */}
        <div className="flex flex-col md:items-end justify-between shrink-0">
          <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5 self-start md:self-auto">
            <ShieldCheck size={14} />
            Perfil Verificado
          </span>
        </div>
      </div>

      {/* Grid Central */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna da Esquerda (2/3 de largura no desktop): Identidade, Experiência, Competências */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 2. Identidade Profissional */}
          {insights?.seniority_prediction && (
            <CardGlass className="p-6 space-y-4 border-l-4 border-l-indigo-500">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-base text-slate-200 flex items-center gap-2">
                  <Brain className="text-indigo-400" size={18} />
                  Identidade Profissional
                </h3>
                {renderSourceBadge(insights.seniority_prediction.source_type || 'inferred')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-900">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Senioridade Estimada</span>
                  <p className="text-xl font-bold text-slate-100 mt-1">
                    {insights.seniority_prediction.value || "Não calculada"}
                  </p>
                </div>
                <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-900">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Índice de Confiança</span>
                  <p className="text-xl font-bold text-slate-100 mt-1">
                    {Math.round((insights.seniority_prediction.confidence || 0) * 100)}%
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-400 italic bg-indigo-500/5 p-3 rounded-lg border border-indigo-500/10 mt-2 leading-relaxed">
                "Esta é uma estimativa calculada pela inteligência artificial a partir do tempo de carreira e escopo de liderança. {insights.seniority_prediction.reason}"
              </p>
            </CardGlass>
          )}

          {/* 3. Experiência Profissional */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg text-slate-200 flex items-center gap-2">
              <Briefcase size={20} className="text-slate-400" />
              Histórico Profissional
              {renderSourceBadge('extracted')}
            </h3>

            {profile.experience && profile.experience.length > 0 ? (
              <div className="space-y-4">
                {profile.experience.map((exp, idx) => (
                  <CardGlass key={idx} className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                      <div>
                        <h4 className="font-bold text-slate-100">{exp.role || "Cargo não informado"}</h4>
                        <p className="text-brand-400 text-xs font-semibold">{exp.companyName || "Empresa não informada"}</p>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-900/50 px-2.5 py-1 rounded-lg border border-slate-900 flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                        <Calendar size={12} />
                        {exp.startDate} {exp.endDate ? `até ${exp.endDate}` : "(Atual)"}
                      </span>
                    </div>

                    {exp.description && (
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {exp.description}
                      </p>
                    )}

                    {exp.highlights && exp.highlights.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Realizações em Destaque</span>
                        <ul className="space-y-1.5">
                          {exp.highlights.map((h, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                              <ChevronRight size={14} className="text-brand-500 shrink-0 mt-0.5" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardGlass>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-900 rounded-xl text-slate-500 text-xs">
                Nenhuma experiência profissional mapeada neste perfil.
              </div>
            )}
          </div>

          {/* 4. Competências */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <CardGlass className="p-6 space-y-4">
              <h4 className="font-bold text-sm text-slate-200 border-b border-slate-900 pb-3 flex items-center gap-2">
                <CheckCircle className="text-slate-400" size={16} />
                Hard Skills
                {renderSourceBadge('extracted')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-900 text-xs text-slate-300 border border-slate-800 flex items-center gap-1.5">
                      {s.name}
                      {s.proficiency && (
                        <span className="text-[9px] font-bold text-brand-400">({s.proficiency})</span>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-xs">Nenhuma skill listada.</span>
                )}
              </div>
            </CardGlass>

            <CardGlass className="p-6 space-y-4">
              <h4 className="font-bold text-sm text-slate-200 border-b border-slate-900 pb-3 flex items-center gap-2">
                <Star className="text-slate-400" size={16} />
                Soft Skills
                {renderSourceBadge('extracted')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.soft_skills && profile.soft_skills.length > 0 ? (
                  profile.soft_skills.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-900 text-xs text-slate-300 border border-slate-800">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-xs">Nenhuma soft skill listada.</span>
                )}
              </div>
            </CardGlass>
          </div>
        </div>

        {/* Coluna da Direita: Inteligência de Carreira & ATS Optimization */}
        <div className="space-y-8">
          
          {/* 5. Inteligência de Carreira */}
          <CardGlass className="p-6 space-y-6">
            <h3 className="font-display font-bold text-base text-slate-200 flex items-center gap-2 border-b border-slate-900 pb-3">
              <Brain size={18} className="text-indigo-400 animate-pulse" />
              Inteligência de Carreira
            </h3>

            {/* Pontos Fortes */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                <CheckCircle size={14} />
                Pontos Fortes Mapeados
              </h4>
              <div className="space-y-3">
                {insights?.methodologies && insights.methodologies.length > 0 ? (
                  insights.methodologies.map((m, idx) => (
                    <div key={idx} className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-200">{m.methodology_name}</span>
                        {renderSourceBadge(m.source_type)}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Evidência com {Math.round(m.confidence * 100)}% de correspondência no currículo.
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">Mapeamento de evidências concluído.</div>
                )}
              </div>
            </div>

            {/* Oportunidades / Gaps */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <AlertCircle size={14} />
                Gaps de Competências
              </h4>
              <div className="space-y-3">
                {insights?.missing_skills && insights.missing_skills.value && insights.missing_skills.value.length > 0 ? (
                  insights.missing_skills.value.map((skill, idx) => (
                    <div key={idx} className="bg-amber-500/5 rounded-xl p-3 border border-amber-500/10 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-200">{skill}</span>
                        {renderSourceBadge(insights.missing_skills.source_type)}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {insights.missing_skills.reason} (Confiança: {Math.round(insights.missing_skills.confidence * 100)}%)
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">Nenhum gap crítico identificado.</div>
                )}
              </div>
            </div>
          </CardGlass>

          {/* 6. ATS Optimization */}
          <CardGlass className="p-6 space-y-6">
            <h3 className="font-display font-bold text-base text-slate-200 flex items-center gap-2 border-b border-slate-900 pb-3">
              <Award size={18} className="text-slate-400" />
              Otimização de ATS
            </h3>

            {/* Já possui */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-emerald-400">Já Possui (Existing)</label>
                {renderSourceBadge('extracted')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.ats_keywords?.existing_keywords && profile.ats_keywords.existing_keywords.length > 0 ? (
                  profile.ats_keywords.existing_keywords.map((kw, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/25">
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[10px]">Nenhum termo extraído.</span>
                )}
              </div>
            </div>

            {/* Ausentes */}
            <div className="space-y-2 pt-2 border-t border-slate-900">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-red-400">Ausentes no Currículo</label>
                {renderSourceBadge('recommended')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.ats_keywords?.missing_keywords && profile.ats_keywords.missing_keywords.length > 0 ? (
                  profile.ats_keywords.missing_keywords.map((kw, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/25">
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[10px]">Nenhum termo ausente.</span>
                )}
              </div>
            </div>

            {/* Recomendadas */}
            <div className="space-y-2 pt-2 border-t border-slate-900">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-indigo-400">Recomendadas para a Vaga</label>
                {renderSourceBadge('recommended')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.ats_keywords?.recommended_keywords && profile.ats_keywords.recommended_keywords.length > 0 ? (
                  profile.ats_keywords.recommended_keywords.map((kw, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/25">
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[10px]">Nenhum termo recomendado.</span>
                )}
              </div>
            </div>
          </CardGlass>
        </div>
      </div>
    </div>
  );
}
