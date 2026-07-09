import { useState, type FormEvent, useEffect } from 'react';
import { CardGlass } from '../components/CardGlass';
import type { CareerProfile } from '../../domain/models/types';
import { Save, Plus, X, Award, CheckCircle, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';

import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';

interface CareerProfilePageProps {
  careerProfile: CareerProfile | null;
  careerProfileNew: CareerProfileNew | null;
  onSaveProfile: (profile: CareerProfile) => Promise<any>;
  isSaving: boolean;
  setActiveTab: (tab: string) => void;
}

export function CareerProfilePage({
  careerProfile,
  careerProfileNew: _careerProfileNew,
  onSaveProfile,
  isSaving,
  setActiveTab
}: CareerProfilePageProps) {

  // Estados dos formulários mapeados do perfil
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [seniority, setSeniority] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [preferredWorkModes, setPreferredWorkModes] = useState<('remote' | 'hybrid' | 'onsite')[]>([]);
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [salaryExpectationMin, setSalaryExpectationMin] = useState(0);
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);
  const [isApproved, setIsApproved] = useState(false);

  // Estados auxiliares de inputs manuais (inputs de tags)
  const [newRole, setNewRole] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newTool, setNewTool] = useState('');
  const [newLang, setNewLang] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sincroniza estados quando o perfil de carreira for carregado
  useEffect(() => {
    if (careerProfile) {
      setTargetRoles(careerProfile.targetRoles);
      setSeniority(careerProfile.seniority);
      setIndustries(careerProfile.industries);
      setSkills(careerProfile.skills);
      setTools(careerProfile.tools);
      setLanguages(careerProfile.languages);
      setPreferredLocations(careerProfile.preferredLocations);
      setPreferredWorkModes(careerProfile.preferredWorkModes);
      setTargetCompanies(careerProfile.targetCompanies);
      setSalaryExpectationMin(careerProfile.salaryExpectationMin);
      setSearchKeywords(careerProfile.searchKeywords);
      setIsApproved(careerProfile.isApprovedByUser);
    }
  }, [careerProfile]);

  const handleSave = async (e: FormEvent, approveOverride = false) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!careerProfile) {
      setErrorMsg('Nenhum perfil de carreira ativo encontrado para salvar.');
      return;
    }

    const updatedProfile: CareerProfile = {
      ...careerProfile,
      targetRoles,
      seniority,
      industries,
      skills,
      tools,
      languages,
      preferredLocations,
      preferredWorkModes,
      targetCompanies,
      salaryExpectationMin,
      searchKeywords,
      isApprovedByUser: approveOverride ? true : isApproved,
      updatedAt: new Date().toISOString()
    };

    try {
      await onSaveProfile(updatedProfile);
      setSuccessMsg('Perfil de carreira atualizado com sucesso!');
      if (approveOverride) {
        setIsApproved(true);
      }
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg('Erro ao salvar as alterações do perfil.');
    }
  };

  const addTag = (val: string, setList: React.Dispatch<React.SetStateAction<string[]>>, clearInput: () => void) => {
    if (val.trim()) {
      setList(prev => Array.from(new Set([...prev, val.trim()])));
      clearInput();
    }
  };

  const removeTag = (tag: string, setList: React.Dispatch<React.SetStateAction<any[]>>) => {
    setList(prev => prev.filter(t => t !== tag));
  };

  const toggleWorkMode = (mode: 'remote' | 'hybrid' | 'onsite') => {
    setPreferredWorkModes(prev => 
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans p-2">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-800">
            Meu Perfil de Carreira
          </h1>
          <p className="text-slate-400 dark:text-slate-400 light:text-slate-500 text-sm mt-1">
            Esta é a base que a IA usa para pesquisar e priorizar suas vagas diariamente. Ajuste as informações abaixo.
          </p>
        </div>
      </div>

      {/* Banner de Aprovação Pendente */}
      {careerProfile && !isApproved && (
        <CardGlass className="p-4 bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-3 items-start">
            <ShieldAlert size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-slate-200">Revisão do Perfil Gerado por IA</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Este perfil foi sugerido automaticamente a partir da análise do seu currículo. Revise os campos e clique em aprovar para usá-lo na descoberta de vagas.
              </p>
            </div>
          </div>
          <button
            onClick={(e) => handleSave(e, true)}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10 whitespace-nowrap"
          >
            Aprovar Perfil
            <ArrowRight size={14} />
          </button>
        </CardGlass>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400 text-xs">
          <CheckCircle size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!careerProfile ? (
        <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 text-xs">
          <Award size={32} className="mb-2 text-slate-600" />
          <span>Nenhum currículo ativo encontrado. Faça o upload do seu currículo na aba "Meu Currículo" para gerar sua meta profissional.</span>
          <button
            onClick={() => setActiveTab('profile')}
            className="mt-4 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs"
          >
            Ir para Upload
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => handleSave(e)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna Esquerda: Objetivo Profissional & Preferências */}
            <div className="space-y-6">
              <CardGlass className="p-6 space-y-6">
                <h3 className="font-display font-bold text-base text-slate-200 border-b border-slate-900 pb-3">
                  Objetivo Profissional
                </h3>

                {/* Cargos Alvos */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Cargos Desejados</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Customer Success Manager"
                      value={newRole}
                      onChange={e => setNewRole(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(newRole, setTargetRoles, () => setNewRole('')))}
                    />
                    <button
                      type="button"
                      onClick={() => addTag(newRole, setTargetRoles, () => setNewRole(''))}
                      className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {targetRoles.map(role => (
                      <span key={role} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-xs border border-brand-500/20 font-medium">
                        {role}
                        <button type="button" onClick={() => removeTag(role, setTargetRoles)} className="text-brand-400 hover:text-red-400">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Senioridade */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Senioridade Desejada</label>
                  <input
                    type="text"
                    placeholder="Ex: Manager, Sênior, Pleno"
                    value={seniority}
                    onChange={e => setSeniority(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                    required
                  />
                </div>

                {/* Setores de interesse */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Áreas de Interesse / Setores</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: SaaS, Fintech, EdTech"
                      value={newIndustry}
                      onChange={e => setNewIndustry(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(newIndustry, setIndustries, () => setNewIndustry('')))}
                    />
                    <button
                      type="button"
                      onClick={() => addTag(newIndustry, setIndustries, () => setNewIndustry(''))}
                      className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {industries.map(ind => (
                      <span key={ind} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700 font-medium">
                        {ind}
                        <button type="button" onClick={() => removeTag(ind, setIndustries)} className="text-slate-500 hover:text-red-400">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </CardGlass>

              <CardGlass className="p-6 space-y-6">
                <h3 className="font-display font-bold text-base text-slate-200 border-b border-slate-900 pb-3">
                  Preferências & Salário
                </h3>

                {/* Modelos de trabalho */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 block">Modelo de Trabalho</label>
                  <div className="flex gap-3">
                    {['remote', 'hybrid', 'onsite'].map(mode => {
                      const isActive = preferredWorkModes.includes(mode as any);
                      const labels: Record<string, string> = { remote: 'Remoto', hybrid: 'Híbrido', onsite: 'Presencial' };
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => toggleWorkMode(mode as any)}
                          className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {labels[mode]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Localidades */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Localizações Preferidas</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: São Paulo, Remoto Nacional, Brasil inteiro"
                      value={newLocation}
                      onChange={e => setNewLocation(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(newLocation, setPreferredLocations, () => setNewLocation('')))}
                    />
                    <button
                      type="button"
                      onClick={() => addTag(newLocation, setPreferredLocations, () => setNewLocation(''))}
                      className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {preferredLocations.map(loc => (
                      <span key={loc} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700 font-medium">
                        {loc}
                        <button type="button" onClick={() => removeTag(loc, setPreferredLocations)} className="text-slate-500 hover:text-red-400">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expectativa Salarial */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Expectativa Salarial Mínima (R$ / Mês)</label>
                  <input
                    type="number"
                    value={salaryExpectationMin}
                    onChange={e => setSalaryExpectationMin(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                    min={0}
                    required
                  />
                </div>
              </CardGlass>
            </div>

            {/* Coluna Direita: Competências e Mercado Alvo */}
            <div className="space-y-6">
              <CardGlass className="p-6 space-y-6">
                <h3 className="font-display font-bold text-base text-slate-200 border-b border-slate-900 pb-3">
                  Competências & Ferramentas
                </h3>

                {/* Competências Fortes */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Competências Principais</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Customer Success, Liderança"
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(newSkill, setSkills, () => setNewSkill('')))}
                    />
                    <button
                      type="button"
                      onClick={() => addTag(newSkill, setSkills, () => setNewSkill(''))}
                      className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {skills.map(sk => (
                      <span key={sk} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20 font-medium">
                        ✅ {sk}
                        <button type="button" onClick={() => removeTag(sk, setSkills)} className="text-emerald-500 hover:text-red-400">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Ferramentas */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Ferramentas & Softwares</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Salesforce, SQL, Hubspot"
                      value={newTool}
                      onChange={e => setNewTool(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(newTool, setTools, () => setNewTool('')))}
                    />
                    <button
                      type="button"
                      onClick={() => addTag(newTool, setTools, () => setNewTool(''))}
                      className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tools.map(tl => (
                      <span key={tl} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20 font-medium">
                        ⚠ {tl}
                        <button type="button" onClick={() => removeTag(tl, setTools)} className="text-amber-500 hover:text-red-400">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Idiomas */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Idiomas</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Inglês fluente, Espanhol básico"
                      value={newLang}
                      onChange={e => setNewLang(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(newLang, setLanguages, () => setNewLang('')))}
                    />
                    <button
                      type="button"
                      onClick={() => addTag(newLang, setLanguages, () => setNewLang(''))}
                      className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {languages.map(lang => (
                      <span key={lang} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs border border-indigo-500/20 font-medium">
                        {lang}
                        <button type="button" onClick={() => removeTag(lang, setLanguages)} className="text-indigo-500 hover:text-red-400">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </CardGlass>

              <CardGlass className="p-6 space-y-6">
                <h3 className="font-display font-bold text-base text-slate-200 border-b border-slate-900 pb-3">
                  Mercado Alvo & Palavras-chave
                </h3>

                {/* Empresas desejadas */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Empresas Desejadas</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: iFood, Stripe, Omie"
                      value={newCompany}
                      onChange={e => setNewCompany(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(newCompany, setTargetCompanies, () => setNewCompany('')))}
                    />
                    <button
                      type="button"
                      onClick={() => addTag(newCompany, setTargetCompanies, () => setNewCompany(''))}
                      className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {targetCompanies.map(comp => (
                      <span key={comp} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700 font-medium">
                        {comp}
                        <button type="button" onClick={() => removeTag(comp, setTargetCompanies)} className="text-slate-500 hover:text-red-400">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Palavras-chave de busca */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Palavras-chave de busca automática</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Customer Success Manager, Churn"
                      value={newKeyword}
                      onChange={e => setNewKeyword(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(newKeyword, setSearchKeywords, () => setNewKeyword('')))}
                    />
                    <button
                      type="button"
                      onClick={() => addTag(newKeyword, setSearchKeywords, () => setNewKeyword(''))}
                      className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {searchKeywords.map(kw => (
                      <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700 font-medium">
                        {kw}
                        <button type="button" onClick={() => removeTag(kw, setSearchKeywords)} className="text-slate-500 hover:text-red-400">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </CardGlass>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
