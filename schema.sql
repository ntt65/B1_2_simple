-- 신규 프로젝트 생성 및 기존 bookmarks 테이블 복구용 단일 스크립트.
-- 확인된 등록 오류: 42703, column bookmarks.memo does not exist.
-- 실행 전 supabase/diagnose-bookmarks.sql로 기존 구조·제약·정책을 확인하고 보관하세요.
-- 아래 전체를 Supabase SQL Editor에서 실행합니다. 코드 저장만으로 원격 DB는 바뀌지 않습니다.
begin;

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  memo text,
  category text not null default 'etc',
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- CREATE TABLE IF NOT EXISTS는 기존 테이블의 누락 컬럼을 추가하지 않습니다.
-- 이미 있는 컬럼의 타입·NOT NULL·기존 값은 유지합니다.
-- 새로 추가되는 category/created_at은 기존 행에도 각각 'etc'/실행 시각이 채워질 수 있습니다.
alter table public.bookmarks
  add column if not exists memo text,
  add column if not exists category text not null default 'etc',
  add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz not null default now();

-- IF NOT EXISTS로 건너뛴 기존 컬럼에도 이후 INSERT용 기본값을 지정합니다.
-- 기존 user_id와 NULL 값은 소급 변경하지 않습니다. user_id는 작성자 기록이며 소유권 정책이 아닙니다.
alter table public.bookmarks
  alter column category set default 'etc',
  alter column user_id set default auth.uid(),
  alter column created_at set default now();

-- UUID id에 기본값만 누락된 경우를 보완합니다. 기존 ID 값·타입·PK·identity는 변경하지 않습니다.
-- 숫자형 ID의 자동 증가 설정이 없다면 진단 결과에 따라 별도 복구해야 합니다.
do $$
begin
  if exists (
    select 1 from pg_attribute col
    where col.attrelid = 'public.bookmarks'::regclass
      and col.attname = 'id' and not col.attisdropped
      and col.atttypid = 'uuid'::regtype
      and col.attidentity = '' and col.attgenerated = ''
      and not exists (
        select 1 from pg_attrdef def
        where def.adrelid = col.attrelid and def.adnum = col.attnum
      )
  ) then
    alter table public.bookmarks alter column id set default gen_random_uuid();
  end if;
end;
$$;

-- 공개 조회 + 로그인 사용자 쓰기. 로그인 사용자는 모든 북마크를 수정·삭제할 수 있습니다.
-- Supabase SQL Editor에서 실행하세요. 사용자별 비공개 소유권 정책은 포함하지 않습니다.
-- 실행 전 기존 정책을 보관하세요:
-- select * from pg_policies where schemaname = 'public' and tablename = 'bookmarks';

alter table public.bookmarks enable row level security;
grant usage on schema public to anon, authenticated;
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
end;
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

-- 새 컬럼과 기본값을 REST API에서도 다시 읽도록 요청합니다(트랜잭션 완료 후 전달).
notify pgrst, 'reload schema';

commit;

-- 실행 뒤 필수 컬럼·기본값과 정책 4행을 확인하세요.
select column_name, data_type, is_nullable, column_default, is_identity
from information_schema.columns
where table_schema = 'public' and table_name = 'bookmarks'
order by ordinal_position;

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'bookmarks'
order by policyname;
