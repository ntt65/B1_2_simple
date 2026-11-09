-- 새 프로젝트용 bookmarks 테이블과 인증 권한 설정.
-- 기존 테이블만 갱신할 때는 supabase/policies-authenticated-writes.sql을 사용할 수 있습니다.
begin;

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  memo text,
  category text not null default 'etc',
  created_at timestamptz not null default now()
);

-- 공개 조회 + 로그인 사용자 쓰기. 로그인 사용자는 모든 북마크를 수정·삭제할 수 있습니다.
-- Supabase SQL Editor에서 실행하세요. 사용자별 비공개 소유권 정책은 포함하지 않습니다.
-- 실행 전 기존 정책을 보관하세요:
-- select * from pg_policies where schemaname = 'public' and tablename = 'bookmarks';

alter table public.bookmarks enable row level security;
revoke insert, update, delete on table public.bookmarks from anon;
grant select on table public.bookmarks to anon, authenticated;
grant insert, update, delete on table public.bookmarks to authenticated;

-- 허용 정책끼리는 OR로 합쳐지므로 기존 anon 전체 허용 정책도 제거합니다.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'bookmarks'
  loop
    execute format('drop policy if exists %I on public.bookmarks', policy_row.policyname);
  end loop;
end
$$;

create policy "bookmarks_public_read"
on public.bookmarks for select
to anon, authenticated using (true);

create policy "bookmarks_authenticated_insert"
on public.bookmarks for insert
to authenticated with check (auth.uid() is not null);

create policy "bookmarks_authenticated_update"
on public.bookmarks for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "bookmarks_authenticated_delete"
on public.bookmarks for delete
to authenticated using (auth.uid() is not null);

commit;

-- 실행 뒤 정책이 정확히 4행인지 확인하세요.
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'bookmarks'
order by policyname;
