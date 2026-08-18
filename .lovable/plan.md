# ERP Modular para Escolas de Idiomas — Estrutura Base

Fundação visual e estrutural de um ERP modular ("Luxury Tech & Minimalist": Apple + SpaceX + Asaas), com dados simulados nesta primeira fase. Nada de backend ainda.

## Design system (base de tudo)

- Dark mode nativo como padrão, com light mode disponível via toggle.
- Paleta em tokens `oklch` no `src/styles.css`: fundo grafite espacial quase preto, superfícies elevadas em cinza fosco, texto branco absoluto, acento único frio (azul-prata) e tokens semânticos de status financeiro (pago / a vencer / vencido / churn).
- Tokens extras: `--glass-bg`, `--glass-border` (borda hairline 1px), `--shadow-elevated`, gradiente sutil de painel.
- Tipografia sem-serifa geométrica carregada via `<link>` no `__root.tsx`, com números tabulares para indicadores financeiros.
- Espaçamento generoso, raio consistente, transições curtas e suaves (hover, expand/collapse, entrada de cards).

## Estrutura de tela

- **Shell principal** (`__root.tsx`): sidebar retrátil (expandida / mini com ícones) + topbar fina com busca, seletor de escola, tema e avatar.
- **Sidebar**: logotipo conceitual da plataforma (marca em SVG/monograma), navegação agrupada por módulo. Itens de módulos desativados ficam ocultos ou marcados como bloqueados com selo de upgrade.
- **Dashboard do Gestor** (rota `/`): 
  - Faixa de KPIs em cards glassmorphism: faturamento do mês, alunos ativos, taxa de conversão do CRM, inadimplência.
  - Gráfico de faturamento/previsibilidade (área) e barra de status de cobrança em coorte.
  - Painéis laterais: alertas de inadimplência, risco de evasão, próximas turmas.
  - Cada bloco só aparece se o módulo correspondente estiver ativo.
- **Simulador de Planos** (rota `/admin/modulos`): cards dos 4 módulos com switch de ativação, descrição, preço fictício e resumo do plano resultante. Ligar/desligar reflete imediatamente na sidebar e no dashboard.

## Módulos e rotas iniciais

| Módulo | Rotas nesta fase |
| --- | --- |
| 1. Core Pedagógico (base, sempre ativo) | `/alunos`, `/turmas` (listas por nível CEFR, matrícula contínua) |
| 2. Financeiro | `/financeiro` (fluxo de caixa, cobranças, régua) |
| 3. CRM | `/crm` (funil Kanban de 4 estágios) |
| 4. Success & Portais | `/retencao` (alertas de churn, diário de classe) |

Nesta entrega as telas de módulo vêm com layout e dados mock consistentes — profundidade funcional entra nas próximas etapas.

## Detalhes técnicos

- TanStack Start com rotas em arquivos; shell em `__root.tsx`; cada rota com `head()` próprio (título/descrição/OG).
- Estado dos módulos em um `ModuleProvider` (contexto React) persistido em `localStorage`, com hook `useModules()` e componente `<ModuleGate module="financeiro">` para condicionar navegação e blocos do dashboard. Rotas de módulo inativo redirecionam para uma tela de upgrade.
- Componentes reutilizáveis: `GlassCard`, `KpiCard`, `SectionHeader`, `StatusPill`, `DataTable`, `KanbanBoard`.
- Gráficos com Recharts (já instalado), estilizado pelos tokens — sem cores fixas.
- Dados mock centralizados em `src/data/*` para troca simples por backend depois.
- Zero classes de cor fixas (`text-white`, `bg-black`); tudo por tokens semânticos.

## Próximos passos sugeridos

Após aprovar: ativar o Lovable Cloud para persistir alunos, turmas, cobranças e planos por escola, além de autenticação e papéis (gestor, professor, aluno).
