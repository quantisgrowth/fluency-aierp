# Banco Supabase confirmado pelo proprietário

Projeto: `piwxpveprnwxkqlkjgux`.

Em 21/09/2026, a inspeção em modo de leitura mostrou 11 tabelas em
`public`, todas vazias, nenhum usuário em `auth.users`, nenhuma migração
registrada e políticas `PUBLIC FOR ALL USING (true) WITH CHECK (true)`
com privilégios de leitura e escrita para `anon`. Por isso, os dois
arquivos SQL nesta pasta foram escritos para esse esquema já existente.

1. `001_fechar_acesso_publico.sql` foi aplicado ao projeto confirmado.
   Removeu políticas abertas e privilégios de `anon`/`authenticated`.
2. `002_identidade_escolas_e_rls.sql` também foi aplicado ao projeto
   confirmado. Cria vínculos e políticas por escola, concede apenas leitura
   aos papéis permitidos e expira o acesso ao fim do trial de 14 dias.
   A verificação inicial abortaria caso algum dado operacional tivesse sido
   criado depois da inspeção.

Estes arquivos **não estão na pasta de migrações automática** porque
`supabase/config.toml` referencia outro projeto e as três migrações
anteriores descrevem outro esquema (`profiles`/`user_roles`).
Não execute `supabase db push` neste repositório contra o projeto
confirmado. As duas migrações já foram registradas no histórico do projeto
confirmado.

Após 002, ainda faltam cadastro autônomo/trial, convites, associação de
usuários, APIs de escrita por papel e testes de acesso cruzado. Sem uma
conta explicitamente vinculada ou um administrador da plataforma
provisionado pelo servidor, o acesso deve continuar negado.
