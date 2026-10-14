# Plano de estabilização multiempresa

## Contrato de isolamento

1. Toda tabela operacional deve possuir `escola_id` e, quando o dado pertencer a uma unidade, `unidade_id`.
2. Nenhuma autorização pode depender somente da interface. Leitura e escrita devem ser bloqueadas por RLS.
3. O identificador da escola vem da associação autenticada do usuário, nunca de um valor livre enviado pelo navegador.
4. Arquivos no Storage devem usar o prefixo `<escola_id>/...` e políticas equivalentes às tabelas.
5. Usuários ligados a mais de uma escola precisam selecionar explicitamente a organização ativa.
6. Administradores da plataforma só atravessam empresas por operações auditadas do Console Master.

## Fase 1

- [x] Alinhar o projeto local ao Supabase canônico `piwxpveprnwxkqlkjgux`.
- [x] Remover o fallback que conectava silenciosamente à produção.
- [x] Remover protótipos antigos das rotas de alunos, turmas e financeiro.
- [x] Corrigir os erros TypeScript existentes.
- [x] Criar barreira automática com lint, typecheck e build.
- [ ] Consolidar os scripts SQL aplicados em uma trilha oficial de migrations.
- [ ] Validar as políticas RLS no projeto de homologação com duas escolas e duas unidades.
- [ ] Tornar o contexto de escola e unidade explícito em toda consulta operacional.

## Fase 2 — ordem de execução

### 1. Diagnóstico sem alteração

- [x] Mapear consultas que escolhem a primeira escola ativa com `limit(1)`.
- [x] Mapear a cobertura de `escola_id`, `unidade_id`, RLS, Storage e funções privilegiadas.
- [ ] Executar `019_auditoria_isolamento_multiempresa.sql` no projeto canônico.
- [ ] Salvar os resultados como evidência antes de criar a migração corretiva.

### 2. Contexto explícito no aplicativo

- [ ] Criar um contexto único com `escolaId`, `unidadeId` e associações permitidas.
- [ ] Exigir seleção quando o usuário possuir mais de uma escola ativa.
- [ ] Trocar nomes de unidade usados como identificador por UUIDs.
- [ ] Invalidar dados em memória ao trocar escola ou unidade.
- [ ] Remover todos os usos operacionais de `limit(1)` em associações escolares.

### 3. Escopo por unidade no banco

- [ ] Definir quais entidades pertencem à escola e quais pertencem à unidade.
- [ ] Adicionar `unidade_id` somente após validar e planejar o preenchimento dos registros existentes.
- [ ] Criar chaves compostas que impeçam vínculos entre escolas e unidades diferentes.
- [ ] Aplicar `private.can_access_unit(escola_id, unidade_id)` nas políticas necessárias.
- [ ] Manter uma opção explícita para registros válidos em todas as unidades, quando a regra de negócio permitir.

### 4. Testes de vazamento

- [ ] Preparar duas escolas, duas unidades por escola e usuários para cada papel.
- [ ] Testar leitura e escrita por SDK, REST, URL direta e Storage.
- [ ] Testar UUID conhecido de outra escola e de outra unidade.
- [ ] Confirmar que módulos desativados também bloqueiam operações no banco.
- [ ] Executar os advisors de segurança e desempenho do Supabase.

## Riscos e prevenção da Fase 2

- **Bloquear usuários legítimos com várias escolas:** introduzir o seletor antes de remover a escolha automática.
- **Perder acesso a registros antigos:** medir nulos e definir o preenchimento de `unidade_id` antes de torná-lo obrigatório.
- **Misturar unidade pelo nome:** persistir e filtrar sempre pelo UUID; o nome fica apenas para exibição.
- **Confiar somente nos filtros da tela:** repetir o escopo nas políticas RLS e nas chaves estrangeiras compostas.
- **Quebrar a produção com migrações divergentes:** consolidar a trilha aplicada e usar verificações antes e depois de cada migração.
- **Vazar arquivos:** exigir o prefixo da escola no caminho e validar o mesmo vínculo nas políticas de Storage.

## Testes obrigatórios de isolamento

- Usuário da Escola A não lê, altera ou remove registros da Escola B, mesmo conhecendo seus UUIDs.
- Usuário restrito à Unidade A1 não acessa registros exclusivos da Unidade A2.
- Professor, coordenador, secretaria, financeiro, aluno e responsável recebem somente o escopo previsto.
- URLs diretas, chamadas REST e arquivos do Storage respeitam as mesmas regras.
- Trocar de escola ou unidade invalida caches e recarrega módulos, permissões e dados.
- Módulo desativado bloqueia a operação no banco, além de ocultar a tela.

## Riscos evitados nesta entrega

- Publicação com erros estáticos conhecidos.
- Uso acidental do projeto de produção por ausência de variáveis de ambiente.
- Manutenção de telas antigas que já não eram renderizadas.
- Divergência entre o projeto Supabase documentado e o configurado localmente.
