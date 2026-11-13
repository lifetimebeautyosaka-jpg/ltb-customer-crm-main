-- ジムアップCRM：目標体重の欄と、変更の記録（audit_logs）を追加する
-- Supabase の SQL エディタで実行する。既存のデータは変更しない。

-- 1. 顧客の目標体重（kg）
alter table public.customers
  add column if not exists target_weight numeric(5,1);

-- 2. 変更の記録
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  action text not null,          -- delete / update / insert / import
  table_name text not null,      -- sales / staff_attendance など
  record_id text,
  actor text,                    -- 操作したスタッフ名（ロール）
  detail jsonb
);

alter table public.audit_logs enable row level security;

-- ログインしたユーザーだけが記録を追加・閲覧できる。更新・削除のポリシーは作らない（記録を消せないようにする）
create policy "audit_logs insert by authenticated"
  on public.audit_logs for insert to authenticated with check (true);
create policy "audit_logs select by authenticated"
  on public.audit_logs for select to authenticated using (true);
