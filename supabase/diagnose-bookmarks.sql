-- Supabase SQL Editor용 읽기 전용 진단. 데이터나 권한을 변경하지 않습니다.
-- 결과에서 필수 컬럼, DEFAULT, 추가 NOT NULL 제약, 정책과 권한을 확인하세요.
begin read only;

select to_regclass('public.bookmarks') as bookmarks_table;

select column_name, data_type, udt_name, is_nullable, column_default, is_identity, identity_generation
from information_schema.columns
where table_schema = 'public' and table_name = 'bookmarks'
order by ordinal_position;

select con.conname as constraint_name,
       con.contype as constraint_type,
       pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class tbl on tbl.oid = con.conrelid
join pg_namespace ns on ns.oid = tbl.relnamespace
where ns.nspname = 'public' and tbl.relname = 'bookmarks'
order by con.conname;

select tbl.relrowsecurity as rls_enabled,
       tbl.relforcerowsecurity as rls_forced
from pg_class tbl
join pg_namespace ns on ns.oid = tbl.relnamespace
where ns.nspname = 'public' and tbl.relname = 'bookmarks';

select policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'bookmarks'
order by policyname;

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'bookmarks'
  and grantee in ('anon', 'authenticated', 'PUBLIC')
order by grantee, privilege_type;

select role_name,
       has_schema_privilege(role_name::name, 'public', 'USAGE') as schema_usage,
       has_table_privilege(role_name::name, to_regclass('public.bookmarks'), 'SELECT') as can_select,
       has_table_privilege(role_name::name, to_regclass('public.bookmarks'), 'INSERT') as can_insert,
       has_table_privilege(role_name::name, to_regclass('public.bookmarks'), 'UPDATE') as can_update,
       has_table_privilege(role_name::name, to_regclass('public.bookmarks'), 'DELETE') as can_delete
from (values ('anon'), ('authenticated')) roles(role_name);

-- INSERT 시 실행되는 사용자 정의 트리거도 제약 오류의 원인이 될 수 있습니다.
select trg.tgname as trigger_name,
       pg_get_triggerdef(trg.oid) as definition
from pg_trigger trg
join pg_class tbl on tbl.oid = trg.tgrelid
join pg_namespace ns on ns.oid = tbl.relnamespace
where ns.nspname = 'public' and tbl.relname = 'bookmarks'
  and not trg.tgisinternal
order by trg.tgname;

commit;
