export interface AppErrorPayload {
  code: string;
  title: string;
  message: string;
  action?: string;
  severity: "info" | "warning" | "error";
  retryable?: boolean;
}

export class AppError extends Error {
  public code: string;
  public title: string;
  public severity: "info" | "warning" | "error";
  public action?: string;
  public retryable: boolean;

  constructor(payload: AppErrorPayload) {
    super(payload.message);
    this.name = 'AppError';
    this.code = payload.code;
    this.title = payload.title;
    this.severity = payload.severity;
    this.action = payload.action;
    this.retryable = payload.retryable ?? false;
  }

  /**
   * Converte qualquer exceção capturada em um AppError amigável e estruturado.
   */
  public static from(err: any): AppError {
    if (err instanceof AppError) return err;

    const errMsg = err?.message || String(err || '');
    
    // 1. Verificar se é uma falha de conexão de rede
    if (errMsg.includes('Failed to fetch') || errMsg.includes('network') || errMsg.includes('connection')) {
      return new AppError({
        code: 'NETWORK_ERROR',
        title: 'Sem Conexão de Rede',
        message: 'Não conseguimos conectar com os servidores. Verifique sua conexão com a internet e tente novamente.',
        severity: 'error',
        retryable: true,
        action: 'Tentar Novamente'
      });
    }

    // 2. Tratar erros retornados estruturalmente do Backend/Supabase Edge Functions
    const payload = err?.errorDetails || err?.error;
    if (payload && typeof payload === 'object') {
      if (payload.code && payload.userMessage) {
        return new AppError({
          code: payload.code,
          title: AppError.mapTitle(payload.code),
          message: payload.userMessage,
          severity: 'error',
          retryable: payload.retryable ?? true
        });
      }
    }

    // 3. Tratar erros HTTP da Deno Edge Function encapsulados (como rate limit)
    if (errMsg.includes('Limite de requisições excedido')) {
      return new AppError({
        code: 'RATE_LIMIT_EXCEEDED',
        title: 'Limite de Consultas Atingido',
        message: 'Você atingiu o limite máximo de análises permitidas por hora. Por favor, aguarde alguns minutos antes de tentar novamente.',
        severity: 'warning',
        retryable: false
      });
    }

    // 4. Tratar erros de token/autorização expirada do Supabase
    if (errMsg.includes('JWT') || errMsg.includes('session') || errMsg.includes('auth') || errMsg.includes('invalid claim')) {
      return new AppError({
        code: 'AUTH_SESSION_EXPIRED',
        title: 'Sessão Expirada',
        message: 'Sua sessão de acesso expirou. Faça login novamente para continuar salvando seu progresso.',
        severity: 'warning',
        action: 'Ir para Login',
        retryable: false
      });
    }

    // 5. Tratar erros de falta de permissão ou violação de RLS
    if (errMsg.includes('violates row-level security') || errMsg.includes('new row violates row-level security') || errMsg.includes('RLS')) {
      return new AppError({
        code: 'RLS_BLOCKED',
        title: 'Acesso Não Autorizado',
        message: 'Você não tem permissão para visualizar, alterar ou excluir este recurso. Certifique-se de estar conectado com a conta correta.',
        severity: 'error',
        retryable: false
      });
    }

    // 6. Tratar erros específicos de API Adzuna não configurada
    if (errMsg.includes('API_NOT_CONFIGURED')) {
      return new AppError({
        code: 'JOB_SEARCH_UNAVAILABLE',
        title: 'Busca de Vagas Indisponível',
        message: 'O provedor de busca de vagas Adzuna não está configurado. Configure as credenciais no cofre do Supabase para ativar as buscas.',
        severity: 'warning',
        retryable: false
      });
    }

    // Fallback para erros desconhecidos ou genéricos
    return new AppError({
      code: 'GENERIC_ERROR',
      title: 'Algo deu errado',
      message: 'Não conseguimos processar esta ação devido a um problema interno. Nossa equipe já foi notificada. Tente novamente mais tarde.',
      severity: 'error',
      retryable: true,
      action: 'Tentar Novamente'
    });
  }

  private static mapTitle(code: string): string {
    switch (code) {
      case 'AI_TIMEOUT': return 'Análise Demorou Muito';
      case 'RESUME_NOT_FOUND': return 'Currículo Não Encontrado';
      case 'JOB_SEARCH_UNAVAILABLE': return 'Busca de Vagas Indisponível';
      case 'RATE_LIMIT_EXCEEDED': return 'Limite Excedido';
      default: return 'Falha na Operação';
    }
  }

  /**
   * Grava de forma assíncrona o log do erro na tabela application_errors do Supabase para telemetria administrativa.
   */
  public static async logError(
    err: any,
    supabaseClient: any,
    component: string,
    userId?: string
  ): Promise<void> {
    const appError = AppError.from(err);
    console.error(`[TELEMETRY LOG] Error captured in ${component}:`, appError);

    if (!supabaseClient) return;

    try {
      await supabaseClient.from('application_errors').insert({
        user_id: userId || null,
        error_code: appError.code,
        component,
        message: appError.message,
        stack_trace: err?.stack || String(err)
      });
    } catch (dbErr) {
      console.error('[TELEMETRY LOG] Falha ao enviar telemetria ao banco de dados:', dbErr);
    }
  }
}
