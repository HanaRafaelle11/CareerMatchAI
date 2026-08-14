import { useState, useRef, useEffect } from 'react';
import { CardGlass } from '../components/CardGlass';
import type { Resume, Profile as UserProfile, Application, PipelineStep } from '../../domain/models/types';
import type { CareerProfileNew, CareerInsight } from '../../application/hooks/useMyProfileAi';
import { calcYearsFromExperiences } from '../../application/services/matchingEngine';
import { Upload, FileText, Calendar, Trash2, AlertCircle, Briefcase, Award, Clock, Activity, Brain, Zap, Info, Sparkles, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { ResumeOptimizationService } from '../../application/services/ResumeOptimizationService';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { JobSearchService } from '../../application/services/JobSearchService';
import { ProcessingState, ErrorState } from '../components/ErrorVisuals';
import { AppError } from '../../application/errors/AppError';
import { ProgressRing, SkillChip, Badge } from '../components/ds';
import { useToast } from '../../application/context/ToastContext';
import { printElementHtml } from '../../application/utils/pdfExport';
import { useAuth } from '../../application/hooks/useAuth';
import { useEntitlements, PaywallModal, CheckoutModal } from '../../modules/billing';
import { calculateProfileCompleteness } from '../../domain/services/ProfileCompletenessService';

interface ProfileProps {
  profile: UserProfile | null;
  resumes: Resume[];
  careerProfileNew: CareerProfileNew | null;
  careerInsights: CareerInsight | null;
  onUploadResume: (file: File, rawText: string) => Promise<any>;
  onDeleteResume: (id: string) => Promise<void>;
  isUploading: boolean;
  applications: Application[];
  pipelineSteps?: PipelineStep[];
  activeResumeVersionId?: string | null;
  onSelectResumeVersion?: (versionId: string) => void;
  activeProfileTab: 'profile' | 'ai-profile' | 'transparency';
  setActiveProfileTab: (tab: 'profile' | 'ai-profile' | 'transparency') => void;
  setActiveTab?: (tab: string) => void;
}

function mapProficiencyToLevel(prof: string | undefined): 1 | 2 | 3 | 4 | 5 {
  if (!prof) return 3; // Default to Intermediário
  const p = prof.toLowerCase().trim();
  if (p.includes('expert') || p.includes('especialista') || p.includes('master') || p.includes('mestre') || p.includes('fluente')) return 5;
  if (p.includes('avançado') || p.includes('avancado') || p.includes('senior') || p.includes('sênior') || p.includes('high') || p.includes('especialidade')) return 4;
  if (p.includes('intermediário') || p.includes('intermediario') || p.includes('pleno') || p.includes('mid')) return 3;
  if (p.includes('básico') || p.includes('basico') || p.includes('junior') || p.includes('júnior') || p.includes('low') || p.includes('iniciante')) return 2;
  return 3;
}

function estimateSkillLevel(skillName: string, experiences: any[]): 1 | 2 | 3 | 4 | 5 {
  if (!skillName) return 3;
  const textToSearch = experiences
    .map(exp => `${exp.role || ''} ${exp.description || ''} ${(exp.highlights || []).join(' ')}`)
    .join(' ')
    .toLowerCase();
    
  const query = skillName.toLowerCase().trim();
  
  let count = 0;
  let pos = textToSearch.indexOf(query);
  while (pos !== -1) {
    count++;
    pos = textToSearch.indexOf(query, pos + query.length);
  }
  
  if (count >= 2) return 5; // Especialista
  if (count === 1) return 4; // Avançado
  return 3; // Intermediário
}

function getLocalFallbackInsights(profile: CareerProfileNew | null): CareerInsight | null {
  if (!profile) return null;
  const years = profile.experience && profile.experience.length > 0
    ? calcYearsFromExperiences(profile.experience)
    : 0;
  const seniority = years >= 6 ? 'Sênior' : years >= 3 ? 'Pleno' : 'Júnior';
  
  const experiences = profile.experience || [];
  const industries = experiences.map(exp => {
    const desc = (exp.description || '').toLowerCase();
    const role = (exp.role || '').toLowerCase();

    // 1. Check role/cargo title first (highly specific)
    if (role.includes('esteta') || role.includes('dentist') || role.includes('enferm') || role.includes('médic') || role.includes('medico') || role.includes('medica') || role.includes('terapeut') || role.includes('fisiot') || role.includes('saúde') || role.includes('saude')) {
      return 'Saúde / Estética';
    }
    if (role.includes('customer') || role.includes('sucess') || role.includes('cs') || role.includes('cx') || role.includes('atend') || role.includes('suporte') || role.includes('relacionamento') || role.includes('client')) {
      return 'Customer Success / CX';
    }
    if (role.includes('desenvolv') || role.includes('dev') || role.includes('engineer') || role.includes('tecnologia') || role.includes('software') || role.includes('ti') || role.includes('program')) {
      return 'SaaS / Tecnologia';
    }
    if (role.includes('finan') || role.includes('bank') || role.includes('contáb') || role.includes('contab') || role.includes('tesour') || role.includes('fatur')) {
      return 'Finanças / Fintech';
    }

    // 2. Check description using high-confidence phrases (avoiding benefit matches)
    if (desc.includes('estética') || desc.includes('clínica médica') || desc.includes('hospitalar') || desc.includes('esteticista') || desc.includes('consultório médico') || desc.includes('procedimentos estéticos')) {
      return 'Saúde / Estética';
    }
    if (desc.includes('customer success') || desc.includes('cx ') || desc.includes('nps') || desc.includes('churn') || desc.includes('sucesso do cliente') || desc.includes('carteira de clientes')) {
      return 'Customer Success / CX';
    }
    if (desc.includes('desenvolvimento de software') || desc.includes('programação') || desc.includes('desenvolvedor') || desc.includes('full stack') || desc.includes('frontend') || desc.includes('backend')) {
      return 'SaaS / Tecnologia';
    }
    if (desc.includes('planejamento financeiro') || desc.includes('contas a pagar') || desc.includes('contas a receber') || desc.includes('conciliação bancária')) {
      return 'Finanças / Fintech';
    }

    // 3. Fallback check with benefits removed to avoid false matching
    const cleanDesc = desc
      .replace(/assistência médica/g, '')
      .replace(/plano de saúde/g, '')
      .replace(/auxílio farmácia/g, '')
      .replace(/vale refeição/g, '')
      .replace(/vale alimentação/g, '');

    if (cleanDesc.includes('health') || cleanDesc.includes('médic') || cleanDesc.includes('esteta') || cleanDesc.includes('farmác')) {
      return 'Saúde / Estética';
    }
    if (cleanDesc.includes('finan') || cleanDesc.includes('bank') || cleanDesc.includes('pagament')) {
      return 'Finanças / Fintech';
    }
    if (cleanDesc.includes('saas') || cleanDesc.includes('software') || cleanDesc.includes('tech') || cleanDesc.includes('desenvolv')) {
      return 'SaaS / Tecnologia';
    }
    if (cleanDesc.includes('atend') || cleanDesc.includes('customer') || cleanDesc.includes('sucess') || cleanDesc.includes('suporte')) {
      return 'Customer Success / CX';
    }
    
    return '';
  }).filter(Boolean);
  
  const mainIndustry = industries[0] || 'Serviços B2B / Geral';

  return {
    id: 'local-fallback-insights',
    userId: profile.userId,
    resumeVersionId: profile.resumeVersionId,
    seniority_prediction: {
      value: seniority,
      confidence: 0.88,
      reason: `Mapeamento inferido pelo copiloto com base em ${years} anos de histórico profissional declarados.`,
      source_type: 'inferred'
    },
    industry_prediction: {
      value: mainIndustry,
      confidence: 0.85,
      reason: `Setor predominante identificado a partir das experiências de trabalho anteriores.`,
      source_type: 'inferred'
    },
    methodologies: [
      { methodology_name: 'Metodologias Ágeis (Scrum/Kanban)', confidence: 0.90, source_type: 'inferred' },
      { methodology_name: 'Orientação a Resultados (KPIs)', confidence: 0.85, source_type: 'inferred' },
      { methodology_name: 'CX / Sucesso do Cliente', confidence: 0.80, source_type: 'inferred' }
    ],
    recommended_keywords: {
      value: ['Customer Success', 'NPS', 'Churn Rate', 'CRM', 'Retenção de Contas'],
      confidence: 0.90,
      reason: 'Palavras-chave essenciais para aprimorar seu posicionamento de mercado.',
      source_type: 'recommended'
    },
    missing_skills: {
      value: ['Análise de Métricas SaaS', 'SQL Básico', 'Gestão de Crises / Contas Críticas'],
      confidence: 0.85,
      reason: 'Competências que elevariam seu Match para posições premium.',
      source_type: 'recommended'
    },
    confidence_scores: {
      value: { personal: 0.95, experience: 0.90, skills: 0.88 },
      confidence: 0.90,
      reason: 'O currículo possui excelente formatação estruturada.',
      source_type: 'inferred'
    },
    createdAt: new Date().toISOString()
  };
}

export function Profile({ 
  profile, 
  resumes,
  careerProfileNew,
  careerInsights,
  onUploadResume, 
  onDeleteResume, 
  isUploading, 
  applications = [],
  pipelineSteps = [],
  activeResumeVersionId,
  onSelectResumeVersion,
  activeProfileTab,
  setActiveProfileTab,
  setActiveTab: propSetActiveTab
}: ProfileProps) {
  const { user } = useAuth();
  const { isPro, canExportPdf, paywallState, triggerPaywall, closePaywall } = useEntitlements(user?.id);
  const [showCheckout, setShowCheckout] = useState(false);

  const activeInsights = careerInsights || getLocalFallbackInsights(careerProfileNew);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<AppError | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadSuccessSeconds, setUploadSuccessSeconds] = useState<number | null>(null);
  const [suggestedJobs, setSuggestedJobs] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDelayWarning, setShowDelayWarning] = useState(false);
  const [showProfileCompletenessTooltip, setShowProfileCompletenessTooltip] = useState(false);
  const timerRef = useRef<any>(null);

  const setActiveTab = propSetActiveTab;

  const [isLoadingSuggestedJobs, setIsLoadingSuggestedJobs] = useState(false);

  useEffect(() => {
    // Busca dinâmica baseada no cargo/domínio real do currículo ativo (prioriza cargo mais recente ou target role)
    const primaryResume = resumes.find(r => r.isPrimary) || resumes[0];
    const rawHeadline = careerProfileNew?.personal?.headline?.split('|')[0]?.split('—')[0]?.split(' e ')[0]?.trim();
    const activeTitle =
      (careerProfileNew?.personal as any)?.preferences?.targetRoles?.[0] ||
      careerProfileNew?.experience?.[0]?.role ||
      primaryResume?.experiences?.[0]?.role ||
      careerProfileNew?.education?.[0]?.fieldOfStudy ||
      rawHeadline ||
      (careerProfileNew?.skills?.[0] ? (typeof careerProfileNew.skills[0] === 'string' ? careerProfileNew.skills[0] : (careerProfileNew.skills[0] as any).name) : '') ||
      '';

    if (!activeTitle || !user?.id) {
      setSuggestedJobs([]);
      setIsLoadingSuggestedJobs(false);
      return;
    }

    let cancelled = false;
    setIsLoadingSuggestedJobs(true);

    JobSearchService.searchJobs({
      keyword: activeTitle,
      location: (careerProfileNew?.personal as any)?.preferences?.preferredLocations?.[0] || careerProfileNew?.personal?.location || 'Brasil',
      page: 1
    }).then(({ results }) => {
      if (!cancelled) {
        setSuggestedJobs((results || []).slice(0, 3));
        setIsLoadingSuggestedJobs(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setSuggestedJobs([]);
        setIsLoadingSuggestedJobs(false);
      }
    });

    return () => { cancelled = true; };
  }, [user?.id, activeResumeVersionId, careerProfileNew, resumes]);

  useEffect(() => {
    if (isUploading) {
      setShowDelayWarning(false);
      timerRef.current = setTimeout(() => {
        setShowDelayWarning(true);
      }, 10000);
    } else {
      setShowDelayWarning(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isUploading]);

  const [selectedTargetDomain, setSelectedTargetDomain] = useState<string>('cozinha');

  const getDomainSkillGaps = (domain: string, defaultMissingSkills?: string[]) => {
    if (domain === 'cozinha') {
      return [
        { name: 'Manipulação de Alimentos (Boas Práticas Anvisa)', confidence: 95, reason: 'Requisito fundamental para atuar em cozinhas profissionais, restaurantes e serviços de alimentação.' },
        { name: 'Segurança Alimentar & Controle Sanitário', confidence: 92, reason: 'Sugerido para prevenção de contaminação cruzada, controle de pragas e manutenção de padrões de higiene.' },
        { name: 'Organização de Praça (Mise en Place)', confidence: 90, reason: 'Essencial para agilizar o pré-preparo, montagem e fluxo operacional durante o horário de pico de atendimento.' },
        { name: 'Controle de Estoque & Validade (Método PEPS)', confidence: 88, reason: 'Sugerido para rotatividade de insumos (Primeiro que Entra, Primeiro que Sai) e minimização de desperdícios.' },
        { name: 'Fichas Técnicas & Padronização de Receitas', confidence: 85, reason: 'Recomendado para manter a consistência de sabor, apresentação dos pratos e controle de custo por porção.' }
      ];
    }
    if (domain === 'ti') {
      return [
        { name: 'Git & Controle de Versão (GitHub/GitLab)', confidence: 95, reason: 'Indispensável para trabalho colaborativo e gerenciamento de repositórios de código.' },
        { name: 'Lógica de Programação & Algoritmos', confidence: 92, reason: 'Base fundamental para construção de código limpo, estruturado e escalável.' },
        { name: 'Bancos de Dados & Consultas SQL', confidence: 90, reason: 'Recomendado para manipulação, filtragem e persistência de dados em aplicações modernas.' },
        { name: 'APIs RESTful & Integração de Serviços', confidence: 88, reason: 'Competência técnica chave para comunicação entre sistemas web e mobile.' }
      ];
    }
    if (domain === 'admin') {
      return [
        { name: 'Microsoft Excel (Tabelas Dinâmicas & ProcV/ProcX)', confidence: 95, reason: 'Fundamental para organização de dados, relatórios e planilhas operacionais.' },
        { name: 'Controle de Contas a Pagar e Receber', confidence: 90, reason: 'Essencial para suporte financeiro e conciliação de lançamentos.' },
        { name: 'Sistemas ERP (Totvs, SAP ou Bling)', confidence: 85, reason: 'Recomendado para gestão integrada de notas fiscais e estoque.' }
      ];
    }
    if (domain === 'vendas') {
      return [
        { name: 'Técnicas de Negociação & Fechamento', confidence: 95, reason: 'Recomendado para aumentar a taxa de conversão de propostas comerciais.' },
        { name: 'Gestão de CRM (Salesforce / HubSpot / RD)', confidence: 90, reason: 'Essencial para registro de interações e acompanhamento do pipeline de clientes.' }
      ];
    }

    // Default / Auto
    if (defaultMissingSkills && defaultMissingSkills.length > 0) {
      return defaultMissingSkills.map(s => ({
        name: s,
        confidence: 85,
        reason: 'Competência ausente recomendada com base no mapeamento automático.'
      }));
    }

    return [
      { name: 'Gestão do Tempo & Priorização', confidence: 85, reason: 'Recomendado para otimizar entregas diárias.' }
    ];
  };

  const primaryResume = resumes.find(r => r.isPrimary) || resumes[0];
  const versionStats = ResumeOptimizationService.getResumeVersionStats(resumes, applications);
  const yearsOfExperience = careerProfileNew && careerProfileNew.experience && careerProfileNew.experience.length > 0
    ? calcYearsFromExperiences(careerProfileNew.experience)
    : (primaryResume?.yearsOfExperience || 0);

  // Toast State
  const { showToast } = useToast();

  // Skills a exibir: usar career_profiles como fonte primária
  const displaySkills = careerProfileNew?.skills || [];
  const displaySoftSkills = careerProfileNew?.soft_skills || [];
  const displayLanguages = careerProfileNew?.languages || [];
  const displayExperience = careerProfileNew?.experience || primaryResume?.experiences || [];

  const handleExportPDF = async () => {
    if (!isPro && !canExportPdf) {
      triggerPaywall('pdf_export');
      return;
    }

    let activeCP = careerProfileNew;

    // Se careerProfileNew ainda não carregou no estado local, buscar diretamente no Supabase
    if (!activeCP && user?.id && isSupabaseConfigured && supabase) {
      showToast("Carregando perfil estruturado para exportação...", 'info');
      try {
        const { data: fetchedCP } = await supabase
          .from('career_profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (fetchedCP) {
          activeCP = fetchedCP;
        }
      } catch (e) {
        console.warn("[PDF EXPORT] Erro ao buscar perfil em tempo de execução:", e);
      }
    }

    if (!activeCP && !primaryResume) {
      showToast("Não há dados estruturados de perfil para exportar. Aguarde o processamento do currículo.", 'warning');
      return;
    }

    // ── Dados do careerProfileNew (fonte primária) ──
    const cpPersonal = activeCP?.personal;
    const cpExperience = activeCP?.experience || [];
    const cpSkills = activeCP?.skills || [];
    const cpEducation = activeCP?.education || [];
    const cpSummary = activeCP?.summary || '';
    const cpSoftSkills = activeCP?.soft_skills || [];
    const cpLanguages = activeCP?.languages || [];
    const cpCertifications = activeCP?.certifications || [];

    // ── Fallback: dados do Resume local (fonte secundária) ──
    const resumeExperiences = primaryResume?.experiences || [];
    const resumeSkills = primaryResume?.skills || [];
    const resumeEducation = primaryResume?.education || [];
    const resumeStructuredSummary = primaryResume?.structuredSummary || '';
    const resumeRawText = primaryResume?.rawText || '';
    const structuredData = primaryResume?.structured_data;

    // ── Merge com fallback ──
    const finalExperience = cpExperience.length > 0
      ? cpExperience
      : resumeExperiences.length > 0
        ? resumeExperiences.map(exp => ({
            companyName: exp.companyName || '',
            role: exp.role || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '',
            isCurrent: exp.isCurrent || false,
            description: exp.description || '',
            highlights: exp.highlights || []
          }))
        : (structuredData?.experience || []);

    const finalSkills = cpSkills.length > 0
      ? cpSkills
      : resumeSkills.length > 0
        ? resumeSkills.map(s => ({ name: s.name, proficiency: s.proficiencyLevel || '' }))
        : (structuredData?.skills || []);

    const finalEducation = cpEducation.length > 0
      ? cpEducation
      : resumeEducation.length > 0
        ? resumeEducation.map(edu => ({
            institution: edu.institution || '',
            degree: edu.degree || '',
            fieldOfStudy: edu.fieldOfStudy || '',
            startDate: edu.startDate || '',
            endDate: edu.endDate || ''
          }))
        : (structuredData?.education || []);

    const finalSummary = cpSummary
      || resumeStructuredSummary
      || structuredData?.summary
      || '';

    const finalName = cpPersonal?.fullName || profile?.fullName || 'Profissional Vocentro';
    const finalHeadline = cpPersonal?.headline || structuredData?.headline || profile?.headline || '';
    const emailStr = cpPersonal?.email || structuredData?.email || '';
    const phoneStr = cpPersonal?.phone || structuredData?.phone || '';
    const locationStr = cpPersonal?.location || structuredData?.location || '';

    // ── Gerar HTML das seções ──
    const skillsList = finalSkills.map((s: any) =>
      `<span style="display: inline-block; background: #eef2ff; color: #4338ca; font-size: 9pt; font-weight: 600; padding: 3px 10px; border-radius: 6px; margin: 2px 4px 2px 0; border: 1px solid #c7d2fe;">${s.name || s}</span>`
    ).join(' ');

    const experienceHtml = finalExperience.map((exp: any) => `
      <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap;">
          <span style="font-weight: 700; font-size: 11pt; color: #0f172a;">${exp.role || ''}</span>
          <span style="font-size: 9pt; color: #94a3b8; white-space: nowrap;">${exp.startDate || ''} — ${exp.isCurrent ? 'Presente' : (exp.endDate || '')}</span>
        </div>
        <div style="font-weight: 500; font-size: 9.5pt; color: #4f46e5; margin-bottom: 4px;">${exp.companyName || ''}</div>
        <p style="font-size: 10pt; color: #334155; white-space: pre-line; margin: 4px 0 0 0;">${exp.description || ''}</p>
        ${(exp.highlights && exp.highlights.length > 0) ? `<ul style="margin: 6px 0 0 0; padding-left: 16px;">${exp.highlights.map((h: string) => `<li style="font-size: 9.5pt; color: #475569; margin-bottom: 2px;">${h}</li>`).join('')}</ul>` : ''}
      </div>
    `).join('');

    const educationHtml = finalEducation.map((edu: any) => `
      <div style="margin-bottom: 10px; padding-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap;">
          <span style="font-weight: 700; font-size: 10.5pt; color: #0f172a;">${edu.fieldOfStudy || edu.degree || ''}</span>
          <span style="font-size: 9pt; color: #94a3b8;">${edu.startDate || ''} — ${edu.endDate || ''}</span>
        </div>
        <div style="font-size: 9.5pt; color: #64748b;">${edu.institution || ''}</div>
      </div>
    `).join('');

    const softSkillsHtml = cpSoftSkills.length > 0
      ? cpSoftSkills.map(s => `<span style="display: inline-block; background: #fef3c7; color: #92400e; font-size: 9pt; font-weight: 500; padding: 3px 10px; border-radius: 6px; margin: 2px 4px 2px 0; border: 1px solid #fde68a;">${s}</span>`).join(' ')
      : '';

    const languagesHtml = cpLanguages.length > 0
      ? cpLanguages.map(l => `<span style="display: inline-block; background: #ecfdf5; color: #065f46; font-size: 9pt; font-weight: 500; padding: 3px 10px; border-radius: 6px; margin: 2px 4px 2px 0; border: 1px solid #a7f3d0;">${l.language}${l.proficiency ? ` (${l.proficiency})` : ''}</span>`).join(' ')
      : '';

    const certificationsHtml = cpCertifications.length > 0
      ? cpCertifications.map(c => `<li style="font-size: 10pt; color: #334155; margin-bottom: 4px;">${c}</li>`).join('')
      : '';

    // ── Fallback final: se TUDO estiver vazio, usar rawText ──
    const hasAnyContent = finalExperience.length > 0 || finalSkills.length > 0 || finalEducation.length > 0 || finalSummary;

    const rawTextFallbackHtml = !hasAnyContent && resumeRawText
      ? `
        <h2>Conteúdo do Currículo</h2>
        <div style="font-size: 10pt; color: #334155; white-space: pre-line; line-height: 1.6; text-align: justify;">${resumeRawText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      ` : '';

    const htmlContent = `
      <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="border-bottom: none; margin-bottom: 4px; padding-bottom: 0;">${finalName}</h1>
        ${finalHeadline ? `<div style="font-size: 12pt; color: #4f46e5; font-weight: 600; margin-bottom: 8px;">${finalHeadline}</div>` : ''}
        <div style="font-size: 9.5pt; color: #64748b; display: flex; flex-wrap: wrap; gap: 12px;">
          ${emailStr ? `<span>📧 ${emailStr}</span>` : ''}
          ${phoneStr ? `<span>📱 ${phoneStr}</span>` : ''}
          ${locationStr ? `<span>📍 ${locationStr}</span>` : ''}
        </div>
      </div>

      ${finalSummary ? `
        <h2>Resumo Profissional</h2>
        <p style="font-size: 10.5pt; color: #334155; line-height: 1.6; text-align: justify;">${finalSummary}</p>
      ` : ''}

      ${finalExperience.length > 0 ? `
        <h2>Experiência Profissional</h2>
        <div>${experienceHtml}</div>
      ` : ''}

      ${finalEducation.length > 0 ? `
        <h2>Educação / Formação</h2>
        <div>${educationHtml}</div>
      ` : ''}

      ${finalSkills.length > 0 ? `
        <h2>Competências Técnicas</h2>
        <div style="margin-top: 8px;">${skillsList}</div>
      ` : ''}

      ${softSkillsHtml ? `
        <h2>Competências Comportamentais</h2>
        <div style="margin-top: 8px;">${softSkillsHtml}</div>
      ` : ''}

      ${languagesHtml ? `
        <h2>Idiomas</h2>
        <div style="margin-top: 8px;">${languagesHtml}</div>
      ` : ''}

      ${certificationsHtml ? `
        <h2>Certificações</h2>
        <ul style="margin-top: 8px;">${certificationsHtml}</ul>
      ` : ''}

      ${rawTextFallbackHtml}
    `;

    const fileName = finalName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_À-ÿ]/g, '');
    printElementHtml(`${fileName}_Curriculo`, htmlContent);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMsg(null);
    setUploadSuccess(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setUploadSuccess(false);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      e.target.value = '';
      await processFile(selectedFile);
    }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const DANGEROUS_EXTENSIONS = ['.svg', '.html', '.htm', '.js', '.jsx', '.ts', '.tsx', '.exe', '.bat', '.sh', '.php', '.py', '.rb', '.cmd', '.msi', '.dll', '.com', '.vbs', '.ps1'];

  /** Remove tags HTML/script para prevenção de XSS stored */
  const sanitizeText = (text: string): string => {
    return text
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');
  };

  const processFile = async (file: File) => {
    // 1. Validação de tamanho
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg(new AppError({
        code: 'RESUME_UPLOAD_INVALID',
        title: 'Não conseguimos ler esse arquivo',
        message: 'Envie um arquivo em formato PDF com até 10MB de tamanho.',
        severity: 'warning',
        retryable: false,
        action: 'Enviar novo currículo'
      }));
      return;
    }

    // 2. Validação de tamanho mínimo (arquivo vazio)
    if (file.size === 0) {
      setErrorMsg(new AppError({
        code: 'RESUME_UPLOAD_INVALID',
        title: 'Não conseguimos ler esse arquivo',
        message: 'O arquivo está vazio. Envie um currículo em formato PDF com até 10MB de tamanho.',
        severity: 'warning',
        retryable: false,
        action: 'Enviar novo currículo'
      }));
      return;
    }

    // 3. Validação de extensão perigosa
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(fileExtension)) {
      setErrorMsg(new AppError({
        code: 'RESUME_UPLOAD_INVALID',
        title: 'Não conseguimos ler esse arquivo',
        message: `Tipo de arquivo "${fileExtension}" não é permitido. Envie apenas PDF, DOC, DOCX, TXT ou imagem (PNG, JPG, WEBP).`,
        severity: 'warning',
        retryable: false,
        action: 'Enviar novo currículo'
      }));
      return;
    }

    // 4. Validação de tipo MIME
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp'
    ];
    const isImgExt = ['.png', '.jpg', '.jpeg', '.webp'].includes(fileExtension);
    const isDocExt = ['.pdf', '.doc', '.docx', '.txt'].includes(fileExtension);
    if (!allowedTypes.includes(file.type) && !isDocExt && !isImgExt) {
      setErrorMsg(new AppError({
        code: 'RESUME_UPLOAD_INVALID',
        title: 'Não conseguimos ler esse arquivo',
        message: 'Apenas arquivos PDF, DOC, DOCX, TXT ou imagens (PNG, JPG, WEBP) com até 10MB são suportados.',
        severity: 'warning',
        retryable: false,
        action: 'Enviar novo currículo'
      }));
      return;
    }

    const startTime = Date.now();

    try {
      let rawText = '';
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        // Para .txt: lê o conteúdo real do arquivo
        const reader = new FileReader();
        rawText = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(file);
        });

        // 5. Validação de conteúdo mínimo para TXT
        if (rawText.trim().length < 50) {
          setErrorMsg(new AppError({
            code: 'RESUME_UPLOAD_INVALID',
            title: 'Não conseguimos ler esse arquivo',
            message: 'O conteúdo do currículo é muito curto (menos de 50 caracteres). Envie um currículo mais completo.',
            severity: 'warning',
            retryable: false,
            action: 'Enviar novo currículo'
          }));
          return;
        }

        // 6. Sanitização anti-XSS do texto
        rawText = sanitizeText(rawText);
      } else if (!isSupabaseConfigured) {
        // PDF/DOCX sem Supabase: orienta o usuário claramente
        setErrorMsg(new AppError({
          code: 'RESUME_UPLOAD_INVALID',
          title: 'Não conseguimos ler esse arquivo',
          message: 'Para analisar arquivos PDF/DOC/DOCX, conecte o Supabase nas configurações. Como alternativa, salve seu currículo como .TXT e faça o upload.',
          severity: 'warning',
          retryable: false,
          action: 'Enviar novo currículo'
        }));
        return;
      } else {
        // PDF/DOCX com Supabase: o backend (Edge Function) fará a extração visual/texto
        rawText = '';
      }

      await onUploadResume(file, rawText);
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      setUploadSuccessSeconds(durationSeconds);
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadSuccessSeconds(null);
      }, 5000);
    } catch (err: any) {
      console.error('[UPLOAD ERROR DETECTED]', err);
      setErrorMsg(AppError.from(err));
    }
  };

  // Completeness calculation
  const hasResume = resumes.length > 0;
  const linkedinVal = careerProfileNew?.personal?.linkedin;
  const hasLinkedin = !!linkedinVal && 
    typeof linkedinVal === 'string' && 
    linkedinVal.trim().length > 0 && 
    !['n/a', 'na', 'none', 'não informado', 'não consta', 'n-a', 'null', 'undefined', 'n.a.'].includes(linkedinVal.toLowerCase().trim()) && 
    linkedinVal.toLowerCase().includes('linkedin.com');
  const hasSkills = (careerProfileNew?.skills?.length || 0) > 0;
  const hasExperiences = (careerProfileNew?.experience?.length || 0) > 0;

  const completenessResult = calculateProfileCompleteness({
    hasResume,
    hasLinkedin,
    hasSkills,
    hasExperiences,
    profile,
    careerProfile: careerProfileNew
  });
  const completeness = completenessResult.score;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-7xl mx-auto animate-fade-in font-sans block">
      {/* Título com Completude */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full min-w-0">
        <div className="flex-1 min-w-0 w-full">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 w-full">
            Perfil Profissional
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 block break-normal whitespace-normal w-full">
            Mapeamento de competências, histórico profissional e otimização para ATS.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 relative">
          <ProgressRing value={completeness} size={36} strokeWidth={3} />
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block leading-tight">Perfil {completeness}% Completo</span>
              <button
                type="button"
                aria-label="Explicação da completude do perfil"
                onClick={() => setShowProfileCompletenessTooltip(v => !v)}
                className="p-1 rounded-full text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 transition-colors cursor-pointer"
                title="Entenda como a completude do seu perfil é calculada"
              >
                <Info size={14} />
              </button>
            </div>
            {completeness === 100 ? (
              <span className="text-[10px] text-emerald-500 block mt-0.5 font-medium">Perfil totalmente otimizado! 🔥</span>
            ) : (
              <span className="text-[10px] text-muted-foreground block mt-0.5">Em progresso</span>
            )}
          </div>

          {showProfileCompletenessTooltip && (
            <div className="absolute right-0 top-12 z-50 w-80 p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-700 shadow-2xl animate-scale-up text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span className="font-extrabold text-white text-xs">O que significa Perfil {completeness}% completo?</span>
                <button
                  type="button"
                  onClick={() => setShowProfileCompletenessTooltip(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                A pontuação de completude mede a riqueza de dados do seu perfil para calibrar as sugestões de vagas e simulações com IA:
              </p>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex items-center justify-between">
                  <span>✅ Cadastro Base</span>
                  <span className="font-bold text-brand-400">+10%</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>{hasResume ? '✅' : '○'} Upload de Currículo (PDF/TXT)</span>
                  <span className="font-bold text-brand-400">+30%</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>{displayExperience.length > 0 ? '✅' : '○'} Histórico Profissional</span>
                  <span className="font-bold text-brand-400">+20%</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>{displaySkills.length > 0 ? '✅' : '○'} Competências & Habilidades</span>
                  <span className="font-bold text-brand-400">+20%</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>{((profile as any)?.linkedinUrl || (profile as any)?.linkedin_url || careerProfileNew?.personal?.linkedin) ? '✅' : '○'} Perfil LinkedIn Vinculado</span>
                  <span className="font-bold text-brand-400">+20%</span>
                </li>
              </ul>
              <p className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                Complete as informações acima para alcançar 100% de otimização.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top AI Guidance Banner */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-w-0">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles size={18} strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Recomendação da IA</span>
              <Badge variant="premium" size="sm">Otimizador de Perfil</Badge>
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">
              {hasResume
                ? 'Seu currículo foi processado pela IA. Mantenha suas habilidades e preferências de vaga atualizadas.'
                : 'Envie seu currículo em PDF para que a IA processe suas palavras-chave e gere seu perfil consolidado.'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              O modelo Gemini extrai palavras-chave compatíveis com ATS para aumentar sua visibilidade nos recrutadores.
            </p>
          </div>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 self-start md:self-center max-w-full shadow-md shadow-brand-500/10"
        >
          <Upload size={14} />
          <span>{hasResume ? 'Atualizar Currículo' : 'Enviar Currículo'}</span>
        </button>
      </div>

      {pipelineSteps && pipelineSteps.length > 0 ? (
        <CardGlass className="p-8 border border-brand-500/20 max-w-4xl mx-auto">
          <ProcessingState
            title="Processando Currículo com IA..."
            subtitle={showDelayWarning
              ? "Essa análise pode levar alguns segundos porque estamos extraindo e catalogando detalhadamente suas competências."
              : "Nossa IA está lendo seu histórico de experiências, extraindo competências técnicas e comportamentais e mapeando seu perfil."
            }
            expectedTime="Tempo esperado: ~25 segundos"
            steps={pipelineSteps}
          />
        </CardGlass>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lado Esquerdo: Upload do Currículo */}
          <div className="lg:col-span-1 space-y-6">
            <CardGlass className="space-y-4">
              {/* Flow Stepper */}
              <div className="flex items-center justify-between text-[10px] font-bold text-on-surface-variant pb-2 border-b border-outline-variant/10">
                <span className={resumes.length === 0 ? 'text-primary' : 'text-emerald-400'}>1. Upload</span>
                <span className="text-outline-variant">→</span>
                <span className={isUploading ? 'text-primary animate-pulse' : resumes.length > 0 ? 'text-emerald-400' : 'text-outline-variant'}>2. IA Lendo</span>
                <span className="text-outline-variant">→</span>
                <span className={careerProfileNew ? 'text-emerald-400' : 'text-outline-variant'}>3. Concluído</span>
              </div>
              <h2 className="font-display font-bold text-sm text-slate-200 dark:text-slate-200 light:text-slate-800">
                Upload de Currículo
              </h2>

              {/* Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-brand-500 bg-brand-500/5'
                    : 'border-slate-800 dark:border-slate-800 light:border-slate-300 bg-slate-900/10 dark:bg-slate-900/10 light:bg-slate-50 hover:border-slate-700'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                    {isUploading ? (
                      <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload size={22} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700">
                      {isUploading ? 'Analisando Currículo...' : 'Arraste seu arquivo aqui'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Suporta PDF, DOCX ou TXT (Max. 10MB)
                    </p>
                  </div>
                </div>
              </div>

              {errorMsg && (
              <div role="alert" aria-live="polite" className="w-full text-left" onClick={(e) => e.stopPropagation()}>

                <ErrorState
                  error={errorMsg}
                  onAction={() => {
                    setErrorMsg(null);
                    fileInputRef.current?.click();
                  }}
                  onRetry={() => {
                    setErrorMsg(null);
                    fileInputRef.current?.click();
                  }}
                />
              </div>
            )}

            {/* Card Interativo Pós-Upload (Item 1, Item 2 e Item 3) */}
            {(uploadSuccess || resumes.length > 0) && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0d1527] to-slate-900 border border-brand-500/30 space-y-3.5 shadow-xl animate-scale-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Jornada de Match do Candidato</span>
                  </div>
                  {uploadSuccess && (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Concluído em {uploadSuccessSeconds || 0}s
                    </span>
                  )}
                </div>

                {/* Item 2a: Indicador de Progresso Visual em 2 Passos Sem Truncamento Visual */}
                <div className="flex flex-wrap sm:flex-nowrap gap-2 text-[11px] sm:text-xs max-w-full">
                  <div className="flex-1 min-w-0 px-2.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-1 text-emerald-400 font-bold whitespace-nowrap overflow-hidden">
                    <CheckCircle size={13} className="shrink-0 text-emerald-400" />
                    <span className="truncate">1. CV Enviado ✅</span>
                  </div>
                  <div className="flex-1 min-w-0 px-2.5 py-2 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center gap-1 text-brand-300 font-bold whitespace-nowrap animate-pulse overflow-hidden">
                    <Sparkles size={13} className="shrink-0 text-amber-300" />
                    <span className="truncate">2. Ver seu Match 🚀</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-snug">
                  Seu currículo foi estruturado pela IA. Agora navegue pelas vagas e veja a compatibilidade do seu perfil em tempo real.
                </p>

                {/* Item 1: CTA Ativo Primário direcionando para Vagas & Match (ID correto: 'match') */}
                <button
                  onClick={() => setActiveTab?.('match')}
                  className="w-full max-w-full py-3 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl flex items-center justify-center gap-2 group transition-all cursor-pointer border border-brand-400/30 overflow-hidden text-center"
                >
                  <span className="truncate block max-w-full">Buscar vagas e ver seu Match</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform shrink-0" />
                </button>

                {/* Item 2b & Item 3: Catálogo de Vagas Sugeridas com Título Completo e Nome Real da Empresa */}
                {isLoadingSuggestedJobs && (
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-center gap-2 py-3 text-slate-400 text-xs">
                    <Loader2 size={14} className="animate-spin text-brand-400" />
                    <span>Identificando vagas ideais para o seu perfil...</span>
                  </div>
                )}

                {!isLoadingSuggestedJobs && suggestedJobs.length > 0 && (
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      ⚡ Vagas Recentes Prontas para Calcular Match:
                    </span>
                    <div className="space-y-1.5">
                      {suggestedJobs.slice(0, 3).map((j) => {
                        const rawComp = j.company_name || j.companyName || j.company || '';
                        const companyDisplayName = (rawComp && rawComp !== 'Empresa') ? rawComp : 'Empresa Confidencial';
                        return (
                          <div
                            key={j.id || j.title}
                            onClick={() => {
                              if (j.title) {
                                sessionStorage.setItem('job_search_keyword', j.title);
                                sessionStorage.setItem('job_search_input_keyword', j.title);
                              }
                              setActiveTab?.('match');
                            }}
                            className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-brand-500/50 cursor-pointer transition-all flex items-center justify-between gap-2 group"
                          >
                            <div className="min-w-0 flex-1">
                              <strong className="text-xs font-bold text-slate-200 group-hover:text-brand-400 block leading-snug line-clamp-2">
                                {j.title}
                              </strong>
                              <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                                {companyDisplayName} • {j.location || 'Brasil'}
                              </span>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 text-[10px] font-bold shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-colors flex items-center gap-1">
                              Calcular Match <ArrowRight size={12} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isSupabaseConfigured && (
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-[10px] text-amber-500 leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertCircle size={13} />
                  Modo de Demonstração Local
                </div>
                <p>
                  Extrações de arquivos PDF/DOCX exigem conexão ativa com o Supabase. Para testar o parser semântico offline com suas próprias informações reais, faça o upload de um arquivo de texto simples <strong>(.txt)</strong> com o conteúdo do seu currículo.
                </p>
              </div>
            )}

            {/* Lista de Currículos */}
            {resumes.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Histórico de Arquivos (Clique para selecionar o ativo)</span>
                {resumes.map(res => {
                  const isActive = res.resumeVersionId === activeResumeVersionId;
                  return (
                    <div
                      key={res.id}
                      onClick={() => res.resumeVersionId && onSelectResumeVersion?.(res.resumeVersionId)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isActive
                          ? 'border-brand-500 bg-brand-500/10 shadow-md shadow-brand-500/5'
                          : 'bg-slate-900/40 border-slate-900 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText size={16} className={isActive ? 'text-brand-400 shrink-0' : 'text-slate-500 shrink-0'} />
                        <span className={`font-semibold truncate ${isActive ? 'text-brand-400' : 'text-slate-300'} dark:${isActive ? 'text-brand-400' : 'text-slate-300'} light:${isActive ? 'text-brand-600' : 'text-slate-700'}`} title={res.fileName}>
                          {res.fileName}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-brand-500/20 text-brand-400 border border-brand-500/35 uppercase tracking-wider">
                            Ativo
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const confirmMsg = `Tem certeza que deseja deletar permanentemente o currículo "${res.fileName}"?`;
                          if (window.confirm(confirmMsg)) {
                            try {
                              await onDeleteResume(res.id);
                              showToast('Currículo excluído com sucesso.', 'info');
                            } catch (err: any) {
                              console.error('[Profile] Erro ao excluir currículo:', err);
                              showToast(err?.message || 'Erro ao excluir currículo.', 'error');
                            }
                          }
                        }}
                        className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                        title="Excluir currículo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardGlass>

          {/* Seção de Versões & Performance (Item 13) */}
          {resumes.length > 0 && (
            <CardGlass className="space-y-4 border border-slate-900">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Clock size={16} className="text-brand-500" />
                  Versões do Currículo & Taxa de Conversão
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  💡 <strong>Como funciona a Taxa de Conversão?</strong> Este indicador calcula qual percentual das candidaturas enviadas com esta versão do currículo avançaram para a etapa de <strong>Entrevista</strong> no seu Pipeline.
                </p>
              </div>
              
              <div className="space-y-3">
                {versionStats.map((stat: any) => (
                  <div key={stat.resumeId} className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200">{stat.versionLabel}</span>
                      {stat.applicationsCount > 0 ? (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-extrabold border border-emerald-500/20">
                          {stat.conversionRate}% de Conversão
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                          Aguardando candidaturas no pipeline
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-900 font-mono">
                      <span>📨 Candidaturas Enviadas: <strong>{stat.applicationsCount}</strong></span>
                      <span>👥 Entrevistas Agendadas: <strong className="text-emerald-400">{stat.interviewsCount}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </CardGlass>
          )}

          {/* Painel de Processamento amigável (sem dados técnicos) */}
          {(primaryResume || careerProfileNew) && (
            <CardGlass className="space-y-4 border border-slate-900">
              <h3 className="font-display font-bold text-sm text-slate-200 flex items-center gap-2">
                <Activity size={16} className="text-brand-500" />
                Status do Processamento
              </h3>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  {primaryResume ? (
                    <span className="text-emerald-500 font-bold">✓</span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-800 animate-pulse shrink-0" />
                  )}
                  <span>Currículo recebido com sucesso</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {careerProfileNew && displayExperience.length > 0 ? (
                    <span className="text-emerald-500 font-bold">✓</span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-800 animate-pulse shrink-0" />
                  )}
                  <span>
                    {careerProfileNew && displayExperience.length > 0 ? (
                      <>
                        <strong className="text-slate-100">{displayExperience.length}</strong> experiências identificadas
                      </>
                    ) : (
                      'Identificando experiências...'
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {careerProfileNew && displaySkills.length > 0 ? (
                    <span className="text-emerald-500 font-bold">✓</span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-800 animate-pulse shrink-0" />
                  )}
                  <span>
                    {careerProfileNew && displaySkills.length > 0 ? (
                      <>
                        <strong className="text-slate-100">{displaySkills.length}</strong> competências mapeadas
                      </>
                    ) : (
                      'Mapeando competências...'
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {careerProfileNew && yearsOfExperience > 0 ? (
                    <span className="text-emerald-500 font-bold">✓</span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-800 animate-pulse shrink-0" />
                  )}
                  <span>
                    {careerProfileNew && yearsOfExperience > 0 ? (
                      <>
                        <strong className="text-slate-100">{yearsOfExperience} anos</strong> de experiência calculados
                      </>
                    ) : (
                      'Calculando anos de experiência...'
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {careerProfileNew ? (
                    <span className="text-emerald-500 font-bold">✓</span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-800 animate-pulse shrink-0" />
                  )}
                  <span>Perfil IA gerado com sucesso</span>
                </div>
              </div>
            </CardGlass>
          )}
        </div>

        {/* Lado Direito: Perfil Estruturado pela IA */}
        <div className="lg:col-span-2 space-y-6">
          {primaryResume ? (
            <div className="space-y-6">
              {/* Navegação por Abas (Fase 9) */}
              <div className="flex flex-wrap sm:flex-nowrap gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-900 w-full select-none items-center justify-between max-w-full overflow-x-auto">
                <div className="flex flex-wrap gap-1.5 max-w-full">
                  <button
                    onClick={() => setActiveProfileTab('profile')}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-semibold tracking-wide transition-all ${
                      activeProfileTab === 'profile'
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Currículo Original
                  </button>
                  <button
                    onClick={() => setActiveProfileTab('ai-profile')}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                      activeProfileTab === 'ai-profile'
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles size={12} />
                    Meu Perfil IA
                  </button>
                  <button
                    onClick={() => setActiveProfileTab('transparency')}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                      activeProfileTab === 'transparency'
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Activity size={12} />
                    Como a IA Concluiu?
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="mr-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <FileText size={12} />
                  Exportar PDF
                </button>
              </div>

              {activeProfileTab === 'profile' && (
                <>
                  {/* Resumo Profissional */}
                  <CardGlass className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h2 className="font-display font-bold text-xl text-slate-100 dark:text-slate-100 light:text-slate-800">
                          {careerProfileNew?.personal?.fullName || profile?.fullName}
                        </h2>
                        <p className="text-brand-500 font-medium text-sm mt-0.5">
                          {careerProfileNew?.personal?.headline || primaryResume.structuredSummary?.split('.')[0]}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-bold uppercase shrink-0">
                        <Clock size={12} />
                        <span>{yearsOfExperience > 0 ? `${yearsOfExperience} Anos Exp.` : 'Calculando...'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed pt-2 border-t border-slate-900 dark:border-slate-900 light:border-slate-200">
                      {careerProfileNew?.summary || primaryResume.structuredSummary}
                    </p>
                  </CardGlass>

                  {/* Competências extraídas */}
                  <CardGlass className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Award size={18} />
                      </div>
                      <h3 className="font-display font-bold text-base text-slate-200 dark:text-slate-200 light:text-slate-800">
                        Competências Mapeadas
                        <span className="ml-2 text-[10px] font-normal text-slate-500">
                          {displaySkills.length + displaySoftSkills.length} competências identificadas
                        </span>
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-900 dark:border-slate-900 light:border-slate-200">
                      {/* Hard Skills */}
                      <div className="space-y-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Competências Técnicas</span>
                        <div className="flex flex-wrap gap-2">
                          {displaySkills.length > 0
                            ? displaySkills.map((s, i) => {
                              const estimated = estimateSkillLevel(s.name, careerProfileNew?.experience || []);
                              const level = s.proficiency && s.proficiency !== 'Avançado' && s.proficiency !== 'avançado'
                                ? mapProficiencyToLevel(s.proficiency)
                                : estimated;
                              return (
                                <SkillChip key={i} name={s.name} category="hard" level={level} />
                              );
                            })
                            : primaryResume.skills.filter(s => s.category?.includes('hard') || !s.category).map(s => {
                              const estimated = estimateSkillLevel(s.name, primaryResume.experiences || []);
                              const level = s.proficiencyLevel && s.proficiencyLevel !== 'avançado'
                                ? mapProficiencyToLevel(s.proficiencyLevel)
                                : estimated;
                              return (
                                <SkillChip key={s.id} name={s.name} category="hard" level={level} />
                              );
                            })
                          }
                        </div>
                      </div>

                      {/* Soft Skills */}
                      <div className="space-y-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Competências Comportamentais</span>
                        <div className="flex flex-wrap gap-2">
                          {displaySoftSkills.length > 0
                            ? displaySoftSkills.map((s, i) => (
                              <SkillChip key={i} name={s} category="soft" />
                            ))
                            : primaryResume.skills.filter(s => s.category?.includes('soft')).map(s => (
                              <SkillChip key={s.id} name={s.name} category="soft" />
                            ))
                          }
                        </div>
                      </div>

                      {/* Idiomas */}
                      <div className="space-y-3 md:col-span-2 pt-4 border-t border-slate-900 dark:border-slate-900 light:border-slate-200">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Idiomas</span>
                        <div className="flex flex-wrap gap-2">
                          {displayLanguages.length > 0
                            ? displayLanguages.map((lang, i) => (
                              <SkillChip key={i} name={`${lang.language}${lang.proficiency ? ` - ${lang.proficiency}` : ''}`} category="language" />
                            ))
                            : primaryResume.skills.filter(s => s.category?.includes('language')).map(s => (
                              <SkillChip key={s.id} name={`${s.name}${s.proficiencyLevel ? ` - ${s.proficiencyLevel}` : ''}`} category="language" />
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  </CardGlass>

                  {/* Experiência profissional */}
                  <CardGlass className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Briefcase size={18} />
                      </div>
                      <h3 className="font-display font-bold text-base text-slate-200 dark:text-slate-200 light:text-slate-800">
                        Experiências Profissionais
                      </h3>
                    </div>

                    <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-outline-variant/10">
                      {displayExperience.map((exp, index) => (
                        <div key={(exp as any).id || index} className="relative pl-10 group">
                          {/* Timeline dot */}
                          <span className="absolute left-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-surface border-2 border-primary z-10 scale-100 group-hover:scale-125 group-hover:bg-primary transition-all duration-200" />
                          
                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                              <div>
                                <h4 className="font-bold text-sm text-slate-200 dark:text-slate-200 light:text-slate-800">
                                  {exp.role}
                                </h4>
                                <span className="text-xs text-brand-500 font-medium mt-0.5 block">
                                  {exp.companyName}
                                </span>
                              </div>
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-surface-container/50 px-2 py-0.5 rounded border border-outline-variant/10 whitespace-nowrap">
                                <Calendar size={10} />
                                {exp.startDate} - {exp.isCurrent ? 'Atual' : exp.endDate}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed font-normal">
                              {exp.description}
                            </p>

                            {/* Highlights with KPI highlighting */}
                            {exp.highlights && exp.highlights.length > 0 && (
                              <ul className="list-disc pl-4 pt-1 space-y-1.5 text-slate-500 text-xs">
                                {exp.highlights.map((high, hIdx) => {
                                  // Highlight numbers, percentages, currency, hours, years
                                  const parts = high.split(/(\d+%\s*|\d+\s*anos|\$\d+|\d+k\+?)/gi);
                                  return (
                                    <li key={hIdx} className="leading-relaxed">
                                      {parts.map((part, pIdx) => {
                                        const isHighlight = /(\d+%\s*|\d+\s*anos|\$\d+|\d+k\+?)/gi.test(part);
                                        return isHighlight ? (
                                          <strong key={pIdx} className="text-primary font-bold">{part}</strong>
                                        ) : (
                                          <span key={pIdx}>{part}</span>
                                        );
                                      })}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardGlass>
                </>
              )}

              {activeProfileTab === 'ai-profile' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Identidade Profissional */}
                  {activeInsights?.seniority_prediction && (
                    <CardGlass className="p-6 space-y-4 border-l-4 border-l-indigo-500">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                          <Brain className="text-indigo-400" size={18} />
                          Identidade Profissional
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="bg-background rounded-xl p-4 border border-border">
                          <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">
                            Senioridade Estimada
                          </span>
                          <p className="text-xl font-bold text-foreground mt-1">
                            {activeInsights.seniority_prediction.value || "Não calculada"}
                          </p>
                        </div>
                        <div className="bg-background rounded-xl p-4 border border-border">
                          <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">
                            Índice de Confiança
                          </span>
                          <p className="text-xl font-bold text-foreground mt-1">
                            {Math.round((activeInsights.seniority_prediction.confidence || 0.90) * 100)}%
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground italic bg-indigo-500/5 dark:bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/20 mt-2 leading-relaxed">
                        "Esta é uma estimativa calculada pela inteligência artificial a partir do tempo de carreira e escopo de liderança. {activeInsights.seniority_prediction.reason}"
                      </p>
                    </CardGlass>
                  )}

                  {/* Inteligência de Carreira */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CardGlass className="p-6 space-y-4">
                      <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2 border-b border-border pb-3">
                        <CheckCircle size={16} className="text-emerald-400" />
                        Pontos Fortes Mapeados
                      </h3>
                      <div className="space-y-3">
                        {activeInsights?.methodologies && activeInsights.methodologies.length > 0 ? (
                          activeInsights.methodologies.map((m, idx) => (
                            <div key={idx} className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10 space-y-1">
                              <span className="font-bold text-xs text-foreground">{m.methodology_name}</span>
                              <p className="text-[10px] text-muted-foreground">
                                Evidência com {Math.round((m.confidence || 0.9) * 100)}% de correspondência no currículo.
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-500">Mapeamento de evidências concluído.</div>
                        )}
                      </div>
                    </CardGlass>

                    <CardGlass className="p-6 space-y-4 md:col-span-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                        <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                          <AlertCircle size={16} className="text-amber-400" />
                          Gaps de Competências & Área Alvo
                        </h3>
                        
                        {/* Seletor de Área Desejada / Transição de Carreira */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-semibold shrink-0">Área Desejada:</span>
                          <select
                            value={selectedTargetDomain}
                            onChange={e => setSelectedTargetDomain(e.target.value)}
                            className="bg-background border border-border text-xs text-brand-600 dark:text-brand-300 font-bold rounded-lg px-2.5 py-1 outline-none focus:border-brand-500 cursor-pointer"
                          >
                            <option value="cozinha">🍳 Gastronomia / Cozinha / Alimentação</option>
                            <option value="ti">💻 TI / Software & Tecnologia</option>
                            <option value="admin">🏢 Administrativo / Suporte Operacional</option>
                            <option value="vendas">🎯 Vendas / Atendimento Comercial</option>
                            <option value="auto">🤖 Sugestão Automática do Currículo</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {/* Renderizar Gaps da Área Selecionada */}
                        {getDomainSkillGaps(selectedTargetDomain, activeInsights?.missing_skills?.value).map((gap, idx) => (
                          <div key={idx} className="bg-amber-500/5 rounded-xl p-3.5 border border-amber-500/15 space-y-1.5 shadow-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xs text-foreground">{gap.name}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold">
                                Confiança: {gap.confidence}%
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
                              {gap.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardGlass>
                  </div>

                  {/* ATS Optimization */}
                  {careerProfileNew?.ats_keywords && (
                    <CardGlass className="p-6 space-y-6">
                      <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2 border-b border-border pb-3">
                        <Award size={18} className="text-slate-400" />
                        Otimização de ATS
                      </h3>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Já Possui (Existing)</label>
                          <div className="flex flex-wrap gap-1.5">
                            {careerProfileNew.ats_keywords.existing_keywords && careerProfileNew.ats_keywords.existing_keywords.length > 0 ? (
                              careerProfileNew.ats_keywords.existing_keywords.map((kw, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/25">
                                  {kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500 text-[10px]">Nenhum termo extraído.</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border">
                          <label className="text-xs font-semibold text-red-600 dark:text-red-400">Ausentes no Currículo</label>
                          <div className="flex flex-wrap gap-1.5">
                            {careerProfileNew.ats_keywords.missing_keywords && careerProfileNew.ats_keywords.missing_keywords.length > 0 ? (
                              careerProfileNew.ats_keywords.missing_keywords.map((kw, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold border border-red-500/25">
                                  {kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500 text-[10px]">Nenhum termo ausente.</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border">
                          <label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Recomendadas para a Vaga</label>
                          <div className="flex flex-wrap gap-1.5">
                            {careerProfileNew.ats_keywords.recommended_keywords && careerProfileNew.ats_keywords.recommended_keywords.length > 0 ? (
                              careerProfileNew.ats_keywords.recommended_keywords.map((kw, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-500/25">
                                  {kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500 text-[10px]">Nenhum termo recomendado.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardGlass>
                  )}
                </div>
              )}

              {activeProfileTab === 'transparency' && (
                /* Painel de Transparência com career_insights — linguagem de usuário */
                <CardGlass className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-4">
                    <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                      <Brain size={18} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-200 dark:text-slate-200 light:text-slate-800">
                        Como a IA chegou nesta conclusão?
                      </h3>
                      <p className="text-[10px] text-slate-500">Aqui estão as principais conclusões da análise do seu currículo, em linguagem simples.</p>
                    </div>
                  </div>

                  {activeInsights ? (
                    <div className="space-y-5">
                      {/* Senioridade */}
                      {activeInsights.seniority_prediction?.value && (
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] uppercase font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">Senioridade</span>
                            <span className="text-[10px] text-slate-500">{Math.round((activeInsights.seniority_prediction.confidence || 0.9) * 100)}% de confiança</span>
                          </div>
                          <p className="text-sm font-bold text-slate-200">{activeInsights.seniority_prediction.value}</p>
                          {activeInsights.seniority_prediction.reason && (
                            <p className="text-xs text-slate-400 mt-1">{activeInsights.seniority_prediction.reason}</p>
                          )}
                        </div>
                      )}

                      {/* Indústria */}
                      {activeInsights.industry_prediction?.value && (
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">Setor Identificado</span>
                          </div>
                          <p className="text-sm font-bold text-slate-200">{activeInsights.industry_prediction.value}</p>
                          {activeInsights.industry_prediction.reason && (
                            <p className="text-xs text-slate-400 mt-1">{activeInsights.industry_prediction.reason}</p>
                          )}
                        </div>
                      )}

                      {/* Metodologias */}
                      {activeInsights.methodologies && activeInsights.methodologies.length > 0 && (
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Metodologias Identificadas</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {activeInsights.methodologies.map((m, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-xs text-emerald-300 font-semibold">
                                {m.methodology_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Skills — apenas se genuinamente ausentes */}
                      {activeInsights.missing_skills?.value && activeInsights.missing_skills.value.length > 0 && (
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-amber-500/10">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Oportunidades de Desenvolvimento</span>
                            <Info size={12} className="text-slate-500" />
                          </div>
                          <p className="text-[10px] text-slate-500 mb-2">{activeInsights.missing_skills.reason}</p>
                          <div className="flex flex-wrap gap-2">
                            {activeInsights.missing_skills.value.slice(0, 8).map((s, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-500/5 border border-amber-500/15 text-xs text-amber-300 font-semibold">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs flex flex-col items-center justify-center min-h-[200px]">
                      <Zap size={22} className="text-slate-600 mb-2 animate-pulse" />
                      <span>As conclusões da IA aparecerão aqui após o processamento do seu currículo.</span>
                    </div>
                  )}
                </CardGlass>
              )}


            </div>
          ) : (
            <div className="h-64 rounded-2xl border border-dashed border-slate-800 dark:border-slate-800 light:border-slate-300 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
              <FileText size={28} className="mb-2 text-slate-600" />
              <span>Nenhum currículo ativo cadastrado. Realize o upload no painel esquerdo para visualizar a estruturação.</span>
            </div>
          )}
        </div>
      </div>
      )}

      <PaywallModal
        isOpen={paywallState.isOpen}
        onClose={closePaywall}
        feature={paywallState.feature}
        title={paywallState.title}
        description={paywallState.description}
        primaryButtonText={paywallState.primaryButtonText}
        secondaryButtonText={paywallState.secondaryButtonText}
        onUpgrade={() => setShowCheckout(true)}
      />

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        userId={user?.id}
        userEmail={user?.email}
        userName={user?.email?.split('@')[0]}
      />
    </div>
  );
}
