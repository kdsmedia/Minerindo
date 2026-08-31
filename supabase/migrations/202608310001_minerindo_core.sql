-- =============================================================
-- MINERINDO — Migrasi inti: profil, admin, reward, withdraw
-- Idempoten (create or replace), aman dijalankan ulang)
-- Siapkan RPC inti agar app + fitur admin berfungsi penuh di Supabase.
-- ---------------------------------------------------------------
-- Tabel inti MINERINDO (idempoten; aman dijalankan ulang)
-- ---------------------------------------------------------------
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text,
  phone text unique,
  referral_code text unique,
  invited_count int not null default 0,
  invited_by text,
  balance numeric not null default 0,
  ads_count int not null default 0,
  last_checkin date,
  last_withdrawal timestamptz,
  is_admin boolean not null default false,
  is_blocked boolean not null default false,
  last_rent_task_reward date,
  last_invite_task_reward date,
  created_at timestamptz not null default now()
);

create table if not exists public.withdrawals (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  wallet_type text,
  account_name text,
  account_number text,
  amount numeric not null default 0,
  status text not null default 'menunggu',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.mining_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  coin_type text,
  coin_name text,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  hashrate numeric not null default  0,
  earned_rp numeric not null default  0,
  machine_name text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.machine_rentals (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  machine_id text,
  machine_name text,
  machine_quality text,
  price numeric not null default 0,
  duration_minutes int not null default 0,
  multiplier numeric not null default 1,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.checkin_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  checkin_date date not null,
  created_at timestamptz not null default now()
);
-- =============================================================

-- ---------------------------------------------------------------
-- User profiles: kolom tambahan (admin, blokir, reward dates)
-- ---------------------------------------------------------------
alter table public.user_profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists is_blocked boolean not null default false,
  add column if not exists last_rent_task_reward date,
  add column if not exists last_invite_task_reward date;

-- ---------------------------------------------------------------
-- Withdrawals: indeks untuk riwayat
-- ---------------------------------------------------------------
create index if not exists idx_withdrawals_user on public.withdrawals(user_id);
create index if not exists idx_withdrawals_status on public.withdrawals(status);

-- ---------------------------------------------------------------
-- Reward logs: log bonus tugas harian
-- ---------------------------------------------------------------
create table if not exists public.reward_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  reward_type text not null,
  amount numeric not null default 0,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists idx_reward_logs_user on public.reward_logs(user_id);
-- ---------------------------------------------------------------
-- RLS dasar MINERINDO (user hanya akses data sendiri; admin via security definer)
-- ---------------------------------------------------------------
alter table public.user_profiles enable row level security;
alter table public.withdrawals enable row level security;
alter table public.mining_sessions enable row level security;
alter table public.machine_rentals enable row level security;
alter table public.checkin_history enable row level security;
alter table public.reward_logs enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own" on public.user_profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "user_profiles_insert_anon" on public.user_profiles;
create policy "user_profiles_insert_anon" on public.user_profiles for insert to anon with check (true);
drop policy if exists "user_profiles_insert_auth" on public.user_profiles;
create policy "user_profiles_insert_auth" on public.user_profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own" on public.user_profiles for update to authenticated using (auth.uid() = id)with check (auth.uid() = id);

drop policy if exists "withdrawals_select_own" on public.withdrawals;
create policy "withdrawals_select_own" on public.withdrawals for select to authenticated using (auth.uid() = user_id);
drop policy if exists "withdrawals_insert_own" on public.withdrawals;
create policy "withdrawals_insert_own" on public.withdrawals for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "mining_sessions_select_own" on public.mining_sessions;
create policy "mining_sessions_select_own" on public.mining_sessions for select to authenticated using (auth.uid() = user_id);
drop policy if exists "mining_sessions_insert_own" on public.mining_sessions;
create policy "mining_sessions_insert_own" on public.mining_sessions for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "mining_sessions_update_own" on public.mining_sessions;
create policy "mining_sessions_update_own" on public.mining_sessions for update to authenticated using (auth.uid() = user_id)with check (auth.uid() = user_id);

drop policy if exists "machine_rentals_select_own" on public.machine_rentals;
create policy "machine_rentals_select_own" on public.machine_rentals for select to authenticated using (auth.uid() = user_id);
drop policy if exists "machine_rentals_insert_own" on public.machine_rentals;
create policy "machine_rentals_insert_own" on public.machine_rentals for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "machine_rentals_update_own" on public.machine_rentals;
create policy "machine_rentals_update_own" on public.machine_rentals for update to authenticated using (auth.uid() = user_id)with check (auth.uid() = user_id);

drop policy if exists "checkin_history_select_own" on public.checkin_history;
create policy "checkin_history_select_own" on public.checkin_history for select to authenticated using (auth.uid() = user_id);
drop policy if exists "checkin_history_insert_own" on public.checkin_history;
create policy "checkin_history_insert_own" on public.checkin_history for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "reward_logs_select_own" on public.reward_logs;
create policy "reward_logs_select_own" on public.reward_logs for select to authenticated using (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- RPC: tambah saldo (aman: hanya pemilik/profil sendiri)
-- ---------------------------------------------------------------
create or replace function public.add_mining_balance(
  user_id_param uuid,
  amount numeric
) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.user_profiles
    set balance = coalesce(balance,0) + amount
    where id = user_id_param;
  return found;
end;
$$;

create or replace function public.add_mining_balance_safe(
  user_id_param uuid,
  amount numeric
) returns boolean
language plpgsql security invoker set search_path = public as $$
begin
  if amount <= 0 then
    return false;
  end if;
  update public.user_profiles
    set balance = coalesce(balance,0) + amount
    where id = user_id_param;
  return found;
end;
$$;

-- ---------------------------------------------------------------
-- RPC: potong saldo (untuk sewa & penarikan)
-- ---------------------------------------------------------------
create or replace function public.deduct_balance(
  user_id_param uuid,
  amount numeric
) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if amount <= 0 then
    return false;
  end if;
  update public.user_profiles
    set balance = balance - amount
    where id = user_id_param and balance >= amount;
  return found;
end;
$$;

-- ---------------------------------------------------------------
-- RPC: check-in harian (otomatis tambah Rp50, valid 1x/hari)
-- ---------------------------------------------------------------
create or replace function public.do_checkin(
  user_id_param uuid
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_today date := current_date;
  v_last date;
  v_streak int := 0;
begin
  select last_checkin into v_last from public.user_profiles where id = user_id_param;
  if v_last is not null and v_last >= v_today then
    return false;  -- sudah check-in hari ini
  end if;

  update public.user_profiles
    set balance = coalesce(balance,0) + 50,
        last_checkin = v_today,
        ads_count = coalesce(ads_count,0) + 1
    where id = user_id_param;

  insert into public.checkin_history(user_id, checkin_date)
  values (user_id_param, v_today);
  return true;
end;
$$;

-- ---------------------------------------------------------------
-- RPC: query check-in suatu user (untuk validasi saja)
-- ---------------------------------------------------------------
create or replace function public.get_checkin_history(
  user_id_param uuid
) returns setof public.checkin_history
language sql stable security definer set search_path = public as $$
  select * from public.checkin_history where user_id = user_id_param order by checkin_date desc;

$$;

-- ---------------------------------------------------------------
-- RPC: update status penarikan -> "sukses" setelah +- 24 jam
-- ---------------------------------------------------------------
create or replace function public.update_withdrawal_status(
  user_id_param uuid
) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.withdrawals
    set status = 'sukses',
        processed_at = coalesce(processed_at, now())
    where user_id = user_id_param
      and status = 'menunggu'
      and created_at < now() - integer '24 hours';
end;
$$;

-- ---------------------------------------------------------------
-- RPC: reward referral (bonus Rp500 kepada pendaftar baru & pengundang)
-- ---------------------------------------------------------------
create or replace function public.process_referral_reward(
  referrer_code text,
  new_user_id uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ref uuid;
begin
  select id into v_ref from public.user_profiles
    where referral_code = referrer_code limit 1;
  if v_ref is null then
    return;
  end if;

  update public.user_profiles set invited_count = coalesce(invited_count,0) + 1 where id = v_ref;
  update public.user_profiles set balance = coalesce(balance,0) + 500 where id = v_ref;
  update public.user_profiles set balance = coalesce(balance,0) + 500 where id = new_user_id;

  insert into public.reward_logs(user_id, reward_type, amount, description)
  values (v_ref, 'referral', 500, 'Bonus referral'),
          (new_user_id, 'referral', 500, 'Bonus referral dari kode');
end;
$$;

-- ---------------------------------------------------------------
-- RPC: reward tugas sewa mesin (+Rp500, 1x/hari)
-- ---------------------------------------------------------------
create or replace function public.rent_task_reward(
  user_id_param uuid
) returns numeric
language plpgsql security definer set search_path = public as $$
declare
  v_today date := current_date;
  v_has_rental boolean;
begin
  select exists(
    select 1 from public.machine_rentals
    where user_id = user_id_param and is_active = true
  ) into v_has_rental;

  if not v_has_rental then
    return 0;
  end if;

  if exists(
    select 1 from public.user_profiles
    where id = user_id_param and last_rent_task_reward = v_today
  ) then
    return 0;
  end if;

  update public.user_profiles
    set balance = coalesce(balance,0) + 500,
        last_rent_task_reward = v_today
    where id = user_id_param;

  insert into public.reward_logs(user_id, reward_type, amount, description)
  values (user_id_param, 'rent_task', 500, 'Reward sewa mesin');
  return 500;
end;
$$;

-- ---------------------------------------------------------------
-- RPC: klaim reward undang 10 teman (+Rp2000, 1x/hari)
-- ---------------------------------------------------------------
create or replace function public.claim_invite_reward(
  user_id_param uuid
) returns numeric
language plpgsql security definer set search_path = public as $$
declare
  v_today date := current_date;
  v_invited int;
  v_claimed numeric;
begin
  select invited_count into v_invited from public.user_profiles where id = user_id_param;
  if coalesce(v_invited,0) < 10 then
    return 0;
  end if;

  if exists(
    select 1 from public.user_profiles
    where id = user_id_param and last_invite_task_reward = v_today
  ) then
    return 0;
  end if;

  update public.user_profiles
    set balance = coalesce(balance,0) + 2000,
        last_invite_task_reward = v_today
    where id = user_id_param;

  insert into public.reward_logs(user_id, reward_type, amount, description)
  values (user_id_param, 'invite_task', 2000, 'Reward undang teman');
  return 2000;
end;
$$;

-- ---------------------------------------------------------------
-- RPC: data admin (daftar user lengkap)
-- ---------------------------------------------------------------
create or replace function public.admin_list_users()
returns table(
  id uuid, full_name text, phone text, referral_code text,
  balance numeric, ads_count int, is_blocked boolean, is_admin boolean,
  invited_count int, created_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from public.user_profiles p where p.id = auth.uid() and p.is_admin) then
    raise exception 'Forbidden';
  end if;
  return query
    select p.id, p.full_name, p.phone, p.referral_code,
           p.balance, p.ads_count, p.is_blocked, p.is_admin,
           p.invited_count, p.created_at
    from public.user_profiles p
    order by p.created_at desc;
end;
$$;

-- ---------------------------------------------------------------
-- RPC: set saldo (tambah/kurang) oleh admin
-- ---------------------------------------------------------------
create or replace function public.admin_set_balance(
  target_user_id uuid,
  delta numeric
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from public.user_profiles p where p.id = auth.uid() and p.is_admin) then
    raise exception 'Forbidden';
  end if;
  if delta >= 0 then
    update public.user_profiles set balance = coalesce(balance,0) + delta where id = target_user_id;
  else
    update public.user_profiles
      set balance = greatest(coalesce(balance,0) + delta, 0)
      where id = target_user_id;
  end if;

  insert into public.reward_logs(user_id, reward_type, amount, description)
  values (target_user_id, 'admin_adjust', delta, 'Penyesuaian admin');
end;
$$;

-- ---------------------------------------------------------------
-- RPC: hapus akun oleh admin
-- ---------------------------------------------------------------
create or replace function public.admin_delete_user(
  target_user_id uuid
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from public.user_profiles p where p.id = auth.uid() and p.is_admin) then
    raise exception 'Forbidden';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'Cannot delete yourself';
  end if;

  delete from public.withdrawals where user_id = target_user_id;

  delete from public.mining_sessions where user_id = target_user_id;
 delete from public.machine_rentals where user_id = target_user_id;
 delete from public.checkin_history where user_id = target_user_id;
 delete from public.reward_logs where user_id = target_user_id;
 delete from public.user_profiles where id = target_user_id;

  delete from auth.users where id = target_user_id;
end;
$$;

-- ---------------------------------------------------------------
-- RPC: blokir / buka blokir user oleh admin
-- ---------------------------------------------------------------
create or replace function public.admin_toggle_block(
  target_user_id uuid
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_new_val boolean;
begin
  if not exists(select 1 from public.user_profiles p where p.id = auth.uid() and p.is_admin) then
    raise exception 'Forbidden';
  end if;

  update public.user_profiles
    set is_blocked = not coalesce(is_blocked,false)
    where id = target_user_id
    returning is_blocked into v_new_val;

  return v_new_val;
end;
$$;

-- Grant akses fungsi ke role aplikasi
grant execute on function public.add_mining_balance(uuid, numeric) to anon, authenticated;
grant execute on function public.add_mining_balance_safe(uuid, numeric) to anon, authenticated;
grant execute on function public.deduct_balance(uuid, numeric) to anon, authenticated;
grant execute on function public.do_checkin(uuid) to anon, authenticated;
grant execute on function public.get_checkin_history(uuid) to anon, authenticated;
grant execute on function public.update_withdrawal_status(uuid) to anon, authenticated;
grant execute on function public.process_referral_reward(text, uuid) to anon, authenticated;
grant execute on function public.rent_task_reward(uuid) to anon, authenticated;
grant execute on function public.claim_invite_reward(uuid) to anon, authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_balance(uuid, numeric) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
grant execute on function public.admin_toggle_block(uuid) to authenticated;
grant execute on function public.admin_toggle_block(uuid) to authenticated;
