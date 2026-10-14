# Correção de módulos e assinatura da The Bridge

## Diagnóstico

O plano Profissional inclui `core`, `financeiro`, `crm`, `captacao` e
`portal_aluno`. A conta da The Bridge apresentava também `success`, `asaas` e
`nota_fiscal` como ativos. Esses três módulos não pertencem ao plano exibido no
Console Master.

A tela do gestor somava preços do catálogo para calcular a assinatura e não
consultava o valor real registrado em `contratos_escola`.

## Tarefas

- [x] Classificar módulos como incluído no plano, adicional ativo, disponível ou
      pendente de configuração.
- [x] Exibir valor, ciclo, status, próxima cobrança e meio de pagamento do
      contrato da escola ativa.
- [x] Adicionar ao Console Master o cadastro do meio de pagamento mascarado.
- [x] Criar migration com validação, auditoria e autorização exclusiva do
      Console Master.
- [x] Criar operação de reconciliação específica para a The Bridge.
- [x] Manter compatibilidade do frontend enquanto a migration não for aplicada.
- [ ] Executar a migration `020_assinatura_pagamento_gestor.sql`.
- [ ] Executar `operacao_reconciliar_the_bridge_profissional.sql`.
- [ ] Conferir o resultado com o login do gestor.

## Riscos e controles

- **Alterar outra escola:** a operação exige exatamente uma escola com o nome
  The Bridge e interrompe a transação se essa condição não for atendida.
- **Aplicar outro plano:** a operação exige que o plano atual seja
  `profissional`.
- **Expor cartão:** somente método e descrição mascarada são armazenados; oito
  dígitos consecutivos são rejeitados.
- **Misturar assinatura com mensalidades:** os novos campos ficam em
  `contratos_escola`, separados de `transacoes_financeiras`.
- **Quebrar o frontend antes do SQL:** a leitura tenta os novos campos e recua
  para o contrato antigo quando as colunas ainda não existem.
- **Vazamento entre escolas:** toda leitura parte do vínculo ativo e filtra pelo
  `escola_id` selecionado.
