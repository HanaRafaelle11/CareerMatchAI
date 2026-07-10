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
    const payload = err?.errorDetails || err?.error;
    const code = payload?.code || '';

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

    // 2. Erros específicos do motor Gemini (Timeout, Quota, Resposta Inválida/JSON quebrado)
    if (
      code.includes('AI_') || 
      code.includes('GEMINI_') || 
      errMsg.includes('AI_TIMEOUT') || 
      errMsg.includes('quota') || 
      errMsg.includes('exhausted') || 
      errMsg.includes('exceeded') || 
      errMsg.includes('rate limit') || 
      errMsg.includes('Gemini') || 
      errMsg.includes('JSON') || 
      errMsg.includes('SyntaxError') || 
      errMsg.includes('Unexpected token') ||
      errMsg.includes('instabilidade')
    ) {
      return new AppError({
        code: code || 'AI_RESPONSE_INVALID',
        title: 'Não conseguimos concluir sua análise',
        message: 'A inteligência artificial encontrou uma instabilidade temporária.',
        severity: 'error',
        retryable: true,
        action: 'Tentar novamente'
      });
    }

    // 3. Erros específicos do provedor Adzuna
    if (
      code.includes('JOB_SEARCH_') || 
      code.includes('ADZUNA_') || 
      errMsg.includes('Adzuna') || 
      errMsg.includes('API_NOT_CONFIGURED') ||
      errMsg.includes('JOB_SEARCH_UNAVAILABLE')
    ) {
      if (code === 'JOB_SEARCH_EMPTY') {
        return new AppError({
          code: 'JOB_SEARCH_EMPTY',
          title: 'Nenhuma vaga compatível',
          message: 'Não encontramos vagas públicas com os filtros fornecidos. Tente ajustar os termos ou remover a cidade da busca.',
          severity: 'info',
          retryable: false,
          action: 'Ajustar Filtros'
        });
      }
      return new AppError({
        code: code || 'JOB_SEARCH_UNAVAILABLE',
        title: 'Busca de Vagas Indisponível',
        message: 'Não conseguimos buscar vagas agora.',
        severity: 'warning',
        retryable: true,
        action: 'Tentar Novamente'
      });
    }

    // 4. Erros específicos de Upload - PDF Corrompido / Protegido por Senha
    if (
      code === 'PARSE_ERROR' || 
      errMsg.includes('PARSE_ERROR') || 
      errMsg.includes('corrupted') || 
      errMsg.includes('corrompido') || 
      errMsg.includes('password') || 
      errMsg.includes('protegido') || 
      errMsg.includes('senha') || 
      errMsg.includes('structure') || 
      errMsg.includes('Invalid PDF structure')
    ) {
      return new AppError({
        code: 'PARSE_ERROR',
        title: 'Estrutura de Currículo Inválida',
        message: 'Não conseguimos extrair o texto desse currículo. Verifique se o arquivo não está protegido por senha ou corrompido.',
        severity: 'error',
        retryable: false,
        action: 'Enviar novo currículo'
      });
    }

    // 5. Erros específicos de Upload - Tamanho ou Formato Inválido
    if (
      code === 'RESUME_UPLOAD_INVALID' || 
      errMsg.includes('RESUME_UPLOAD_INVALID') || 
      errMsg.includes('10MB') || 
      errMsg.includes('tamanho') || 
      errMsg.includes('format') || 
      errMsg.includes('formato') || 
      errMsg.includes('extension') || 
      errMsg.includes('allowedTypes')
    ) {
      return new AppError({
        code: 'RESUME_UPLOAD_INVALID',
        title: 'Não conseguimos ler esse arquivo',
        message: 'Envie um arquivo em formato PDF com até 10MB de tamanho.',
        severity: 'warning',
        retryable: false,
        action: 'Enviar novo currículo'
      });
    }

    // Tratar erros retornados estruturalmente do Backend/Supabase Edge Functions genéricos
    if (payload && typeof payload === 'object') {
      if (payload.code && payload.userMessage) {
        return new AppError({
          code: payload.code,
          title: AppError.mapTitle(payload.code),
          message: payload.userMessage,
          severity: 'error',
          retryable: payload.retryable ?? true,
          action: payload.retryable ? 'Tentar novamente' : undefined
        });
      }
    }

    // Tratar erros de token/autorização expirada do Supabase
    if (errMsg.includes('JWT') || errMsg.includes('session') || errMsg.includes('auth') || errMsg.includes('invalid claim')) {
      return new AppError({
        code: 'AUTH_SESSION_EXPIRED',
        title: 'Sessão Expirada',
        message: 'Sua sessão de acesso expirou. Faça login novamente para continuar salvando seu progress.',
        severity: 'warning',
        action: 'Ir para Login',
        retryable: false
      });
    }

    // Tratar erros de falta de permissão ou violação de RLS
    if (errMsg.includes('violates row-level security') || errMsg.includes('new row violates row-level security') || errMsg.includes('RLS')) {
      return new AppError({
        code: 'RLS_BLOCKED',
        title: 'Acesso Não Autorizado',
        message: 'Você não tem permissão para visualizar, alterar ou excluir este recurso. Certifique-se de estar conectado com a conta correta.',
        severity: 'error',
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
      case 'AI_TIMEOUT': return 'Não conseguimos concluir sua análise';
      case 'RESUME_NOT_FOUND': return 'Currículo Não Encontrado';
      case 'JOB_SEARCH_UNAVAILABLE': return 'Busca de Vagas Indisponível';
      case 'RATE_LIMIT_EXCEEDED': return 'Não conseguimos concluir sua análise';
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
