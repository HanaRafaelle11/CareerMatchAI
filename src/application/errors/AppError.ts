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

    // 1. Conexão Gemini / IA Indisponível
    if (
      code === 'GEMINI_CONNECTION_ERROR' ||
      errMsg.includes('GEMINI_CONNECTION_ERROR') ||
      errMsg.includes('Google') ||
      errMsg.includes('Gemini API') ||
      errMsg.includes('generativelanguage')
    ) {
      return new AppError({
        code: 'GEMINI_CONNECTION_ERROR',
        title: 'Erro ao conectar com Gemini',
        message: 'O motor de inteligência artificial do Google encontrou instabilidades.',
        severity: 'error',
        retryable: true,
        action: 'Tentar Novamente'
      });
    }

    // 2. Timeout da IA
    if (
      code === 'AI_TIMEOUT' ||
      errMsg.includes('AI_TIMEOUT') ||
      errMsg.includes('timeout') ||
      errMsg.includes('timed out') ||
      errMsg.includes('demorou mais do que o esperado')
    ) {
      return new AppError({
        code: 'AI_TIMEOUT',
        title: 'Timeout da IA',
        message: 'A inteligência artificial demorou mais de 25 segundos para responder. Sua solicitação expirou.',
        severity: 'error',
        retryable: true,
        action: 'Tentar Novamente'
      });
    }

    // 3. Limite de requisições / Rate Limit excedido
    if (
      code === 'RATE_LIMIT_EXCEEDED' ||
      errMsg.includes('RATE_LIMIT_EXCEEDED') ||
      errMsg.includes('Limit') ||
      errMsg.includes('excedido') ||
      errMsg.includes('limite máximo') ||
      errMsg.includes('quota') ||
      errMsg.includes('exhausted')
    ) {
      return new AppError({
        code: 'RATE_LIMIT_EXCEEDED',
        title: 'Limite de Requisições Excedido',
        message: 'Você atingiu o limite de chamadas de IA permitidas por hora.',
        severity: 'warning',
        retryable: false,
        action: 'Aguardar Próxima Hora'
      });
    }

    // 4. Erros específicos do provedor Adzuna / Busca de vagas
    if (
      code === 'JOB_SEARCH_ERROR' ||
      code.includes('JOB_SEARCH_') ||
      code.includes('ADZUNA_') ||
      errMsg.includes('Adzuna') ||
      errMsg.includes('API_NOT_CONFIGURED') ||
      errMsg.includes('JOB_SEARCH_UNAVAILABLE') ||
      errMsg.includes('buscar vagas')
    ) {
      if (code === 'JOB_SEARCH_EMPTY' || errMsg.includes('JOB_SEARCH_EMPTY')) {
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
        code: 'JOB_SEARCH_ERROR',
        title: 'Erro ao buscar vagas',
        message: 'Não conseguimos conectar à API do provedor de busca de vagas Adzuna.',
        severity: 'warning',
        retryable: true,
        action: 'Tentar Novamente'
      });
    }

    // 5. Erros específicos de Upload - PDF Corrompido / Protegido / OCR
    if (
      code === 'OCR_ERROR' ||
      errMsg.includes('OCR_ERROR') ||
      errMsg.includes('OCR') ||
      errMsg.includes('scan') ||
      errMsg.includes('imagem') ||
      errMsg.includes('imagem do currículo')
    ) {
      return new AppError({
        code: 'OCR_ERROR',
        title: 'Erro de OCR / Leitura',
        message: 'O currículo enviado é uma imagem ou scanner sem dados textuais selecionáveis.',
        severity: 'error',
        retryable: false,
        action: 'Enviar novo currículo'
      });
    }

    // 6. Estrutura de Currículo Inválida / Erro de parse
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
        message: 'Não conseguimos ler a estrutura desse arquivo. Verifique se não está corrompido ou criptografado.',
        severity: 'error',
        retryable: false,
        action: 'Enviar novo currículo'
      });
    }

    // 7. Currículo inválido - Tamanho ou Formato Inválido
    if (
      code === 'RESUME_UPLOAD_INVALID' ||
      code === 'INVALID_RESUME' ||
      errMsg.includes('RESUME_UPLOAD_INVALID') ||
      errMsg.includes('INVALID_RESUME') ||
      errMsg.includes('10MB') ||
      errMsg.includes('tamanho') ||
      errMsg.includes('format') ||
      errMsg.includes('formato') ||
      errMsg.includes('extension') ||
      errMsg.includes('allowedTypes')
    ) {
      return new AppError({
        code: 'INVALID_RESUME',
        title: 'Não conseguimos ler esse arquivo',
        message: 'Envie um arquivo em formato PDF com até 10MB de tamanho.',
        severity: 'warning',
        retryable: false,
        action: 'Enviar novo currículo'
      });
    }

    // 8. Falha de armazenamento / Supabase Storage
    if (
      code === 'STORAGE_ERROR' ||
      errMsg.includes('storage') ||
      errMsg.includes('bucket') ||
      errMsg.includes('upload to storage')
    ) {
      return new AppError({
        code: 'STORAGE_ERROR',
        title: 'Falha de armazenamento',
        message: 'Erro ao gravar ou obter arquivos do provedor de storage em nuvem.',
        severity: 'error',
        retryable: true,
        action: 'Tentar Novamente'
      });
    }

    // 9. Tratar erros de token/autorização expirada do Supabase
    if (
      code === 'AUTH_FAILED' ||
      errMsg.includes('JWT') ||
      errMsg.includes('session') ||
      errMsg.includes('auth') ||
      errMsg.includes('invalid claim')
    ) {
      return new AppError({
        code: 'AUTH_FAILED',
        title: 'Falha de autenticação',
        message: 'Sua sessão de acesso expirou. Faça login novamente para continuar.',
        severity: 'warning',
        action: 'Ir para Login',
        retryable: false
      });
    }

    // 10. Tratar erros de falta de permissão ou violação de RLS
    if (errMsg.includes('violates row-level security') || errMsg.includes('new row violates row-level security') || errMsg.includes('RLS')) {
      return new AppError({
        code: 'RLS_BLOCKED',
        title: 'Acesso Não Autorizado',
        message: 'Você não tem permissão para visualizar, alterar ou excluir este recurso.',
        severity: 'error',
        retryable: false
      });
    }

    // Tratar erros genéricos do Supabase com userMessage
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

    // Fallback para erros desconhecidos ou genéricos (Erro Interno)
    return new AppError({
      code: 'INTERNAL_ERROR',
      title: 'Erro Interno',
      message: 'Ocorreu uma falha inesperada no processamento dos nossos servidores.',
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

export interface ErrorCatalogItem {
  code: string;
  title: string;
  cause: string;
  impact: string;
  recommendation: string;
}

export const ERROR_CATALOG: Record<string, ErrorCatalogItem> = {
  'GEMINI_CONNECTION_ERROR': {
    code: 'GEMINI_CONNECTION_ERROR',
    title: 'Erro ao conectar com Gemini',
    cause: 'Instabilidade temporária nos servidores do Google ou chave de API inválida.',
    impact: 'Não é possível calcular compatibilidade ou gerar análises com IA temporariamente.',
    recommendation: 'Verifique se o serviço do Gemini está online e tente novamente mais tarde.'
  },
  'JOB_SEARCH_ERROR': {
    code: 'JOB_SEARCH_ERROR',
    title: 'Erro ao buscar vagas',
    cause: 'Falha de comunicação ou limite de requisições excedido no provedor de buscas Adzuna.',
    impact: 'A listagem e descoberta automática de vagas ficará indisponível.',
    recommendation: 'Ajuste os filtros de busca ou aguarde alguns minutos antes de tentar novamente.'
  },
  'AI_TIMEOUT': {
    code: 'AI_TIMEOUT',
    title: 'Timeout da IA',
    cause: 'A resposta do Gemini demorou mais de 25 segundos para ser gerada.',
    impact: 'O processamento do currículo ou match foi interrompido.',
    recommendation: 'Clique em tentar novamente para re-enviar a requisição.'
  },
  'AUTH_FAILED': {
    code: 'AUTH_FAILED',
    title: 'Falha de autenticação',
    cause: 'Sessão inválida, token JWT expirado ou credenciais incorretas.',
    impact: 'Você não conseguirá salvar vagas, currículos ou acessar o AI Coach.',
    recommendation: 'Faça logout e realize o login novamente para reestabelecer as credenciais.'
  },
  'RATE_LIMIT_EXCEEDED': {
    code: 'RATE_LIMIT_EXCEEDED',
    title: 'Rate limit excedido',
    cause: 'Você excedeu o limite máximo de 10 chamadas de IA por hora para este recurso.',
    impact: 'Novas chamadas de IA serão bloqueadas temporariamente.',
    recommendation: 'Aguarde até o início da próxima hora para realizar novas análises.'
  },
  'OCR_ERROR': {
    code: 'OCR_ERROR',
    title: 'Erro de OCR / Leitura',
    cause: 'O PDF enviado é baseado em imagem ou possui estrutura de texto corrompida.',
    impact: 'A IA não conseguirá ler as informações do seu currículo.',
    recommendation: 'Tente exportar o currículo como um arquivo PDF baseado em texto (ex: via Word ou Google Docs).'
  },
  'INVALID_RESUME': {
    code: 'INVALID_RESUME',
    title: 'Currículo inválido',
    cause: 'Arquivo não atende aos limites de formato (PDF) ou tamanho (máx. 10MB).',
    impact: 'O upload e processamento do arquivo foram bloqueados.',
    recommendation: 'Verifique as propriedades do arquivo e envie um PDF de até 10MB.'
  },
  'STORAGE_ERROR': {
    code: 'STORAGE_ERROR',
    title: 'Falha de armazenamento',
    cause: 'Erro ao gravar ou ler o arquivo físico no Supabase Storage.',
    impact: 'Não foi possível salvar o seu currículo na nuvem.',
    recommendation: 'Verifique se o arquivo não está bloqueado e tente novamente.'
  },
  'INTERNAL_ERROR': {
    code: 'INTERNAL_ERROR',
    title: 'Erro interno',
    cause: 'Ocorreu uma falha inesperada no processamento dos servidores.',
    impact: 'A operação falhou e os dados não puderam ser gravados.',
    recommendation: 'Aguarde alguns minutos e tente novamente. O suporte já foi alertado.'
  }
};

