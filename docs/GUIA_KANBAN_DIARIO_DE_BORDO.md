# Guia Visual e Explicativo: Kanban e Diário de Bordo (Vocentro)

Este guia foi elaborado em linguagem simples e acessível para explicar como funciona a organização das suas vagas e o acompanhamento das suas entrevistas no Vocentro.

---

## 📋 1. O Funil Kanban de Candidaturas

O **Kanban** é o painel visual onde você acompanha todas as oportunidades em que tem interesse, divididas em etapas claras como em um quadro de tarefas.

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐   ┌─────────────┐
│ 🔎Encontrada│ ➔ │   ⭐Salva   │ ➔ │  📨Aplicada │ ➔ │ 👥Entrevista RH │ ➔ │  🏆Oferta   │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────────┘   └─────────────┘
```

### Como as Vagas Entram no Kanban?
1. **Automático ao Encontrar Vaga:** Quando você faz uma busca no *Mapeamento de Vagas* ou clica em *Importar e Analisar Match*, a vaga é salva automaticamente na coluna **🔎 Encontradas**.
2. **Ao Se Candidatar:** Quando você clica em *"Se candidatar"* ou *"Acompanhar Vaga"*, ela avança para a coluna **📨 Aplicadas**.

### Quais são as 8 Etapas do Kanban?
1. **🔎 Encontradas:** Vagas identificadas pela busca ou importadas (Progresso: 30%).
2. **⭐ Salvas:** Vagas que você marcou como favoritas para analisar melhor depois (Progresso: 45%).
3. **📨 Aplicadas:** Vagas nas quais você já enviou o seu currículo (Progresso: 60%).
4. **👥 Entrevista RH:** Vagas em que você avançou para o primeiro bate-papo com o recrutador (Progresso: 75%).
5. **🎯 Entrevista Gestor:** Vagas em fase avançada de sabatina técnica ou teste prático (Progresso: 85%).
6. **🏆 Oferta:** Vagas em que você recebeu uma proposta comercial/salarial (Progresso: 95%).
7. **✅ Contratado:** Vagas em que a proposta foi aceita e você conquistou o emprego (Progresso: 100%).
8. **❌ Arquivadas / Rejeitadas:** Vagas encerradas, descontinuadas ou recusadas.

---

## 💾 2. Persistência de Dados e Salvamento

* **Salvo na Nuvem (Supabase):** Toda vez que você move um card de coluna no Kanban ou escreve uma anotação, a mudança é gravada no banco de dados na nuvem.
* **Resistente a Atualizações (F5 / Refresh):** Mesmo se você fechar o navegador, limpar o histórico ou atualizar a página, todas as suas vagas e anotações continuam exatamente onde você as deixou.
* **Modo Offline e Carregamento Rápido:** A aplicação guarda uma cópia leve no seu dispositivo (`localStorage`) para que a tela abra instantaneamente sem esperar a internet carregar.

---

## 🗑️ 3. Como Funciona a Exclusão, Arquivamento e Reativação?

Para evitar que você perca o histórico de uma candidatura por um clique acidental, o Vocentro possui regras claras para cada ação:

1. **Arquivar Vaga (Lixeira de Vagas):**
   * Ao clicar no ícone de lixeira em uma vaga do Mapeamento, ela vai para a **Lixeira de Vagas**.
   * A vaga sai da lista principal, mas **não é apagada**.
   * Você pode ir até a aba *Lixeira de Vagas* e clicar em **"Restaurar Vaga"** a qualquer momento. Ela voltará intacta para a sua lista de análises.

2. **Remover Candidatura do Kanban:**
   * Quando você tenta excluir ou mover um card para a coluna de rejeitadas no Kanban, o sistema abre uma **janela de confirmação** pedindo a sua autorização.
   * Isso garante que nenhuma vaga importante seja movida ou excluída sem querer.

---

## 📖 4. A Relação entre o Kanban e o Diário de Bordo

O **Diário de Bordo** é a sua caderneta de anotações e aprendizados das entrevistas.

```
       QUADRO KANBAN                               DIÁRIO DE BORDO
┌─────────────────────────┐               ┌─────────────────────────────────┐
│ Vaga: Desenvolvedor     │               │ Entrevista RH realizada em 08/08│
│ Etapa: 👥 Entrevista RH │ ────────────> │ • Pergunta sobre liderança      │
│ [Botão: Anotar Diário]  │  (Vínculo)    │ • Ponto Forte: Comunicação      │
└─────────────────────────┘               └─────────────────────────────────┘
```

### Como Eles Se Conectam?
1. **Vínculo Direto (`applicationId`):** Cada anotação do Diário de Bordo é conectada ao ID da vaga no Kanban.
2. **Evolução por Etapas:** Quando você move uma vaga para *👥 Entrevista RH*, *🎯 Entrevista Gestor* ou *🏆 Oferta*, surge o atalho no card para registrar como foi a conversa.
3. **Histórico da Jornada:** Você pode registrar as perguntas mais difíceis que responderam na entrevista, o feedback recebido e o que precisa melhorar para a próxima fase.
4. **Inteligência Artificial Auxiliar:** As anotações que você faz no Diário de Bordo alimentam o Assistente de Carreira para sugerir treinos de entrevista mais específicos na etapa seguinte.

---

## ⚠️ 5. O Que Acontece em Caso de Erro de Conexão?

* Se a sua internet oscilar ao mover um card do Kanban ou salvar uma nota do Diário de Bordo:
  1. O sistema exibe um aviso claro na tela (Toast de Alerta).
  2. O card retorna automaticamente para a posição correta original para evitar divergências.
  3. O seu histórico permanece 100% seguro.
