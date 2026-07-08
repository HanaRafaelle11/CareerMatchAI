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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, headline, skills_summary, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AUTH] Erro ao buscar perfil no Supabase:', error);
        throw error;
      }

      if (data) {
        console.log('[AUTH] Perfil carregado com sucesso:', data);
        setProfile({
          id: data.id,
          fullName: data.full_name,
          headline: data.headline || undefined,
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
          headline: 'Candidato | CareerMatch AI',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select('id, full_name, headline, created_at, updated_at')
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
      const mockUserObj = { id: 'user-default', email };
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
      const mockUserObj = { id: 'user-default', email };
      localStorage.setItem('careermatch_auth_user', JSON.stringify(mockUserObj));
      localDB.updateProfile({ fullName, headline: 'Novo Usuário | CareerMatch AI' });
      setUser(mockUserObj);
      setProfile(localDB.getProfile());
      setLoading(false);
    }
  };

  const loginWithOAuth = async (provider: 'google' | 'github') => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } else {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1200));
      const email = `${provider}_user@example.com`;
      const mockUserObj = { id: 'user-default', email };
      localStorage.setItem('careermatch_auth_user', JSON.stringify(mockUserObj));
      localDB.updateProfile({
        fullName: provider === 'google' ? 'Google Candidate User' : 'GitHub Developer User',
        avatarUrl: provider === 'github' ? 'https://github.com/github.png' : undefined,
        headline: `Software Engineer via ${provider}`
      });
      setUser(mockUserObj);
      setProfile(localDB.getProfile());
      setLoading(false);
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

  return {
    user,
    profile,
    loading,
    loginWithEmail,
    signUpWithEmail,
    loginWithOAuth,
    logout
  };
}
