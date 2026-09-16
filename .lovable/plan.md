# Cadastro real de usuários com convite por e-mail

## Objetivo
Transformar a tela **Usuários & Permissões** em um cadastro real: ao adicionar um colaborador, criar a conta no Lovable Cloud, salvar perfil, função, unidades e permissões, e enviar automaticamente um convite para definir a senha.

## Implementação
1. **Segurança e dados**
   - Criar estruturas separadas para perfis, funções e permissões, vinculadas às contas autenticadas.
   - Aplicar regras para que somente administradores autenticados possam listar, cadastrar, editar, reenviar convites, redefinir acesso e remover colaboradores.
   - Manter funções fora do perfil para impedir elevação indevida de privilégios.

2. **Cadastro e convite**
   - Criar operações protegidas no servidor para cadastrar, atualizar, remover e convidar usuários.
   - No cadastro, criar a conta pelo e-mail informado, registrar seus dados e disparar o convite de acesso automaticamente.
   - Tratar e-mails duplicados e falhas de envio com mensagens claras, sem deixar cadastros incompletos.

3. **Tela de usuários**
   - Substituir os dados locais pela lista real do Lovable Cloud.
   - Conectar cadastrar, editar, excluir, reenviar convite e redefinir senha às operações reais.
   - Exibir progresso durante cada ação e confirmar o envio no próprio painel.

4. **Acesso do convidado**
   - Ajustar a entrada por e-mail para que o colaborador convidado consiga concluir o acesso e entrar na plataforma.
   - Remover a criação automática de contas ao errar uma senha.

5. **Validação**
   - Testar cadastro, persistência das permissões e disparo do convite.
   - Verificar a tela em desktop e celular e confirmar que erros são apresentados sem travar a página.

## Observação
O projeto já tinha erros de verificação em outras áreas, não relacionados ao cadastro. Serão corrigidos apenas os bloqueios que impedirem esta entrega; os demais ficam fora deste escopo.
