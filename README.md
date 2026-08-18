# Fluency AI

Atue como um Arquiteto de Software Sênior e Especialista em UI/UX de Alta Performance. Quero que você inicie o desenvolvimento da estrutura base de um ERP modular e moderno voltado para o ecossistema de Escolas de Idiomas e Cursos Livres (focado em matrículas contínuas, turmas por proficiência e gestão financeira recorrente).

---

### 1. DIRETRIZES DE IDENTIDADE VISUAL & ESTÉTICA ("Luxury Tech & Minimalist")

A interface deve respirar um design sofisticado, limpo e de altíssima precisão visual, unindo as seguintes referências:

*   **Apple:** Minimalismo absoluto, tipografia sem-serifa impecável, espaçamentos generosos (whitespace), uso cirúrgico de micro-interações suaves e transições fluidas.

*   **SpaceX:** Sobriedade tecnológica, painéis de controle (*Dashboards*) focados em densidade de dados limpa, modo escuro (*Dark Mode*) nativo de alto padrão com tons profundos de cinza espacial/preto fosco, contrastes em branco absoluto e detalhes metálicos/prateados discretos.

*   **Asaas:** Clareza e confiabilidade em painéis financeiros, indicadores numéricos em destaque com grandes infográficos de faturamento, barras de status de cobrança intuitivas e hierarquia visual focada em conversão e clareza de caixa.

---

### 2. ARQUITETURA MODULAR (Focada em Up-sell / Down-sell)

O sistema deve ser construído de forma estritamente modular e componentizada. Cada módulo principal deve ser independente o suficiente para ser ativado ou desativado via painel administrativo conforme o plano contratado pelo cliente (perfeito para estratégias de Upsell e Down-sell de planos):

1.  **Módulo 1: Core Pedagógico & Turmas (Módulo Base / Essencial)**

    *   Gestão de alunos, professores e turmas organizadas por níveis de proficiência (ex: CEFR A1 a C2) e não por séries anuais rígidas.

    *   Matrícula contínua (entrada de alunos a qualquer momento).

2.  **Módulo 2: Motor Financeiro & Cobrança (Módulo Add-on de Receita)**

    *   Dashboard financeiro com previsibilidade de fluxo de caixa, emissão simulada de boletos/Pix e controle de inadimplência com régua de cobrança.

3.  **Módulo 3: CRM Comercial & Captação (Módulo Add-on de Vendas)**

    *   Funil Kanban visual de oportunidades de leads (Lead -> Contato -> Aula Experimental -> Matrícula Fechada).

4.  **Módulo 4: Success, Retenção & Portais (Módulo Enterprise)**

    *   Alertas preditivos de risco de evasão (Churn), diário de classe digital para professores e portal do aluno.

---

### 3. ESTRUTURA INICIAL DA TELA (O QUE GERAR AGORA)

Crie o layout principal contendo:

*   Um **Sidebar retrátil** de navegação lateral com o logotipo conceitual da plataforma.

*   Um **Dashboard Central (Visão Geral do Gestor)** exibindo indicadores de faturamento, alunos ativos, taxa de conversão do CRM e alertas de inadimplência em cards com efeito de vidro fosco (*Glassmorphism*) sutil e bordas finas.

*   Um **Seletor de Módulos (Simulador de Planos)** na interface administrativa para demonstrar como a plataforma se adapta caso um cliente adicione ou remova módulos.

Comece estruturando a base da aplicação aplicando rigorosamente o design system especificado.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fluency-aierp.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4d77fc1e-e917-4aab-abc6-4430089dd408).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
