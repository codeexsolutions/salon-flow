-- Supabase Storage: imagens dos salões (logo e capa).
-- Rodar uma vez por projeto Supabase (local já aplicado; repetir em produção).
-- Idempotente: pode ser executado de novo sem efeito colateral.

-- Bucket público para leitura (as imagens aparecem na página pública do salão).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('saloes', 'saloes', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Função fora do esquema exposto pela API REST do Supabase. SECURITY DEFINER: consulta
-- membros_salao (protegida por RLS) para dizer se o usuário logado é DONO do salão.
create schema if not exists privado;

create or replace function privado.eh_dono_do_salao(p_salao_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.membros_salao m
    join public.saloes s on s.id = m.salao_id
    where m.salao_id::text = p_salao_id
      and m.usuario_id = auth.uid()
      and m.papel = 'DONO'
      and m.ativo
      and s.ativo
  );
$$;

revoke all on function privado.eh_dono_do_salao(text) from public;
grant usage on schema privado to authenticated;
grant execute on function privado.eh_dono_do_salao(text) to authenticated;

-- Caminho dos arquivos: "<salao_id>/<arquivo>". Só o DONO daquele salão grava.
drop policy if exists "saloes: dono envia" on storage.objects;
create policy "saloes: dono envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'saloes' and privado.eh_dono_do_salao((storage.foldername(name))[1]));

drop policy if exists "saloes: dono substitui" on storage.objects;
create policy "saloes: dono substitui" on storage.objects
  for update to authenticated
  using (bucket_id = 'saloes' and privado.eh_dono_do_salao((storage.foldername(name))[1]));

drop policy if exists "saloes: dono remove" on storage.objects;
create policy "saloes: dono remove" on storage.objects
  for delete to authenticated
  using (bucket_id = 'saloes' and privado.eh_dono_do_salao((storage.foldername(name))[1]));
