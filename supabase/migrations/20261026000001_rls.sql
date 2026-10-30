-- ============================================================================
-- MMA — Row Level Security
-- ============================================================================
-- Prinsip:
--   - Data publik (profiles, warung, foto, reviews) boleh dibaca siapa saja.
--   - User hanya boleh mengubah data miliknya sendiri.
--   - Mutasi warung/foto hanya boleh dilakukan admin.
--   - is_admin() adalah SECURITY DEFINER agar pengecekan admin tidak
--     rekursif terhadap RLS tabel profiles.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Helper: cek admin
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        (select p.is_admin from public.profiles p where p.id = auth.uid()),
        false
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Aktifkan RLS
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.warung      enable row level security;
alter table public.warung_foto enable row level security;
alter table public.reviews     enable row level security;
alter table public.favorit     enable row level security;

-- ---------------------------------------------------------------------------
-- Grants (RLS tetap yang menentukan baris mana yang boleh diakses)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.profiles, public.warung, public.warung_foto,
    public.reviews, public.warung_with_rating
    to anon, authenticated;

grant insert, update, delete on public.profiles, public.reviews, public.favorit
    to authenticated;

grant insert, update, delete on public.warung, public.warung_foto
    to authenticated;

grant select on public.favorit to authenticated;

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
    for select
    using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
    for insert to authenticated
    with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
    for update to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- WARUNG
-- ---------------------------------------------------------------------------
drop policy if exists "warung_select_all" on public.warung;
create policy "warung_select_all" on public.warung
    for select
    using (true);

drop policy if exists "warung_admin_insert" on public.warung;
create policy "warung_admin_insert" on public.warung
    for insert to authenticated
    with check (public.is_admin());

drop policy if exists "warung_admin_update" on public.warung;
create policy "warung_admin_update" on public.warung
    for update to authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "warung_admin_delete" on public.warung;
create policy "warung_admin_delete" on public.warung
    for delete to authenticated
    using (public.is_admin());

-- ---------------------------------------------------------------------------
-- WARUNG_FOTO
-- ---------------------------------------------------------------------------
drop policy if exists "warung_foto_select_all" on public.warung_foto;
create policy "warung_foto_select_all" on public.warung_foto
    for select
    using (true);

drop policy if exists "warung_foto_admin_insert" on public.warung_foto;
create policy "warung_foto_admin_insert" on public.warung_foto
    for insert to authenticated
    with check (public.is_admin());

drop policy if exists "warung_foto_admin_update" on public.warung_foto;
create policy "warung_foto_admin_update" on public.warung_foto
    for update to authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "warung_foto_admin_delete" on public.warung_foto;
create policy "warung_foto_admin_delete" on public.warung_foto
    for delete to authenticated
    using (public.is_admin());

-- ---------------------------------------------------------------------------
-- REVIEWS
-- ---------------------------------------------------------------------------
drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all" on public.reviews
    for select
    using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
    for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
    for update to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews
    for delete to authenticated
    using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- FAVORIT
-- ---------------------------------------------------------------------------
drop policy if exists "favorit_select_own" on public.favorit;
create policy "favorit_select_own" on public.favorit
    for select to authenticated
    using (auth.uid() = user_id);

drop policy if exists "favorit_insert_own" on public.favorit;
create policy "favorit_insert_own" on public.favorit
    for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "favorit_delete_own" on public.favorit;
create policy "favorit_delete_own" on public.favorit
    for delete to authenticated
    using (auth.uid() = user_id);

commit;
