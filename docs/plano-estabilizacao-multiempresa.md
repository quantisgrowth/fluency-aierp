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
