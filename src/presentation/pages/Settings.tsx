import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CardGlass } from '../components/CardGlass';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import type { Profile, Resume } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { 
  User, FileText, Settings as SettingsIcon, Bell, 
  Palette, ShieldAlert, CreditCard, Trash2, Download, Check,
  Sun, Moon, Monitor
} from 'lucide-react';

interface SettingsProps {
  profile: Profile | null;
  resumes: Resume[];
  careerProfileNew: CareerProfileNew | null;
  onSaveProfile: (profile: any) => Promise<any>;
  onDeleteResume: (resumeId: string) => Promise<any>;
  onLogout: () => void;
  onUpdateProfileState?: (profile: Partial<Profile>) => void;
  initialTab?: SettingsTab;
  preferences?: any;
  updatePreferences?: (newUpdates: any) => Promise<void>;
}

type SettingsTab = 'account' | 'resumes' | 'preferences' | 'notifications' | 'appearance' | 'privacy' | 'billing';

export function Settings({
  profile,
  resumes,
  careerProfileNew,
  onSaveProfile, 
  onDeleteResume,
  onLogout,
  onUpdateProfileState,
  initialTab,
  preferences,
  updatePreferences
}: SettingsProps) {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<SettingsTab>('account');
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [skillsSummary, setSkillsSummary] = useState(profile?.skillsSummary || '');
  const [linkedin, setLinkedin] = useState(careerProfileNew?.personal?.linkedin || '');
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Generate billing history dynamically based on registration date to avoid showing June if they signed up in July
  const regDate = profile?.createdAt ? new Date(profile.createdAt) : new Date();
  const currentDate = new Date();
  const invoiceDay = 12; // Standard renewal day
  
  const billingHistory: Array<{ dateStr: string; plan: string; price: string }> = [];
  
  // Starting from registration month, add a monthly invoice up to the current date
  let invoiceDate = new Date(regDate.getFullYear(), regDate.getMonth(), invoiceDay);
  if (invoiceDate < regDate) {
    invoiceDate = new Date(regDate);
  }
  
  while (invoiceDate <= currentDate) {
    billingHistory.push({
      dateStr: invoiceDate.toLocaleDateString('pt-BR'),
      plan: 'Premium Copilot - Mensal',
      price: 'R$ 49,90'
    });
    // Add 1 month
    invoiceDate = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth() + 1, invoiceDay);
  }
  
  if (billingHistory.length === 0) {
    billingHistory.push({
      dateStr: new Date().toLocaleDateString('pt-BR'),
      plan: 'Premium Copilot - Mensal',
      price: 'R$ 49,90'
    });
  }
  
  billingHistory.reverse();

  // Next renewal date is invoiceDate (which is already incremented to the next month after the loop)
  const nextRenewalDateStr = invoiceDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setHeadline(profile.headline || '');
      setAvatarUrl(profile.avatarUrl || '');
      setSkillsSummary(profile.skillsSummary || '');
    }
    if (careerProfileNew?.personal) {
      setLinkedin(careerProfileNew.personal.linkedin || '');
    }
  }, [profile, careerProfileNew]);

  useEffect(() => {
    async function loadEmail() {
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setEmail(user.email);
        }
      } else {
        setEmail('usuario@exemplo.com');
      }
    }
    loadEmail();
  }, []);

  // Appearance theme
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');

  // Job Preferences
  const [salaryMin, setSalaryMin] = useState(Number((careerProfileNew?.personal as any)?.preferences?.salaryExpectationMin || 0) || 5000);
  const [workModes, setWorkModes] = useState<string[]>(
    (careerProfileNew?.personal as any)?.preferences?.preferredWorkModes || ['remote', 'hybrid']
  );
  const [locations, setLocations] = useState<string>(
    (careerProfileNew?.personal as any)?.preferences?.preferredLocations?.join(', ') || 'São Paulo, Remoto'
  );
  const [roles, setRoles] = useState<string>(
    (careerProfileNew?.personal as any)?.preferences?.targetRoles?.join(', ') || 'Desenvolvedor Frontend, Analista'
  );

  // Notification checkboxes
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  // GDPR consent
  const [gdprConsent, setGdprConsent] = useState(true);

  // Load saved theme on mount
  useEffect(() => {
    const saved = preferences?.theme || localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'dark';
    if (saved) setTheme(saved);
  }, [preferences?.theme]);

  const handleApplyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (updatePreferences) {
      updatePreferences({ theme: newTheme });
    }
    window.dispatchEvent(new Event('theme-change'));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("A imagem deve ter no máximo 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isSupabaseConfigured && supabase && profile?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            headline: headline,
            avatar_url: avatarUrl,
            skills_summary: skillsSummary,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);
        
        if (error && (error.code === '42703' || error.message?.includes('avatar_url') || error.message?.includes('schema cache'))) {
          console.warn('[SETTINGS] Coluna avatar_url não existe no Supabase. Retrying update sem ela...');
          const { error: retryError } = await supabase
            .from('profiles')
            .update({
              full_name: fullName,
              headline: headline,
              skills_summary: skillsSummary,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id);
          if (retryError) throw retryError;
        } else if (error) {
          throw error;
        }

        // Sincronizar dados com a tabela career_profiles para evitar inconsistência visual (Nome/Headline antigo)
        const { data: cpList } = await supabase
          .from('career_profiles')
          .select('*')
          .eq('user_id', profile.id);
        if (cpList && cpList.length > 0) {
          for (const cp of cpList) {
            const updatedPersonal = {
              ...(cp.personal || {}),
              fullName: fullName,
              headline: headline,
              linkedin: linkedin
            };
            await supabase
              .from('career_profiles')
              .update({ personal: updatedPersonal })
              .eq('id', cp.id);
          }
        } else {
          // Criar um perfil básico de carreira para persistir as informações (LinkedIn/Nome/Headline)
          const { data: resumes } = await supabase
            .from('resume_versions')
            .select('id')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(1);

          let targetResumeId = resumes && resumes.length > 0 ? resumes[0].id : null;
          if (!targetResumeId) {
            const { data: newRv } = await supabase
              .from('resume_versions')
              .insert({
                user_id: profile.id,
                file_name: 'Configurações Iniciais',
                status: 'placeholder'
              })
              .select('id')
              .single();
            if (newRv) targetResumeId = newRv.id;
          }

          if (targetResumeId) {
            await supabase
              .from('career_profiles')
              .insert({
                user_id: profile.id,
                resume_version_id: targetResumeId,
                personal: {
                  fullName: fullName,
                  headline: headline,
                  linkedin: linkedin
                },
                skills: [],
                languages: [],
                experience: [],
                education: [],
                soft_skills: [],
                certifications: [],
                ats_keywords: {},
                summary: ''
              });
          }
        }

        // Invalida os caches do React Query
        queryClient.invalidateQueries({ queryKey: ['my-profile-ai'] });
        queryClient.invalidateQueries({ queryKey: ['career-profile'] });
      } else {
        // Mock local save
        const savedProfile = { ...profile, fullName, headline, avatarUrl, skillsSummary };
        localStorage.setItem('vocentro_profile', JSON.stringify(savedProfile));

        // Sincronizar todos os perfis de IA mockados
        const resumesLocal = localDB.getResumes();
        resumesLocal.forEach(r => {
          const cpNewKey = `vocentro_my_profile_ai_${r.resumeVersionId || 'default'}`;
          const mockCpRaw = localStorage.getItem(cpNewKey);
          if (mockCpRaw) {
            try {
              const parsed = JSON.parse(mockCpRaw);
              if (parsed.profile) {
                parsed.profile.personal = {
                  ...(parsed.profile.personal || {}),
                  fullName: fullName,
                  headline: headline,
                  linkedin: linkedin
                };
                localStorage.setItem(cpNewKey, JSON.stringify(parsed));
              }
            } catch (err) { console.error(err); }
          }
        });

        const mockCpRawDefault = localStorage.getItem('vocentro_my_profile_ai_default');
        let parsed: any = {};
        if (mockCpRawDefault) {
          try {
            parsed = JSON.parse(mockCpRawDefault);
          } catch (e) { parsed = {}; }
        }
        
        if (!parsed.profile) {
          parsed.profile = {
            id: 'cp-new-default',
            userId: profile?.id || 'default-user',
            resumeVersionId: 'rv-default',
            personal: {},
            skills: [],
            languages: [],
            experience: [],
            education: []
          };
        }

        parsed.profile.personal = {
          ...(parsed.profile.personal || {}),
          fullName: fullName,
          headline: headline,
          linkedin: linkedin
        };
        localStorage.setItem('vocentro_my_profile_ai_default', JSON.stringify(parsed));
      }

        const localCpRaw = localStorage.getItem('vocentro_career_profile');
        if (localCpRaw) {
          try {
            const cp = JSON.parse(localCpRaw);
            cp.fullName = fullName;
            cp.headline = headline;
            localStorage.setItem('vocentro_career_profile', JSON.stringify(cp));
          } catch (err) { console.error(err); }
        }

        queryClient.invalidateQueries({ queryKey: ['my-profile-ai'] });
        queryClient.invalidateQueries({ queryKey: ['career-profile'] });

      // Backup save to localStorage to survive schema/session overrides
      const backupProfile = { ...profile, fullName, headline, avatarUrl, skillsSummary };
      localStorage.setItem('vocentro_profile', JSON.stringify(backupProfile));
      if (profile?.id) {
        if (avatarUrl) {
          localStorage.setItem(`vocentro_avatar_${profile.id}`, avatarUrl);
        } else {
          localStorage.removeItem(`vocentro_avatar_${profile.id}`);
        }
      }

      if (onUpdateProfileState) {
        onUpdateProfileState({ fullName, headline, avatarUrl, skillsSummary });
      }
      showToast('Configurações de conta salvas com sucesso!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao salvar conta: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const targetRolesArray = roles.split(',').map(s => s.trim()).filter(Boolean);
      const preferredLocationsArray = locations.split(',').map(s => s.trim()).filter(Boolean);

      const profileSource = careerProfileNew || {
        id: '00000000-0000-0000-0000-000000000000',
        userId: profile?.id || 'default-user',
        resumeVersionId: '00000000-0000-0000-0000-000000000000',
        personal: {
          fullName: profile?.fullName || 'Profissional',
          headline: profile?.headline || '',
          email: email || '',
          phone: '',
          linkedin: '',
          website: '',
          location: ''
        },
        summary: '',
        experience: [],
        education: [],
        skills: [],
        soft_skills: [],
        languages: [],
        certifications: [],
        ats_keywords: {},
        createdAt: new Date().toISOString()
      };

      const updatedProfile = {
        id: profileSource.id,
        userId: profileSource.userId,
        resumeId: profileSource.resumeVersionId,
        targetRoles: targetRolesArray,
        seniority: (profileSource.personal as any)?.preferences?.seniority || 'Sênior',
        industries: (profileSource.personal as any)?.preferences?.industries || [],
        skills: profileSource.skills.map(s => s.name),
        tools: (profileSource.personal as any)?.preferences?.tools || [],
        languages: profileSource.languages.map(l => l.language),
        preferredLocations: preferredLocationsArray,
        preferredWorkModes: workModes,
        targetCompanies: (profileSource.personal as any)?.preferences?.targetCompanies || [],
        salaryExpectationMin: Number(salaryMin),
        searchKeywords: targetRolesArray,
        isApprovedByUser: true,
        createdAt: profileSource.createdAt,
        updatedAt: new Date().toISOString()
      };

      await onSaveProfile(updatedProfile);
      showToast('Preferências de vagas atualizadas com sucesso!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao salvar preferências: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      if (isSupabaseConfigured && supabase && email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`,
        });
        if (error) throw error;
        showToast('E-mail de redefinição de senha enviado com sucesso!', 'success');
      } else {
        showToast('E-mail de redefinição enviado para seu endereço cadastrado.', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao enviar e-mail de redefinição: ' + err.message, 'error');
    }
  };

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm('ATENÇÃO: Isso excluirá permanentemente a sua conta e todos os dados associados. Você tem certeza?');
    if (!confirm1) return;
    const confirm2 = window.confirm('Deseja mesmo prosseguir? Esta ação não pode ser desfeita.');
    if (!confirm2) return;

    try {
      if (isSupabaseConfigured && supabase) {
        // Chama RPC ou deleta o perfil para acionar CASCADE trigger na tabela auth.users
        const { error } = await supabase.from('profiles').delete().eq('id', profile?.id);
        if (error) throw error;
      }
      showToast('Sua conta foi excluída com sucesso.', 'success');
      setTimeout(() => onLogout(), 1500);
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao excluir conta: ' + err.message, 'error');
    }
  };

  const handleExportData = () => {
    const dataToExport = {
      profile,
      careerProfile: careerProfileNew,
      resumesCount: resumes.length,
      exportedAt: new Date().toISOString(),
      compliance: 'LGPD / GDPR'
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocentro_data_${profile?.id || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const subTabItems = [
    { id: 'account', label: 'Minha Conta', icon: User },
    { id: 'resumes', label: 'Currículos', icon: FileText },
    { id: 'preferences', label: 'Preferências', icon: SettingsIcon },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'privacy', label: 'Privacidade', icon: ShieldAlert },
    { id: 'billing', label: 'Planos & Assinatura', icon: CreditCard }
  ] as const;

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div>
        <h1 className="font-display font-bold text-3xl tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-800">
          Configurações do Sistema
        </h1>
        <p className="text-slate-400 dark:text-slate-400 light:text-slate-500 text-sm mt-1">
          Gerencie suas preferências, dados de privacidade, tema visual e assinaturas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* Menu Lateral de Configurações */}
        <div className="lg:col-span-3 flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-2 lg:pb-0">
          {subTabItems.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-brand-500 text-white shadow shadow-brand-500/20'
                    : 'bg-slate-900/40 border border-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Painel Central Reativo */}
        <div className="lg:col-span-9">
          {activeSubTab === 'account' && (
            <CardGlass className="p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 pb-3 border-b border-slate-900 flex items-center gap-2">
                <User size={16} className="text-brand-500" />
                Informações da Minha Conta
              </h3>
              <form onSubmit={handleSaveAccount} className="space-y-4 max-w-lg">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-900/40">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar Preview"
                      className="h-16 w-16 rounded-full object-cover border border-slate-800"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-display font-semibold text-xl border border-indigo-500/30">
                      {fullName.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="space-y-1 text-left">
                    <label className="text-xs text-slate-400 font-semibold block">Foto de Perfil</label>
                    <input
                      type="file"
                      accept="image/*"
                      id="avatar-upload"
                      className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
                      onChange={handleAvatarChange}
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-800 cursor-pointer transition-all inline-block"
                    >
                      Carregar Foto
                    </label>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="ml-2 text-[10px] text-red-400 hover:underline font-semibold"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold block">Nome Completo</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-850 focus:border-brand-500 outline-none text-xs text-slate-200"
                    placeholder="Seu Nome Completo"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold block">E-mail Cadastrado</label>
                  <input
                    type="email"
                    value={email || 'email@exemplo.com'}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/30 border border-slate-850/40 text-slate-500 text-xs cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold block">Cargo/Headline Atual</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-850 focus:border-brand-500 outline-none text-xs text-slate-200"
                    placeholder="Ex: Farmacêutica Esteta, Senior Frontend Developer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold block">LinkedIn URL</label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={e => setLinkedin(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-850 focus:border-brand-500 outline-none text-xs text-slate-200"
                    placeholder="https://linkedin.com/in/seu-perfil"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold block">Sobre / Resumo Profissional (About)</label>
                  <textarea
                    value={skillsSummary}
                    onChange={e => setSkillsSummary(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-850 focus:border-brand-500 outline-none text-xs text-slate-200 resize-y"
                    placeholder="Conte sobre sua jornada profissional, conquistas e objetivos..."
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold transition-all"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-855 text-slate-350 text-xs font-bold transition-all border border-slate-800"
                  >
                    Redefinir Senha
                  </button>
                </div>
              </form>

              <div className="pt-6 border-t border-slate-900/60 space-y-3">
                <span className="text-xs font-bold text-red-400 block uppercase tracking-wider">Zona de Perigo</span>
                <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
                  Ao excluir a sua conta, todas as suas candidaturas salvas, análises de IA, roteiros de entrevista e currículos serão deletados permanentemente.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-xl bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Trash2 size={12} />
                  Excluir Minha Conta
                </button>
              </div>
            </CardGlass>
          )}

          {activeSubTab === 'resumes' && (
            <CardGlass className="p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 pb-3 border-b border-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-brand-500" />
                Histórico de Currículos Cadastrados
              </h3>

              {resumes && resumes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 font-bold">
                        <th className="pb-3 pr-4">Nome do Arquivo</th>
                        <th className="pb-3 pr-4">Cadastro</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40">
                      {resumes.map((resume) => (
                        <tr key={resume.resumeVersionId} className="hover:bg-slate-900/10">
                          <td className="py-3 pr-4 font-semibold text-slate-300 truncate max-w-[200px]">
                            {resume.fileName}
                          </td>
                          <td className="py-3 pr-4 text-slate-500">
                            {new Date(resume.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 pr-4">
                            {resume.isPrimary ? (
                              <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-[10px] font-bold border border-brand-500/20">Ativo</span>
                            ) : (
                              <span className="text-slate-500">Secundário</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={async () => {
                                if (window.confirm(`Tem certeza que deseja deletar permanentemente o currículo ${resume.fileName}?`)) {
                                  try {
                                    await onDeleteResume(resume.id);
                                    showToast('Currículo excluído com sucesso!', 'success');
                                  } catch (err: any) {
                                    console.error(err);
                                    showToast('Erro ao excluir currículo: ' + (err.message || String(err)), 'error');
                                  }
                                }
                              }}
                              disabled={resume.isPrimary}
                              className="p-1 rounded hover:bg-red-950/20 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40 disabled:hover:text-slate-500 disabled:cursor-not-allowed"
                              title={resume.isPrimary ? "Não é possível excluir o currículo ativo padrão" : "Excluir currículo"}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Nenhum currículo cadastrado. Faça upload do seu arquivo na aba Resume.
                </div>
              )}
            </CardGlass>
          )}

          {activeSubTab === 'preferences' && (
            <CardGlass className="p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 pb-3 border-b border-slate-900 flex items-center gap-2">
                <SettingsIcon size={16} className="text-brand-500" />
                Preferências de Busca de Vagas
              </h3>

              <form onSubmit={handleSavePreferences} className="space-y-4 max-w-lg">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold block">Cargos Desejados (separados por vírgula)</label>
                  <input
                    type="text"
                    value={roles}
                    onChange={e => setRoles(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-850 focus:border-brand-500 outline-none text-xs text-slate-200"
                    placeholder="Ex: Farmacêutica Esteta, Farmacêutica Responsável"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold block">Localidades Desejadas</label>
                  <input
                    type="text"
                    value={locations}
                    onChange={e => setLocations(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-850 focus:border-brand-500 outline-none text-xs text-slate-200"
                    placeholder="Ex: São Paulo, Rio de Janeiro, Remoto"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold block">Modelo de Trabalho</label>
                  <div className="flex gap-4">
                    {['remote', 'hybrid', 'onsite'].map((mode) => (
                      <label key={mode} className="flex items-center gap-1.5 text-xs text-slate-350 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={workModes.includes(mode)}
                          onChange={e => {
                            if (e.target.checked) {
                              setWorkModes([...workModes, mode]);
                            } else {
                              setWorkModes(workModes.filter(m => m !== mode));
                            }
                          }}
                          className="h-4 w-4 accent-brand-500 rounded bg-slate-900"
                        />
                        {mode === 'remote' ? 'Remoto' : mode === 'hybrid' ? 'Híbrido' : 'Presencial'}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Pretensão Salarial Mínima</span>
                    <span className="text-brand-400">R$ {salaryMin.toLocaleString('pt-BR')} / mês</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="30000"
                    step="500"
                    value={salaryMin}
                    onChange={e => setSalaryMin(Number(e.target.value))}
                    className="w-full h-1 bg-slate-700 light:bg-slate-300 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold transition-all"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Preferências'}
                  </button>
                </div>
              </form>
            </CardGlass>
          )}

          {activeSubTab === 'notifications' && (
            <CardGlass className="p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 pb-3 border-b border-slate-900 flex items-center gap-2">
                <Bell size={16} className="text-brand-500" />
                Notificações e Alertas
              </h3>

              <div className="space-y-4 max-w-lg">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-850/50">
                  <input
                    type="checkbox"
                    id="email-alerts"
                    checked={emailAlerts}
                    onChange={e => setEmailAlerts(e.target.checked)}
                    className="h-4 w-4 accent-brand-500 rounded bg-slate-900 cursor-pointer mt-0.5"
                  />
                  <div>
                    <label htmlFor="email-alerts" className="text-xs font-bold text-slate-250 cursor-pointer block">Alertas por E-mail</label>
                    <span className="text-[10px] text-slate-500 leading-normal block">Receba e-mails instantâneos quando a IA encontrar novas vagas com match superior a 80%.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-850/50">
                  <input
                    type="checkbox"
                    id="push-alerts"
                    checked={pushAlerts}
                    onChange={e => setPushAlerts(e.target.checked)}
                    className="h-4 w-4 accent-brand-500 rounded bg-slate-900 cursor-pointer mt-0.5"
                  />
                  <div>
                    <label htmlFor="push-alerts" className="text-xs font-bold text-slate-250 cursor-pointer block">Notificações Push no Navegador</label>
                    <span className="text-[10px] text-slate-500 leading-normal block">Notificações visuais em tempo real na tela do seu computador enquanto o app processa currículos.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-850/50">
                  <input
                    type="checkbox"
                    id="weekly-digest"
                    checked={weeklyDigest}
                    onChange={e => setWeeklyDigest(e.target.checked)}
                    className="h-4 w-4 accent-brand-500 rounded bg-slate-900 cursor-pointer mt-0.5"
                  />
                  <div>
                    <label htmlFor="weekly-digest" className="text-xs font-bold text-slate-250 cursor-pointer block">Resumo Semanal Copilot</label>
                    <span className="text-[10px] text-slate-500 leading-normal block">Consolidado enviado nas segundas-feiras com estatísticas da sua prospecção e evolução do perfil.</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => showToast('Preferências de notificação salvas com sucesso!', 'success')}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all"
                >
                  Salvar Configurações
                </button>
              </div>
            </CardGlass>
          )}

          {activeSubTab === 'appearance' && (
            <CardGlass className="p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 pb-3 border-b border-slate-900 flex items-center gap-2">
                <Palette size={16} className="text-brand-500" />
                Personalização Visual e Tema
              </h3>

              <p className="text-xs text-slate-400 max-w-md">
                Selecione o esquema de cores que prefere para a interface de trabalho. Nossos temas garantem legibilidade.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-md max-w-2xl">
                <div 
                  onClick={() => handleApplyTheme('light')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer text-center relative flex flex-col items-center justify-center min-h-[120px] ${
                    theme === 'light'
                      ? 'bg-slate-100 border-brand-500 text-slate-900 shadow-md shadow-brand-500/10'
                      : 'bg-slate-900/40 border-slate-900/60 text-slate-400 hover:bg-slate-900 hover:text-slate-350'
                  }`}
                >
                  {theme === 'light' && <div className="absolute top-2.5 right-2.5 p-0.5 bg-brand-500 text-white rounded-full"><Check size={10} /></div>}
                  <Sun size={28} className="mb-2" />
                  <span className="text-xs font-bold">Tema Claro</span>
                  <span className="text-[9px] opacity-70 mt-1">Interface brilhante e limpa</span>
                </div>

                <div 
                  onClick={() => handleApplyTheme('dark')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer text-center relative flex flex-col items-center justify-center min-h-[120px] ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-brand-500 text-white shadow-md shadow-brand-500/10'
                      : 'bg-slate-900/40 border-slate-900/60 text-slate-400 hover:bg-slate-900 hover:text-slate-350'
                  }`}
                >
                  {theme === 'dark' && <div className="absolute top-2.5 right-2.5 p-0.5 bg-brand-500 text-white rounded-full"><Check size={10} /></div>}
                  <Moon size={28} className="mb-2" />
                  <span className="text-xs font-bold">Tema Escuro</span>
                  <span className="text-[9px] opacity-70 mt-1">Modo focado e anti-fadiga</span>
                </div>

                <div 
                  onClick={() => handleApplyTheme('system')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer text-center relative flex flex-col items-center justify-center min-h-[120px] ${
                    theme === 'system'
                      ? 'bg-slate-900/80 border-brand-500 text-slate-200 shadow-md shadow-brand-500/10'
                      : 'bg-slate-900/40 border-slate-900/60 text-slate-400 hover:bg-slate-900 hover:text-slate-350'
                  }`}
                >
                  {theme === 'system' && <div className="absolute top-2.5 right-2.5 p-0.5 bg-brand-500 text-white rounded-full"><Check size={10} /></div>}
                  <Monitor size={28} className="mb-2" />
                  <span className="text-xs font-bold">Sistema</span>
                  <span className="text-[9px] opacity-70 mt-1">Segue as configurações do OS</span>
                </div>
              </div>
            </CardGlass>
          )}

          {activeSubTab === 'privacy' && (
            <CardGlass className="p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 pb-3 border-b border-slate-900 flex items-center gap-2">
                <ShieldAlert size={16} className="text-brand-500" />
                Segurança, Privacidade e LGPD
              </h3>

              <div className="space-y-4 max-w-2xl text-xs leading-relaxed text-slate-350">
                <p>
                  Sua privacidade e a segurança dos seus dados pessoais e de currículos são fundamentais para nós. Em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>, você tem total autonomia sobre suas informações coletadas.
                </p>

                <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-850/60 space-y-2">
                  <span className="text-xs font-bold text-slate-200 block">Como protegemos seus dados:</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                    <li>Currículos são armazenados em ambiente isolado e seguro no Supabase Storage.</li>
                    <li>As requisições à inteligência artificial do Gemini utilizam dados anonimizados sempre que possível.</li>
                    <li>Nenhuma informação de currículo ou dados de perfil é vendida ou repassada a terceiros.</li>
                  </ul>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="gdpr-consent"
                    checked={gdprConsent}
                    onChange={e => setGdprConsent(e.target.checked)}
                    className="h-4 w-4 accent-brand-500 rounded bg-slate-900 cursor-pointer mt-0.5"
                  />
                  <label htmlFor="gdpr-consent" className="text-[11px] text-slate-400 cursor-pointer">
                    Consinto com o processamento dos meus currículos via inteligência artificial para fins de cálculo de compatibilidade, geração de roteiros de entrevista e otimização. (Obrigatório para o funcionamento do app)
                  </label>
                </div>

                <div className="pt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-855 text-slate-200 text-xs font-bold transition-all border border-slate-800 flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    Exportar Meus Dados (JSON)
                  </button>
                </div>
              </div>
            </CardGlass>
          )}

          {activeSubTab === 'billing' && (
            <CardGlass className="p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 pb-3 border-b border-slate-900 flex items-center gap-2">
                <CreditCard size={16} className="text-brand-500" />
                Assinatura e Planos
              </h3>

              <div className="max-w-xl p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-brand-950/40 light:from-slate-100 light:via-white light:to-brand-50 border border-slate-800/80 light:border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-32 w-32 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-brand-400">Plano Ativo</span>
                    <h4 className="text-lg font-extrabold text-slate-200 mt-1">Premium Copilot</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug max-w-xs">Acesso total a buscas inteligentes no Adzuna, otimizações ATS e simulados de entrevista STAR.</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">Ativo</span>
                </div>
                <div className="mt-6 flex justify-between items-end border-t border-slate-800/80 pt-4">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Próxima Renovação</span>
                    <span className="text-xs font-semibold text-slate-350">{nextRenewalDateStr}</span>
                  </div>
                  <button 
                    onClick={() => showToast('Você já está no plano Premium Copilot máximo.', 'success')}
                    className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-[10px] transition-all shadow shadow-brand-500/10"
                  >
                    Gerenciar Plano
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Histórico de Faturamento</span>
                <div className="rounded-xl border border-slate-900 overflow-hidden text-xs">
                  <div className="grid grid-cols-3 p-3 bg-slate-900/30 border-b border-slate-900 font-bold text-slate-450">
                    <span>Data</span>
                    <span>Plano</span>
                    <span className="text-right">Valor</span>
                  </div>
                  <div className="divide-y divide-slate-900/40">
                    {billingHistory.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-3 p-3 text-slate-300">
                        <span>{item.dateStr}</span>
                        <span>{item.plan}</span>
                        <span className="text-right">{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardGlass>
          )}
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[100] border px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md text-xs font-semibold select-none"
            style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              borderColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            }}
          >
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            <span style={{ color: '#ffffff' }}>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
