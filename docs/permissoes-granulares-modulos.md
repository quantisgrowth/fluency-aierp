# Permissões granulares por módulo

## Problema encontrado

A tela de colaboradores usava quatro flags fixas e agrupava módulos distintos. A navegação também procurava outro colaborador com o mesmo cargo para decidir o acesso, o que poderia aplicar permissões incorretas.

## Alterações

- Cada colaborador passa a ter uma permissão para cada módulo do catálogo.
- A tela mostra somente módulos ativos ou em trial no contrato da escola.
- O cargo preenche uma sugestão inicial, que pode ser ajustada pelo gestor.
- Administradores da escola recebem acesso integral aos módulos contratados.
- A navegação e o `ModuleGate` consultam o usuário autenticado.
- O banco rejeita módulos desconhecidos e permissões para módulos inativos.
- Toda alteração é registrada em `audit_logs`.
- A função `private.has_module_permission` fica disponível para políticas RLS específicas.

## Riscos e controles

- **Implantação do código antes do SQL:** aplicar a migração 022 antes de publicar a aplicação.
- **Permissões antigas:** a migração cria valores iniciais conforme o cargo atual.
- **Módulo removido do contrato:** o acesso efetivo exige simultaneamente módulo ativo e permissão do colaborador.
- **Isolamento entre escolas:** a função exige que o gestor e o colaborador pertençam à escola informada.
- **Acesso por URL:** todas as páginas com `ModuleGate` validam a permissão do usuário autenticado.

## Próxima etapa de segurança

Ao criar ou revisar políticas RLS de tabelas específicas de cada módulo, usar `private.has_module_permission(escola_id, modulo_id)` junto da validação de vínculo com a escola.
