-- ==============================================================================
-- FLUENCY AI ERP - SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Escolas / Tenants
CREATE TABLE IF NOT EXISTS public.escolas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    slug VARCHAR(100) UNIQUE NOT NULL,
    plano VARCHAR(50) DEFAULT 'pro',
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Perfis de Usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    cargo VARCHAR(100),
    role VARCHAR(50) DEFAULT 'gestor' CHECK (role IN ('superadmin', 'admin', 'gestor', 'secretaria', 'financeiro', 'pedagogico', 'comercial', 'professor', 'aluno')),
    status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'pendente', 'inativo', 'suspenso')),
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Níveis Educacionais (CEFR e Customizados)
CREATE TABLE IF NOT EXISTS public.niveis_educacionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    horas_sugeridas INTEGER DEFAULT 60,
    ordem INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Cursos e Produtos Educacionais
CREATE TABLE IF NOT EXISTS public.cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    modalidade VARCHAR(50) DEFAULT 'mensalidade_fixa',
    nivel VARCHAR(100),
    duracao_aula_minutos INTEGER DEFAULT 90,
    vezes_por_semana INTEGER DEFAULT 2,
    carga_horaria_semanal NUMERIC(5,2) DEFAULT 3.0,
    carga_horaria_mensal NUMERIC(5,2) DEFAULT 13.0,
    carga_horaria_total NUMERIC(5,2) DEFAULT 60.0,
    valor_base NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    descricao TEXT,
    publico_alvo VARCHAR(255),
    ativo BOOLEAN DEFAULT true,
    permite_turma BOOLEAN DEFAULT true,
    max_alunos_turma INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Turmas
CREATE TABLE IF NOT EXISTS public.turmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
    curso_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
    nome VARCHAR(255) NOT NULL,
    codigo VARCHAR(50),
    nivel VARCHAR(50),
    modalidade VARCHAR(50) DEFAULT 'presencial',
    status VARCHAR(50) DEFAULT 'ativa' CHECK (status IN ('planejamento', 'matriculas_abertas', 'ativa', 'concluida', 'cancelada')),
    dias_semana TEXT[] DEFAULT ARRAY['segunda', 'quarta'],
    horario_inicio TIME,
    horario_fim TIME,
    sala VARCHAR(100),
    professor_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    professor_nome VARCHAR(255),
    capacidade_maxima INTEGER DEFAULT 15,
    data_inicio DATE,
    data_fim DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Alunos
CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
    -- Dados do Aluno
    nome VARCHAR(255) NOT NULL,
    data_nascimento DATE,
    rg VARCHAR(30),
    cpf VARCHAR(20),
    genero VARCHAR(50),
    endereco TEXT,
    telefone VARCHAR(50),
    email VARCHAR(255),
    foto_url TEXT,
    -- Dados do Responsável
    responsavel_nome VARCHAR(255),
    responsavel_data_nascimento DATE,
    responsavel_rg VARCHAR(30),
    responsavel_cpf VARCHAR(20),
    responsavel_endereco TEXT,
    responsavel_telefone VARCHAR(50),
    responsavel_email VARCHAR(255),
    responsavel_contato VARCHAR(100),
    -- Dados Pedagógicos
    idioma_curso VARCHAR(100) DEFAULT 'Inglês',
    nivel_atual VARCHAR(50) DEFAULT 'A1',
    turma_atual_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
    turma_nome VARCHAR(255),
    data_inicio DATE DEFAULT CURRENT_DATE,
    fez_teste_nivel BOOLEAN DEFAULT false,
    resultado_teste_nivel VARCHAR(50),
    status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'trancado', 'cancelado', 'concluido', 'inadimplente', 'bolsista', 'em_avaliacao')),
    -- Dados Financeiros e Comerciais
    dia_vencimento INTEGER DEFAULT 10,
    forma_pagamento_preferencial VARCHAR(50) DEFAULT 'PIX',
    valor_mensalidade NUMERIC(10,2) DEFAULT 0.00,
    desconto_aplicado NUMERIC(10,2) DEFAULT 0.00,
    canal_aquisicao VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Matrículas e Histórico de Turmas
CREATE TABLE IF NOT EXISTS public.matriculas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE,
    data_inicio DATE DEFAULT CURRENT_DATE,
    data_fim DATE,
    status VARCHAR(50) DEFAULT 'ativa' CHECK (status IN ('ativa', 'trancada', 'cancelada', 'concluida')),
    nota_final NUMERIC(4,2),
    frequencia_percentual NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Leads e CRM Comercial
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(50),
    origem VARCHAR(100) DEFAULT 'site',
    etapa VARCHAR(50) DEFAULT 'novo_lead' CHECK (etapa IN ('novo_lead', 'contato_realizado', 'nivelamento_agendado', 'nivelamento_concluido', 'proposta_enviada', 'matricula_iniciada', 'ganho', 'perdido')),
    interesse_curso VARCHAR(100),
    nivel_interesse VARCHAR(50),
    probabilidade INTEGER DEFAULT 50,
    valor_potencial NUMERIC(10,2) DEFAULT 0.00,
    responsavel_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    responsavel_nome VARCHAR(255),
    motivo_perda TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Atividades e Follow-ups do CRM
CREATE TABLE IF NOT EXISTS public.crm_atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    tipo VARCHAR(50) DEFAULT 'whatsapp' CHECK (tipo IN ('ligacao', 'whatsapp', 'email', 'reuniao_presencial', 'teste_nivel', 'outro')),
    descricao TEXT NOT NULL,
    data_agendada TIMESTAMP WITH TIME ZONE,
    concluida BOOLEAN DEFAULT false,
    responsavel_nome VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Transações Financeiras (Receitas, Despesas, Mensalidades)
CREATE TABLE IF NOT EXISTS public.transacoes_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    categoria VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'atrasado', 'cancelado', 'estornado')),
    forma_pagamento VARCHAR(50) CHECK (forma_pagamento IN ('pix', 'boleto', 'cartao_credito', 'cartao_debito', 'transferencia', 'dinheiro')),
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE SET NULL,
    numero_fatura VARCHAR(50),
    comprovante_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Inventário e Materiais Didáticos
CREATE TABLE IF NOT EXISTS public.inventario_materiais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'livro_fisico' CHECK (tipo IN ('livro_fisico', 'licenca_digital', 'brinde', 'uniforme', 'equipamento', 'outro')),
    nivel VARCHAR(50),
    codigo_sku VARCHAR(50) UNIQUE,
    preco_venda NUMERIC(10,2) DEFAULT 0.00,
    custo_aquisicao NUMERIC(10,2) DEFAULT 0.00,
    estoque_atual INTEGER DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 5,
    fornecedor VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ÍNDICES DE ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_escola ON public.usuarios(escola_id);
CREATE INDEX IF NOT EXISTS idx_alunos_escola ON public.alunos(escola_id);
CREATE INDEX IF NOT EXISTS idx_alunos_status ON public.alunos(status);
CREATE INDEX IF NOT EXISTS idx_turmas_escola ON public.turmas(escola_id);
CREATE INDEX IF NOT EXISTS idx_leads_escola ON public.leads(escola_id);
CREATE INDEX IF NOT EXISTS idx_leads_etapa ON public.leads(etapa);
CREATE INDEX IF NOT EXISTS idx_transacoes_escola ON public.transacoes_financeiras(escola_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_vencimento ON public.transacoes_financeiras(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON public.transacoes_financeiras(status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niveis_educacionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_materiais ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- MIGRAÇÃO RÁPIDA: Atualização de colunas caso a tabela 'alunos' já exista
-- ==============================================================================
ALTER TABLE IF EXISTS public.alunos
    ADD COLUMN IF NOT EXISTS data_nascimento DATE,
    ADD COLUMN IF NOT EXISTS rg VARCHAR(30),
    ADD COLUMN IF NOT EXISTS cpf VARCHAR(20),
    ADD COLUMN IF NOT EXISTS genero VARCHAR(50),
    ADD COLUMN IF NOT EXISTS endereco TEXT,
    ADD COLUMN IF NOT EXISTS telefone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS foto_url TEXT,
    ADD COLUMN IF NOT EXISTS responsavel_nome VARCHAR(255),
    ADD COLUMN IF NOT EXISTS responsavel_data_nascimento DATE,
    ADD COLUMN IF NOT EXISTS responsavel_rg VARCHAR(30),
    ADD COLUMN IF NOT EXISTS responsavel_cpf VARCHAR(20),
    ADD COLUMN IF NOT EXISTS responsavel_endereco TEXT,
    ADD COLUMN IF NOT EXISTS responsavel_telefone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS responsavel_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS responsavel_contato VARCHAR(100),
    ADD COLUMN IF NOT EXISTS idioma_curso VARCHAR(100) DEFAULT 'Inglês',
    ADD COLUMN IF NOT EXISTS turma_nome VARCHAR(255),
    ADD COLUMN IF NOT EXISTS data_inicio DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS fez_teste_nivel BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS resultado_teste_nivel VARCHAR(50),
    ADD COLUMN IF NOT EXISTS dia_vencimento INTEGER DEFAULT 10,
    ADD COLUMN IF NOT EXISTS forma_pagamento_preferencial VARCHAR(50) DEFAULT 'PIX',
    ADD COLUMN IF NOT EXISTS valor_mensalidade NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS desconto_aplicado NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS canal_aquisicao VARCHAR(100);
