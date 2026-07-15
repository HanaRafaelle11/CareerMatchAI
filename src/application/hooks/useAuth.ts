import { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import type { Profile } from '../../domain/models/types';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Obter sessão atual do Supabase
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchSupabaseProfile(session.user.id);
        } else {
          setLoading(false);
        }
      });

      // Escutar mudanças de autenticação
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchSupabaseProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Autenticação local mockada
      const mockUser = localStorage.getItem('careermatch_auth_user');
      if (mockUser) {
        const parsedUser = JSON.parse(mockUser);
        setUser(parsedUser);
        setProfile(localDB.getProfile());
      }
      setLoading(false);
    }
  }, []);

  const fetchSupabaseProfile = async (userId: string) => {
    if (!supabase) return;
    try {
      console.log(`[AUTH] Buscando perfil do usuário: ${userId}`);
      let { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, headline, avatar_url, skills_summary, role, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle() as any;

      if (error && error.code === '42703') {
        console.warn('[AUTH] Coluna avatar_url não existe no Supabase. Retrying sem ela...');
        const retryResult = await supabase
          .from('profiles')
          .select('id, full_name, headline, skills_summary, role, created_at, updated_at')
          .eq('id', userId)
          .maybeSingle() as any;
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        console.error('[AUTH] Erro ao buscar perfil no Supabase:', error);
        throw error;
      }

      if (data) {
        console.log('[AUTH] Perfil carregado com sucesso:', data);
        const localProfileRaw = localStorage.getItem('careermatch_profile');
        let localProfile: any = {};
        if (localProfileRaw) {
          try {
            const parsed = JSON.parse(localProfileRaw);
            if (parsed && typeof parsed === 'object') {
              localProfile = parsed;
            }
          } catch (_) {}
        }
        const localAvatar = localStorage.getItem(`careermatch_avatar_${userId}`) || undefined;

        setProfile({
          id: data.id,
          fullName: data.full_name || localProfile.fullName,
          headline: data.headline || localProfile.headline || undefined,
          avatarUrl: data.avatar_url || localAvatar || localProfile.avatarUrl || undefined,
          skillsSummary: data.skills_summary || localProfile.skillsSummary || undefined,
          role: data.role || localProfile.role || 'user',
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      } else {
        console.warn(`[AUTH] Perfil não encontrado para id ${userId}. Criando perfil padrão...`);
        const userSession = (await supabase.auth.getUser()).data.user;
        const initialName = userSession?.user_metadata?.full_name || userSession?.email?.split('@')[0] || 'Usuário Sem Nome';
        
        const newProfile = {
          id: userId,
          full_name: initialName,
          headline: 'Candidato | Talenta',
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select('id, full_name, headline, role, created_at, updated_at')
          .maybeSingle();

        if (insertError) {
          console.error('[AUTH] Erro ao inicializar perfil no banco:', insertError);
          throw insertError;
        }

        if (inserted) {
          console.log('[AUTH] Perfil padrão criado e carregado:', inserted);
          setProfile({
            id: inserted.id,
            fullName: inserted.full_name,
            headline: inserted.headline || undefined,
            role: inserted.role || 'user',
            createdAt: inserted.created_at,
            updatedAt: inserted.updated_at,
          });
        }
      }
    } catch (err) {
      console.error('[AUTH] Falha crítica ao processar perfil do usuário:', err);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        throw error;
      }
    } else {
      // Simulação local
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockUserId = btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
      const mockUserObj = { id: mockUserId, email };
      localStorage.setItem('careermatch_auth_user', JSON.stringify(mockUserObj));
      setUser(mockUserObj);
      setProfile(localDB.getProfile());
      setLoading(false);
    }
  };

  const signUpWithEmail = async (fullName: string, email: string, password: string) => {
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      if (error) {
        setLoading(false);
        throw error;
      }
      if (data?.user) {
        // Criar perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: fullName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        if (profileError) console.error(profileError);
      }
    } else {
      // Simulação local
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockUserId = btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
      const mockUserObj = { id: mockUserId, email };
      localStorage.setItem('careermatch_auth_user', JSON.stringify(mockUserObj));
      localDB.updateProfile({ fullName, headline: 'Novo Usuário | Talenta' });
      setUser(mockUserObj);
      setProfile(localDB.getProfile());
      setLoading(false);
    }
  };

  const loginWithOAuth = async (provider: 'google' | 'github') => {
    setLoading(true);
    const triggerLocalFallback = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      const email = `${provider}_user@example.com`;
      const mockUserId = btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
      const mockUserObj = { id: mockUserId, email };
      localStorage.setItem('careermatch_auth_user', JSON.stringify(mockUserObj));
      localDB.updateProfile({
        fullName: provider === 'google' ? 'Google Candidate User' : 'GitHub Developer User',
        avatarUrl: provider === 'github' ? 'https://github.com/github.png' : undefined,
        headline: `Software Engineer via ${provider}`
      });
      setUser(mockUserObj);
      setProfile(localDB.getProfile());
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({ 
          provider,
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) {
          console.warn(`OAuth sign-in returned error, triggering simulated fallback:`, error);
          await triggerLocalFallback();
        }
      } catch (err) {
        console.warn(`OAuth sign-in threw error, triggering simulated fallback:`, err);
        await triggerLocalFallback();
      } finally {
        setLoading(false);
      }
    } else {
      try {
        await triggerLocalFallback();
      } finally {
        setLoading(false);
      }
    }
  };

  const logout = async () => {
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('careermatch_auth_user');
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  };

  const updateProfile = (updated: Partial<Profile>) => {
    setProfile(prev => {
      const newVal = prev ? { ...prev, ...updated } : null;
      if (newVal) {
        localStorage.setItem('careermatch_profile', JSON.stringify(newVal));
        if (newVal.id) {
          if (newVal.avatarUrl) {
            localStorage.setItem(`careermatch_avatar_${newVal.id}`, newVal.avatarUrl);
          } else {
            localStorage.removeItem(`careermatch_avatar_${newVal.id}`);
          }
        }
      }
      return newVal;
    });
  };

  return {
    user,
    profile,
    loading,
    loginWithEmail,
    signUpWithEmail,
    loginWithOAuth,
    logout,
    updateProfile
  };
}
