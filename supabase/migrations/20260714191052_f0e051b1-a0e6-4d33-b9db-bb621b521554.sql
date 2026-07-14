
create extension if not exists vector;

create table public.kb_documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(384),
  created_at timestamptz not null default now()
);

grant all on public.kb_documents to service_role;

alter table public.kb_documents enable row level security;

create index kb_documents_embedding_idx on public.kb_documents using hnsw (embedding vector_cosine_ops);

create or replace function public.match_kb_documents(
  query_embedding vector(384),
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  source text,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.id,
    d.content,
    d.source,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.kb_documents d
  where d.embedding is not null
  order by d.embedding <=> query_embedding asc
  limit match_count
$$;
