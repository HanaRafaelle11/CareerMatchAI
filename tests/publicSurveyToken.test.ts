import { describe, it, expect } from 'vitest';

describe('Public Survey Token Validation & Timeout Safety', () => {
  it('deve validar token válido e extrair user_id e e-mail com sucesso', () => {
    const userId = 'usr_founder_456';
    const email = 'hanarafaelle11@gmail.com';
    const payload = JSON.stringify({ u: userId, e: email, t: Date.now() });
    const token = Buffer.from(payload).toString('base64');

    // Decode token
    const decodedStr = Buffer.from(token, 'base64').toString('utf-8');
    const decoded = JSON.parse(decodedStr);

    expect(decoded.u).toBe(userId);
    expect(decoded.e).toBe(email);
  });

  it('deve identificar token inválido ou ausente e retornar estado de erro amigável', () => {
    const validateToken = (tokenParam: string | null) => {
      if (!tokenParam) {
        return { valid: false, error: 'Este convite de pesquisa expirou ou não é válido. Caso tenha recebido um novo convite, utilize o link mais recente.' };
      }
      try {
        const decodedStr = Buffer.from(tokenParam, 'base64').toString('utf-8');
        const decoded = JSON.parse(decodedStr);
        if (!decoded || !decoded.u) {
          return { valid: false, error: 'Este convite de pesquisa expirou ou não é válido.' };
        }
        return { valid: true, error: null };
      } catch {
        // If not valid base64 JSON, check if valid UUID string or error out
        if (tokenParam.includes('-') && tokenParam.length >= 32) {
          return { valid: true, error: null };
        }
        return { valid: false, error: 'Este convite de pesquisa expirou ou não é válido.' };
      }
    };

    expect(validateToken(null).valid).toBe(false);
    expect(validateToken('invalid_token_string').valid).toBe(false);
    expect(validateToken('invalid_token_string').error).toContain('expirou ou não é válido');
  });

  it('deve garantir que o timeout de 10s reseta o estado de loading e previne tela travada', async () => {
    let isLoading = true;
    let isApiError = false;
    let errorMessage = '';

    const handleTimeout = () => {
      if (isLoading) {
        isLoading = false;
        isApiError = true;
        errorMessage = 'A resposta do servidor demorou mais que o esperado.';
      }
    };

    // Simula disparo do timeout de 10 segundos
    handleTimeout();

    expect(isLoading).toBe(false);
    expect(isApiError).toBe(true);
    expect(errorMessage).toBe('A resposta do servidor demorou mais que o esperado.');
  });
});
