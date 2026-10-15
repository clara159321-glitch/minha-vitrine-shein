-- Executar uma vez no projeto Supabase conectado. Nenhuma chave secreta neste arquivo.
begin;
create schema if not exists vitrine_private;
revoke all on schema vitrine_private from public, anon, authenticated;
create table if not exists vitrine_private.admins(user_id uuid primary key references auth.users(id));
create table if not exists vitrine_private.settings(singleton boolean primary key default true check(singleton), initialized boolean not null default false);
insert into vitrine_private.settings(singleton) values(true) on conflict do nothing;
create table if not exists vitrine_private.products(
 id text primary key,
 data jsonb not null,
 version integer not null default 1,
 archived_at timestamptz,
 updated_at timestamptz not null default now(),
 constraint valid_product check((
  jsonb_typeof(data)='object' and data->>'id'=id and length(id) between 1 and 120
  and jsonb_typeof(data->'name')='string' and length(trim(data->>'name')) between 1 and 200
  and data->>'category' in ('Moda','Acessórios','Casa','Beleza')
  and data ? 'price' and (data->'price'='null'::jsonb or (jsonb_typeof(data->'price')='number' and (data->>'price')::numeric between 0 and 999999))
  and data ? 'imageUrl' and length(data->>'imageUrl')<=3000000
  and (data->>'imageUrl'='' or data->>'imageUrl' ~ '^(https://|assets/[a-zA-Z0-9._/-]+$|data:image/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$)')
  and data ? 'affiliateUrl' and (data->>'affiliateUrl'='' or data->>'affiliateUrl' ~ '^https://([a-zA-Z0-9-]+\.)*shein\.com(:443)?(/|\?|#|$)')
 ) is true)
);
create table if not exists vitrine_private.history(
 sequence bigint generated always as identity primary key,
 product_id text not null,
 snapshot jsonb not null,
 action text not null,
 changed_at timestamptz not null default now(),
 changed_by uuid
);
alter table vitrine_private.admins enable row level security;
alter table vitrine_private.settings enable row level security;
alter table vitrine_private.products enable row level security;
alter table vitrine_private.history enable row level security;
revoke all on all tables in schema vitrine_private from public,anon,authenticated;

create or replace function public.is_vitrine_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from vitrine_private.admins where user_id=auth.uid());
$$;
create or replace function public.get_vitrine_catalog() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('initialized',s.initialized,'products',
 coalesce((select jsonb_agg(p.data||jsonb_build_object('_version',p.version) order by p.updated_at,p.id) from vitrine_private.products p where p.archived_at is null),'[]'::jsonb))
 from vitrine_private.settings s where singleton;
$$;
create or replace function vitrine_private.keep_history() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' then
 insert into vitrine_private.history(product_id,snapshot,action,changed_by) values(new.id,to_jsonb(new),'created',auth.uid());
 else
 insert into vitrine_private.history(product_id,snapshot,action,changed_by) values(old.id,to_jsonb(old),case when new.archived_at is not null then 'before_archive' else 'before_edit' end,auth.uid());
 end if;
 return new;
end;$$;
drop trigger if exists preserve_product_history on vitrine_private.products;
create trigger preserve_product_history before insert or update on vitrine_private.products for each row execute function vitrine_private.keep_history();

create or replace function public.initialize_vitrine(initial_products jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare ready boolean; p jsonb;
begin
 if not public.is_vitrine_admin() then raise exception 'Unauthorized' using errcode='42501'; end if;
 select initialized into ready from vitrine_private.settings where singleton for update;
 if ready then return public.get_vitrine_catalog(); end if;
 if jsonb_typeof(initial_products) is distinct from 'array' or jsonb_array_length(initial_products)>500 then raise exception 'Invalid catalog'; end if;
 if exists(select 1 from vitrine_private.products) then raise exception 'Catalog requires review'; end if;
 for p in select value from jsonb_array_elements(initial_products) loop
 insert into vitrine_private.products(id,data) values(p->>'id',p-'_version');
 end loop;
 update vitrine_private.settings set initialized=true where singleton;
 return public.get_vitrine_catalog();
end;$$;

create or replace function public.save_vitrine_product(product jsonb,expected_version integer default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare v vitrine_private.products;
begin
 if not public.is_vitrine_admin() then raise exception 'Unauthorized' using errcode='42501'; end if;
 if not (select initialized from vitrine_private.settings where singleton) then raise exception 'Initialize catalog first'; end if;
 if expected_version is null then
 insert into vitrine_private.products(id,data) values(product->>'id',product-'_version') returning * into v;
 else
 update vitrine_private.products set data=product-'_version',version=version+1,updated_at=clock_timestamp()
 where id=product->>'id' and version=expected_version and archived_at is null returning * into v;
 if not found then raise exception 'Concurrent change' using errcode='40001'; end if;
 end if;
 return v.data||jsonb_build_object('_version',v.version);
end;$$;
create or replace function public.archive_vitrine_product(product_id text,expected_version integer) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.is_vitrine_admin() then raise exception 'Unauthorized' using errcode='42501'; end if;
 update vitrine_private.products set archived_at=clock_timestamp(),version=version+1,updated_at=clock_timestamp()
 where id=product_id and version=expected_version and archived_at is null;
 if not found then raise exception 'Concurrent change' using errcode='40001'; end if;
 return jsonb_build_object('archived',true);
end;$$;
revoke all on function public.is_vitrine_admin() from public,anon;
revoke all on function public.get_vitrine_catalog() from public;
revoke all on function public.initialize_vitrine(jsonb) from public,anon;
revoke all on function public.save_vitrine_product(jsonb,integer) from public,anon;
revoke all on function public.archive_vitrine_product(text,integer) from public,anon;
grant execute on function public.is_vitrine_admin() to authenticated;
grant execute on function public.get_vitrine_catalog() to anon,authenticated;
grant execute on function public.initialize_vitrine(jsonb) to authenticated;
grant execute on function public.save_vitrine_product(jsonb,integer) to authenticated;
grant execute on function public.archive_vitrine_product(text,integer) to authenticated;
-- Fotos novas são enviadas diretamente ao Storage, sem incorporar o arquivo ao catálogo.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('vitrine-photos','vitrine-photos',true,3000000,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
drop policy if exists vitrine_owner_upload on storage.objects;
create policy vitrine_owner_upload on storage.objects for insert to authenticated
with check(bucket_id='vitrine-photos' and public.is_vitrine_admin());
-- Sem política de update/delete: fotos existentes não são sobrescritas nem apagadas pelo painel.
commit;
-- Provisionamento da proprietária: depois de criar/convidar a usuária confirmada,
-- inserir seu auth.users.id em vitrine_private.admins pelo servidor/SQL administrativo.
-- Não existe cadastro público que conceda administração automaticamente.

