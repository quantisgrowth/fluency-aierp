# Resultado da auditoria de isolamento — 14/10/2026

## Resultado

- 45 tabelas expostas e `storage.objects` estão com RLS e ao menos uma política.
- 34 tabelas operacionais possuem `escola_id`.
- O bucket `curso-documentos` é privado e possui quatro políticas baseadas no prefixo da escola.
- Todas as funções `SECURITY DEFINER` encontradas possuem `search_path` fixo.
- Não foram encontrados vínculos inconsistentes entre membro, escola e unidade.
- Não há usuário atualmente associado a mais de uma escola ativa.

## Alertas classificados

- `contrato_modulos` e `contrato_versoes` herdam a escola por `contrato_id`, ligado a `contratos_escola`. As políticas permitem leitura apenas ao Console Master.
- `modulos_catalogo`, `planos_catalogo` e `plano_modulos` são catálogos globais de leitura para usuários autenticados. Não contêm dados de uma escola específica.

Esses cinco itens são comportamentos intencionais e não representam vazamento entre escolas.

## Lacuna confirmada

O isolamento por escola está estruturalmente coberto. O isolamento por unidade ainda não está completo: a maioria das tabelas operacionais não possui `unidade_id` e o seletor anterior usava o nome da unidade apenas na interface.

## Mudanças desta etapa

- Associação escolar ativa resolvida em um único ponto.
- Usuário com várias escolas precisa escolher explicitamente a escola.
- Escola preferida fica vinculada ao usuário autenticado.
- Seletor de unidade usa UUID e guarda a escolha por usuário e escola.
- Troca de escola recarrega módulos, identidade e dados, evitando reaproveitamento de estado.

## Próxima migração

Antes de adicionar `unidade_id`, será executado um inventário de registros existentes e definida a unidade de preenchimento para cada tabela. A alteração deverá incluir chaves compostas, políticas com `private.can_access_unit` e testes com duas unidades da mesma escola.
