SELECT * FROM (
  VALUES
    ('tabela','curso_etapas',to_regclass('public.curso_etapas') IS NOT NULL),
    ('tabela','curso_documentos',to_regclass('public.curso_documentos') IS NOT NULL),
    ('coluna','cursos.ementa',EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cursos' AND column_name='ementa'
    )),
    ('coluna','turmas.curso_etapa_id',EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='turmas' AND column_name='curso_etapa_id'
    )),
    ('coluna','turmas.idade_minima',EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='turmas' AND column_name='idade_minima'
    )),
    ('coluna','turmas.idade_maxima',EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='turmas' AND column_name='idade_maxima'
    )),
    ('bucket','curso-documentos',EXISTS (
      SELECT 1 FROM storage.buckets WHERE id='curso-documentos' AND public=false
    ))
) AS checks(tipo,nome,ok)
ORDER BY tipo,nome;
