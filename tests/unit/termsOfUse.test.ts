import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Validação da Página de Termos de Uso (TermsOfUsePage)', () => {
  const pagePath = path.resolve(process.cwd(), 'src/presentation/pages/TermsOfUsePage.tsx');
  const fileContent = fs.readFileSync(pagePath, 'utf-8');

  it('Deve garantir que o título e badges não contêm rascunho ou placeholders', () => {
    expect(fileContent).not.toContain('Rascunho de Trabalho');
    expect(fileContent).toContain('Condições Gerais de Uso');
    expect(fileContent).toContain('Termos de Uso - Vocentro');
  });

  it('Deve conter todas as 9 seções obrigatórias estruturadas', () => {
    expect(fileContent).toContain('1. Aceitação dos Termos');
    expect(fileContent).toContain('2. Descrição do Serviço');
    expect(fileContent).toContain('3. Planos de Assinatura, Cobrança e Cancelamento');
    expect(fileContent).toContain('4. Propriedade Intelectual do Conteúdo Gerado por IA');
    expect(fileContent).toContain('5. Processamento por Inteligência Artificial e Transferência Internacional de Dados');
    expect(fileContent).toContain('6. Regras de Conduta do Usuário');
    expect(fileContent).toContain('7. Limitação de Responsabilidade');
    expect(fileContent).toContain('8. Legislação Aplicável e Foro');
    expect(fileContent).toContain('9. Alterações e Contato');
  });

  it('Deve conter navegação de retorno e suporte por e-mail oficial', () => {
    expect(fileContent).toContain('onBack');
    expect(fileContent).toContain('suporte@vocentro.com.br');
    expect(fileContent).toContain('vocentro.com.br');
  });
});
