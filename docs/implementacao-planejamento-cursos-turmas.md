# Implementação: planejamento de cursos e turmas

## Entregue nesta etapa

- [x] Transformar modalidade em uma opção controlada: presencial, online ou híbrida.
- [x] Exibir campos de sala ou link de aula conforme a modalidade.
- [x] Substituir professor e coordenador digitados por colaboradores ativos da escola.
- [x] Gravar os identificadores do professor e do coordenador, preservando seus nomes como histórico.
- [x] Separar idade mínima e máxima, com validação na interface e no banco.
- [x] Mover a ementa e o critério de entrada padrão para o curso.
- [x] Criar etapas ordenadas por curso e selecionar a etapa no cadastro da turma.
- [x] Permitir documento privado de ementa em PDF ou DOCX.
- [x] Incluir datas, horários, dias da semana, sala, plataforma e link online.
- [x] Detectar conflito de professor ou sala antes de salvar uma turma.
- [x] Criar migração, regras RLS e roteiro de verificação do banco.
- [x] Exibir estado de salvamento e mensagens de sucesso ou erro.
- [x] Permitir editar uma turma pelo mesmo formulário usado na criação.
- [x] Preencher o formulário de edição com etapa, equipe, agenda, modalidade e regras atuais.
- [x] Excluir a própria turma da validação de conflito durante a edição.

## Próximas evoluções

- [ ] Permitir editar etapas e documentos de um curso existente.
- [ ] Disponibilizar modelos globais de ementa por categoria de curso.
- [ ] Vincular professores às áreas e aos cursos em que podem atuar.
- [ ] Permitir professor auxiliar, substituições e histórico de alterações.
- [ ] Vincular sala a uma unidade e validar a capacidade física.
- [ ] Transformar critérios de entrada em regras executáveis na matrícula.
- [ ] Adicionar lista de espera e quantidade mínima para abertura.
- [ ] Criar fluxo de rascunho, matrículas abertas, ativa, concluída e cancelada.

## Riscos considerados e prevenção

- **Acesso entre escolas:** consultas, chaves compostas e RLS usam `escola_id`.
- **Etapa de outro curso:** a chave estrangeira inclui escola, curso e etapa.
- **Arquivos expostos:** o bucket é privado e usa políticas por escola.
- **Faixa etária inválida:** há validação na interface e `CHECK` no banco.
- **Modalidade divergente:** o banco aceita somente os três valores definidos.
- **Choque de agenda:** a interface compara professor, sala, datas, dias e horários.
- **Falso conflito ao editar:** a turma que está sendo alterada é ignorada na comparação.
- **Atualização de outra escola:** o `UPDATE` exige simultaneamente o ID da turma e o ID da escola.
- **Dados perdidos ao cancelar:** o formulário só é limpo depois de fechar ou concluir o salvamento.
- **Ementa alterada silenciosamente:** os documentos possuem versão; a evolução seguinte
  deve fixar a versão escolhida em turmas já iniciadas.
- **Colaborador removido:** os nomes são preservados como fotografia histórica do vínculo.
- **Publicação antes do banco:** execute a migração 017 e sua verificação antes de publicar
  a interface.
