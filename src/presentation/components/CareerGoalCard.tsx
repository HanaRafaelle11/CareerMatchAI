import React, { useState, useEffect } from 'react';
import type { CareerGoal, CareerGoalIntentType } from '../../domain/models/types';
import { CardGlass } from './CardGlass';
import { Badge } from './ds/Badge';
import { Target, Compass, TrendingUp, Sparkles, Check, Save, ArrowRight } from 'lucide-react';

interface CareerGoalCardProps {
  goal: CareerGoal | null;
  onSave: (data: Partial<CareerGoal> & { intentType: CareerGoalIntentType }) => Promise<any>;
  userSkills?: string[];
  className?: string;
}

export const CareerGoalCard: React.FC<CareerGoalCardProps> = ({
  goal,
  onSave,
  userSkills: _userSkills = [],
  className = ''
}) => {
  const [intentType, setIntentType] = useState<CareerGoalIntentType>(goal?.intentType || 'same_area_continue');
  const [targetArea, setTargetArea] = useState(goal?.targetArea || '');
  const [targetRolesInput, setTargetRolesInput] = useState(goal?.targetRoles?.join(', ') || '');
  const [targetIndustriesInput, setTargetIndustriesInput] = useState(goal?.targetIndustries?.join(', ') || '');
  const [targetSeniority, setTargetSeniority] = useState(goal?.targetSeniority || 'pleno');
  const [targetLocation, setTargetLocation] = useState(goal?.targetLocation || '');
  const [targetWorkModes, setTargetWorkModes] = useState<Array<'remote' | 'hybrid' | 'onsite'>>(goal?.targetWorkModes || ['remote']);
  const [desiredSalaryMin, setDesiredSalaryMin] = useState<number | undefined>(goal?.desiredSalaryMin);
  const [desiredSalaryMax, setDesiredSalaryMax] = useState<number | undefined>(goal?.desiredSalaryMax);
  const [salaryCurrency, setSalaryCurrency] = useState<string>(goal?.salaryCurrency || 'BRL');
  const [desiredSalary, setDesiredSalary] = useState(goal?.desiredSalary || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (goal) {
      setIntentType(goal.intentType || 'same_area_continue');
      setTargetArea(goal.targetArea || '');
      setTargetRolesInput(goal.targetRoles?.join(', ') || '');
      setTargetIndustriesInput(goal.targetIndustries?.join(', ') || '');
      setTargetSeniority(goal.targetSeniority || 'pleno');
      setTargetLocation(goal.targetLocation || '');
      setTargetWorkModes(goal.targetWorkModes || ['remote']);
      setDesiredSalaryMin(goal.desiredSalaryMin);
      setDesiredSalaryMax(goal.desiredSalaryMax);
      setSalaryCurrency(goal.salaryCurrency || 'BRL');
      setDesiredSalary(goal.desiredSalary || '');
    }
  }, [goal]);

  const handleToggleWorkMode = (mode: 'remote' | 'hybrid' | 'onsite') => {
    if (targetWorkModes.includes(mode)) {
      if (targetWorkModes.length > 1) {
        setTargetWorkModes(targetWorkModes.filter(m => m !== mode));
      }
    } else {
      setTargetWorkModes([...targetWorkModes, mode]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const parsedRoles = targetRolesInput
        .split(',')
        .map(r => r.trim())
        .filter(Boolean);

      const parsedIndustries = targetIndustriesInput
        .split(',')
        .map(i => i.trim())
        .filter(Boolean);

      await onSave({
        intentType,
        targetArea: intentType === 'career_transition' || intentType === 'same_area_grow' ? targetArea : undefined,
        targetRoles: parsedRoles,
        targetIndustries: parsedIndustries,
        targetSeniority,
        targetLocation,
        targetWorkModes,
        desiredSalaryMin,
        desiredSalaryMax,
        salaryCurrency,
        desiredSalary: desiredSalaryMin ? `${salaryCurrency} ${desiredSalaryMin}${desiredSalaryMax ? ' - ' + desiredSalaryMax : ''}` : desiredSalary
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar objetivo:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const options: Array<{
    type: CareerGoalIntentType;
    title: string;
    desc: string;
    icon: React.ReactNode;
    badge: string;
  }> = [
    {
      type: 'same_area_continue',
      title: 'Continuar na minha área',
      desc: 'Buscar novas oportunidades e manter minha atuação no mesmo segmento.',
      icon: <Target className="text-emerald-500" size={20} />,
      badge: 'Continuidade'
    },
    {
      type: 'same_area_grow',
      title: 'Crescer profissionalmente',
      desc: 'Buscar posições de maior senioridade e liderança técnica na minha área.',
      icon: <TrendingUp className="text-brand-500" size={20} />,
      badge: 'Crescimento'
    },
    {
      type: 'career_transition',
      title: 'Mudar de carreira',
      desc: 'Transicionar para uma nova área aproveitando minhas competências transferíveis.',
      icon: <Compass className="text-purple-500" size={20} />,
      badge: 'Transição'
    },
    {
      type: 'exploring',
      title: 'Ainda estou explorando',
      desc: 'Descobrir caminhos e possibilidades alinhadas às minhas habilidades.',
      icon: <Sparkles className="text-amber-500" size={20} />,
      badge: 'Exploração'
    }
  ];

  return (
    <CardGlass className={`p-6 sm:p-7 border-slate-200 dark:border-slate-800/90 shadow-xl relative overflow-hidden ${className}`}>
      <div className="space-y-6">
        
        {/* Header com distinção explícita de "Para onde quero ir" */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Para onde você quer ir
              </span>
              <Badge variant="premium" size="sm">Objetivo Declarado</Badge>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              Objetivo Profissional
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Diga o que você busca agora para calibrarmos a otimização de currículo e a recomendação de vagas.
            </p>
          </div>

          {savedSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 animate-fade-in">
              <Check size={14} />
              Objetivo salvo com sucesso!
            </span>
          )}
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          
          {/* Seletor Central dos 4 Modos de Decisão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {options.map((opt) => {
              const isSelected = intentType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setIntentType(opt.type)}
                  className={`text-left p-4 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-500 shadow-md shadow-purple-500/10 ring-1 ring-purple-500/40'
                      : 'bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {opt.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {opt.title}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Campos condicionais para Transição de Carreira e Crescimento */}
          {(intentType === 'career_transition' || intentType === 'same_area_grow') && (
            <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-4 animate-fade-in">
              <div className="flex items-center gap-2">
                <Compass className="text-purple-500" size={16} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  {intentType === 'career_transition' ? 'Detalhes da Transição Pretendida' : 'Direcionamento de Crescimento'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Área Desejada */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Área ou Segmento Desejado
                  </label>
                  <input
                    type="text"
                    value={targetArea}
                    onChange={(e) => setTargetArea(e.target.value)}
                    placeholder="Ex: Administrativo, Tecnologia, Produto, RH..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Cargos Alvo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Cargos Alvo (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    value={targetRolesInput}
                    onChange={(e) => setTargetRolesInput(e.target.value)}
                    placeholder="Ex: Assistente Administrativo, Analista Júnior..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Senioridade */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Senioridade Pretendida
                  </label>
                  <select
                    value={targetSeniority}
                    onChange={(e) => setTargetSeniority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="junior">Júnior / Entrada</option>
                    <option value="pleno">Pleno</option>
                    <option value="senior">Sênior</option>
                    <option value="lead">Liderança / Gestão</option>
                    <option value="specialist">Especialista</option>
                  </select>
                </div>

                {/* Localização */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Localização Preferida
                  </label>
                  <input
                    type="text"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    placeholder="Ex: São Paulo, SP ou Remoto Brasil"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Setores e Indústrias Alvo */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Setores / Indústrias Alvo (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    value={targetIndustriesInput}
                    onChange={(e) => setTargetIndustriesInput(e.target.value)}
                    placeholder="Ex: Fintech, Saúde / Healthtech, SaaS, E-commerce, Educação..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Modelo de Trabalho */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Modelo de Trabalho Aceito
                  </label>
                  <div className="flex gap-2.5 flex-wrap">
                    {(['remote', 'hybrid', 'onsite'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleToggleWorkMode(mode)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                          targetWorkModes.includes(mode)
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800'
                        }`}
                      >
                        {mode === 'remote' ? '🏠 100% Remoto' : mode === 'hybrid' ? '🏢 Híbrido' : '🏛️ Presencial'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Faixa Salarial Pretendida */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Faixa Salarial Pretendida
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Mínimo</span>
                      <input
                        type="number"
                        value={desiredSalaryMin !== undefined ? desiredSalaryMin : ''}
                        onChange={(e) => setDesiredSalaryMin(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Ex: 3500"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Máximo / Alvo</span>
                      <input
                        type="number"
                        value={desiredSalaryMax !== undefined ? desiredSalaryMax : ''}
                        onChange={(e) => setDesiredSalaryMax(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Ex: 6000"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Moeda</span>
                      <select
                        value={salaryCurrency}
                        onChange={(e) => setSalaryCurrency(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="BRL">R$ (BRL)</option>
                        <option value="USD">$ (USD)</option>
                        <option value="EUR">€ (EUR)</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Botão de Ação Salvar */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span>Salvando objetivo...</span>
              ) : (
                <>
                  <Save size={15} />
                  <span>Salvar Objetivo Profissional</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </CardGlass>
  );
};
