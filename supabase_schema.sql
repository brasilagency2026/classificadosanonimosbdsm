create table anuncios (
  id          uuid primary key default gen_random_uuid(),
  apelido     text not null,
  estado      text not null,
  cidade      text,
  sexo        text not null,
  posicao     text[] not null default '{}',
  busca       text[] not null default '{}',
  praticas    text[] not null default '{}',
  descricao   text not null,
  element_id  text not null,
  fotos       text[] not null default '{}',
  destaque    boolean not null default false,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

create index idx_anuncios_estado  on anuncios(estado);
create index idx_anuncios_cidade  on anuncios(cidade);
create index idx_anuncios_sexo    on anuncios(sexo);
create index idx_anuncios_ativo   on anuncios(ativo);
create index idx_anuncios_created on anuncios(created_at desc);

alter table anuncios enable row level security;

create policy "leitura publica"
  on anuncios for select
  using (ativo = true);

create policy "insercao publica"
  on anuncios for insert
  with check (true);
