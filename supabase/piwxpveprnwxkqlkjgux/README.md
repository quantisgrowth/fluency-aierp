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
5. `005_operacao_academica.sql` permite escrita em cursos, turmas, alunos e
   matrículas apenas para membros ativos da escola com papéis adequados.
6. `006_financeiro_manual.sql` permite lançamentos manuais apenas para gestor
   e financeiro da própria escola.
7. `007_integridade_academica.sql` impede códigos de curso repetidos na mesma
   escola e matrículas ativas duplicadas na mesma turma.

Estes arquivos **não estão na pasta de migrações automática** porque
`supabase/config.toml` referencia outro projeto e as três migrações
anteriores descrevem outro esquema (`profiles`/`user_roles`).
Não execute `supabase db push` neste repositório contra o projeto
confirmado. As migrações foram registradas no histórico do projeto
confirmado.

O Supabase Auth foi configurado com Site URL
`https://fluency-aierp.lovable.app` e retorno permitido para
`https://fluency-aierp.lovable.app/cadastro`. O cadastro e a confirmação
foram validados com a escola de teste The Bridge em 22/09/2026. O remetente
Resend ainda aceita somente o endereço de teste autorizado; um domínio de
envio verificado é necessário antes de abrir o trial a todos. A URL local
`http://localhost:5173/cadastro` está permitida temporariamente para testes
e deve ser removida ao final. `/boas-vindas` mostra nome da escola, unidade
e prazo do trial consultados do banco. Cursos, turmas, alunos, matrículas e
lançamentos financeiros manuais passam a ler e gravar registros da escola.

Ainda faltam convites, isolamento por unidade, portal do aluno com dados
reais, cobrança automática, notas fiscais, demais módulos operacionais e
testes de acesso cruzado. Os painéis fora das rotas acadêmicas e do financeiro
manual ainda usam dados demonstrativos; esta etapa não conclui o produto vendável.
