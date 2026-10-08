-- Target: piwxpveprnwxkqlkjgux. Requires 008 and the current master-admin Edge Function.
-- Persiste o resultado da solicitação de e-mail de cada convite.
BEGIN;

ALTER TABLE public.convites_acesso
  ADD COLUMN email_status text NOT NULL DEFAULT 'nao_solicitado'
    CHECK (email_status IN ('nao_solicitado','enviado','falhou')),
  ADD COLUMN email_error text,
  ADD COLUMN email_requested_at timestamptz;

CREATE INDEX convites_acesso_email_status_idx
  ON public.convites_acesso(email_status, created_at DESC);

COMMIT;
