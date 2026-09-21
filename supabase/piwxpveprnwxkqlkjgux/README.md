# Banco Supabase confirmado pelo proprietário

Projeto: `piwxpveprnwxkqlkjgux`.

Em 21/09/2026, a inspeção em modo de leitura mostrou 11 tabelas em
`public`, todas vazias, nenhum usuário em `auth.users`, nenhuma migração
registrada e políticas `PUBLIC FOR ALL USING (true) WITH CHECK (true)`
com privilégios de leitura e escrita para `anon`. Os arquivos SQL nesta
pasta foram escritos para esse esquema já existente.

1. `001_fechar_acesso_publico.sql` foi aplicado ao projeto confirmado.
   Removeu políticas abertas e privilégios de `anon`/`authenticated`.
2. `002_identidade_escolas_e_rls.sql` também foi aplicado ao projeto
   confirmado. Cria vínculos e políticas por escola, concede apenas leitura
   aos papéis permitidos e expira o acesso ao fim do trial de 14 dias.
   A verificação inicial abortaria caso algum dado operacional tivesse sido
   criado depois da inspeção.
3. `003_trial_e_unidade_inicial.sql` prepara cadastro autônomo. Cria a
   primeira unidade e uma função restrita que cadastra um único trial para
   uma conta autenticada e confirmada. O usuário cria a conta em `/cadastro`.
4. `004_privilegio_cadastro.sql` move a implementação privilegiada para o
   esquema privado. A função pública não eleva privilégios; o verificador
   de segurança não apontou alertas após essa etapa.

Estes arquivos **não estão na pasta de migrações automática** porque
`supabase/config.toml` referencia outro projeto e as três migrações
anteriores descrevem outro esquema (`profiles`/`user_roles`).
Não execute `supabase db push` neste repositório contra o projeto
confirmado. As migrações foram registradas no histórico do projeto
confirmado.

Antes de liberar `/cadastro` em produção, configure no Supabase Auth o URL
do site publicado e permita o redirecionamento para `/cadastro`. É preciso
validar a entrega de e-mail de confirmação e executar um teste completo com
uma conta real. O banco começa sem usuários e sem escolas.

Ainda faltam convites, APIs de escrita por papel, isolamento por unidade,
portal do aluno com dados reais e testes de acesso cruzado. As telas do ERP
ainda contêm dados demonstrativos; esta etapa não conclui o produto vendável.
