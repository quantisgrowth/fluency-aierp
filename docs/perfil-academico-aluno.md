# Perfil acadêmico do aluno

## Tarefas entregues

- [x] Consultar cursos da escola junto com alunos, turmas e matrículas ativas.
- [x] Relacionar matrícula → turma → curso sem copiar esses dados para o cadastro pessoal.
- [x] Exibir curso, turma, nível ou etapa, professor, coordenador e situação da matrícula.
- [x] Orientar o gestor quando o aluno ainda não possui matrícula ativa.
- [x] Manter objetivo, meta, acessibilidade e observações como informações próprias do aluno.

## Próximas evoluções

- [ ] Exibir matrículas concluídas e canceladas em uma seção de histórico.
- [ ] Permitir escolher a matrícula principal quando houver mais de uma matrícula ativa.
- [ ] Exibir a etapa estruturada do curso pelo vínculo `curso_etapa_id` da turma.
- [ ] Registrar alterações de matrícula na linha do tempo acadêmica.

## Riscos analisados e prevenção

- **Divergência entre aluno e turma:** curso, turma e equipe são derivados da matrícula, sem edição duplicada no aluno.
- **Vazamento entre escolas:** todas as consultas continuam filtradas pelo `escola_id` da sessão e protegidas por RLS.
- **Aluno com várias matrículas:** cada vínculo ativo aparece separadamente, sem ocultar informações.
- **Turma ou curso removido:** o perfil apresenta “Não informado” e continua acessível.
- **Aluno ainda não matriculado:** o estado vazio explica onde o vínculo deve ser criado.
