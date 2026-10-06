# Fundação Multiempresa — diagnóstico e plano de consolidação

Data do diagnóstico: 06/10/2026

## Situação da implantação

A migração 008 foi aplicada ao projeto Supabase `piwxpveprnwxkqlkjgux` em
06/10/2026 e validada por consulta somente leitura. A validação confirmou:

- quatro novas tabelas públicas: `audit_logs`, `convite_unidades`,
  `convites_acesso` e `escola_membro_unidades`;
- armazenamento privado dos hashes de convite em `private.convite_tokens`;
- helpers privados `private.is_platform_admin(text[])` e
  `private.can_access_unit(uuid, uuid)`;
- quatro políticas de RLS nas novas tabelas;
- colunas `nome`, `papel`, `status` e `updated_at` em `platform_admins`;
- preservação dos registros existentes: uma escola, um usuário, um membro e
  um administrador da plataforma.

A consulta executada pelo SQL Editor não possui sessão de usuário da aplicação,
por isso `private.is_platform_admin()` retornou `false` durante a validação. Isso
não representa falha do administrador cadastrado; a função depende de
`auth.uid()` e será testada em uma sessão autenticada no pacote de integração.

Este documento descreve o primeiro pacote técnico da Fluency AI. Ele preserva
as telas e os fluxos atuais e substitui, gradualmente, dados demonstrativos por
operações reais e seguras.

## 1. Estado confirmado

### Pré-validação do banco em 06/10/2026

- Todas as dez tabelas fundamentais consultadas existem.
- O banco possui uma escola, uma unidade, um usuário, um membro e um
  administrador da plataforma.
- Os nomes das constraints esperadas pelo rascunho foram confirmados.
- `private.is_member` e `private.create_trial_school` usam `SECURITY DEFINER`
  com `search_path` vazio.
- As políticas atuais de escola, unidade, membro, usuário e administrador
  estão restritas a `authenticated`.
- O histórico de migrações registra somente as etapas 001 a 004, mas a segunda
  verificação confirmou que 005 a 007 foram aplicadas fora desse histórico:
  RLS, políticas de `INSERT`/`UPDATE`, grants e índices de integridade existem.
- O único membro possui perfil operacional da mesma escola, não há usuário sem
  vínculo e o administrador da plataforma aponta para um usuário Auth válido.
- `escola_membros` aceita o papel `responsavel`, mas `usuarios.role` ainda não;
  o rascunho corrige essa divergência.

### Base real já disponível

- Supabase Auth para cadastro, confirmação, login e recuperação de senha.
- Trial de 14 dias criado de forma transacional.
- `escolas`, `unidades`, `escola_membros` e `platform_admins`.
- RLS por escola para leitura e escrita do núcleo acadêmico.
- Cursos, turmas, alunos, matrículas e lançamentos financeiros manuais.
- Integridade entre registros da mesma escola por chaves compostas.

### Funcionalidades híbridas ou demonstrativas

- Console Master: escolas, equipe, módulos, MRR, logs e personalização.
- CRM, captação e formulários públicos.
- Portal do aluno, retenção e gamificação.
- Inventário e diversas configurações administrativas.
- Custos, precificação, inadimplência, boleto e Pix do financeiro.
- Tema e identidade white label.

Essas áreas usam dados fixos ou `localStorage`. Existem 19 arquivos com uso de
`localStorage`; armazenamento de sessão e preferência visual pode permanecer
local, mas dados de negócio devem migrar para o Supabase.

## 2. Decisões de arquitetura

### Identidade definitiva

- `auth.users`: credencial e sessão.
- `public.escola_membros`: vínculo do usuário com a escola e papel principal.
- `public.escola_membro_unidades`: unidades permitidas para cada vínculo.
- `public.usuarios`: perfil operacional exibido dentro da escola.
- `public.platform_admins`: equipe interna da Fluency AI.
- `public.convites_acesso`: ciclo de convite, aceite, expiração e cancelamento.
- `public.audit_logs`: trilha imutável de ações administrativas e operacionais.

O modelo legado `profiles`, `user_roles` e `app_role` não deve ser conectado à
aplicação atual. As migrações antigas devem ser arquivadas ou substituídas em
uma etapa separada, depois de comparar o histórico do banco remoto.

### Papéis escolares iniciais

- `gestor`
- `secretaria`
- `financeiro`
- `pedagogico`
- `comercial`
- `professor`
- `aluno`
- `responsavel`

Permissões específicas devem ser derivadas do papel e, futuramente, de
concessões explícitas. Não devem vir de `user_metadata` ou do navegador.

### Papéis da plataforma

- `administrador`
- `suporte`
- `financeiro`
- `comercial`
- `tecnico`

MFA será obrigatório para administradores da plataforma antes da abertura
comercial.

## 3. Problemas que o primeiro pacote resolve

1. O mesmo e-mail precisa poder participar de mais de uma escola.
2. Um usuário precisa poder acessar uma ou várias unidades da mesma escola.
3. O Console Master precisa consultar escolas reais.
4. Convites não podem existir somente como mensagens visuais.
5. Ações sensíveis precisam gerar auditoria imutável.
6. Administradores da plataforma precisam de leitura global autorizada.
7. Usuários escolares não podem visualizar outra escola ou unidade.

O pacote 008 cria o vínculo de acesso às unidades. O isolamento das tabelas
operacionais por unidade será uma migração posterior: hoje cursos, turmas,
alunos e financeiro possuem `escola_id`, mas ainda não carregam `unidade_id`.
Até essa segunda migração, a autorização permanece por escola.

## 4. Pacotes de entrega

### Pacote A — banco e autorização

- Consolidar os papéis e vínculos.
- Criar associação de membros com unidades.
- Criar convites de acesso.
- Criar auditoria.
- Adicionar helpers privados para plataforma, escola e unidade.
- Ajustar RLS e índices.
- Criar testes de acesso cruzado.

### Pacote B — operações de servidor

- [Preparado localmente] Listar escolas, equipe e auditoria para o Console Master.
- [Preparado localmente] Criar escola, unidade principal e convite do gestor.
- [Preparado localmente] Cancelar convite e concluir o primeiro acesso.
- [Preparado localmente] Bloquear, reativar e editar a escola.
- [Preparado localmente] Gravar auditoria nessas operações.
- [Preparado localmente] Edge Function protegida para ações privilegiadas.
- [Pendente] Reenviar convite por e-mail.
- [Pendente] Alterar papel, unidades e status dos membros escolares.
- [Pendente] Aplicar a migração 009 e publicar a Edge Function após aprovação.

### Pacote C — conexão das telas atuais

- Substituir `DEFAULT_SCHOOLS` por consulta real.
- Substituir `DEFAULT_TEAM` por equipe real.
- Conectar edição de escola, status e limites.
- Conectar gestão de gestores e colaboradores.
- Exibir carregamento, vazio, sucesso e erro.
- Manter o layout atual.

### Pacote D — validação

- Escola A e Escola B com dados distintos.
- Gestor A não lê nem altera a Escola B.
- Usuário de uma unidade não acessa outra sem vínculo.
- Convite expirado ou cancelado não pode ser aceito.
- Usuário suspenso perde acesso.
- Administrador master autorizado acessa a visão global.
- Toda mutação sensível cria um log.

## 5. Ordem de migração do localStorage

1. Console Master e gestão de usuários.
2. Módulos contratados e limites.
3. CRM e captação.
4. Portal do aluno e responsáveis.
5. Retenção, gamificação e inventário.
6. Preferências white label.

Preferências de interface sem valor operacional, como a aba aberta ou a
densidade da lista, podem continuar locais.

## 6. Critérios de aceite da Fundação Multiempresa

- Uma escola pode ser criada pelo fluxo autorizado.
- Uma unidade principal é criada junto da escola.
- Um gestor recebe convite real e define a própria senha.
- O gestor enxerga somente sua escola e unidades permitidas.
- O Console Master lista dados reais, sem escolas fictícias.
- Papéis e status são aplicados no banco por RLS.
- Logs permitem filtrar escola, usuário, ação e período.
- Nenhuma credencial privilegiada é enviada ao navegador.
- Testes de isolamento passam antes da aplicação em produção.

## 7. Dependências externas futuras

Estas ações exigem aprovação antes de serem executadas:

- Novas migrações ou alterações no Supabase após a etapa 008.
- Configuração de secrets ou Edge Functions.
- Envio de e-mails reais.
- Alteração no domínio ou DNS.
- Publicação no Lovable.
- Push para o GitHub.
