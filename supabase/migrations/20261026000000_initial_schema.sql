-- ============================================================================
-- MMA — Initial Schema
-- ============================================================================
-- Fondasi database untuk project My MieAyam (MMA).
--
-- Objek yang dibuat:
--   - public.profiles
--   - public.warung
--   - public.warung_foto
--   - public.reviews
--   - public.favorit
--   - public.warung_with_rating (view)
--   - trigger handle_new_user (buat profile otomatis saat signup)
--   - trigger protect_is_admin (cegah privilege escalation)
--   - index (termasuk trigram untuk pencarian nama warung)
--
-- Catatan: RLS & policy ada di migration berikutnya (0001_rls.sql).
-- ============================================================================

begin;

-- Ekstensi untuk pencarian teks (ILIKE %...%) agar memakai index.
create extension if not exists pg_trgm with schema extensions;

-- Pastikan operator class pg_trgm bisa ditemukan tanpa schema prefix.
set local search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- PROFILES
-- Satu baris per user auth. Dibuat otomatis oleh trigger handle_new_user.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
    id          uuid primary key references auth.users (id) on delete cascade,
    username    text,
    avatar_url  text,
    bio         text,
    is_admin    boolean not null default false,
    created_at  timestamptz not null default now(),
    constraint profiles_username_length check (
        username is null or char_length(username) <= 50
    ),
    constraint profiles_bio_length check (
        bio is null or char_length(bio) <= 500
    )
);

create index if not exists profiles_username_idx
    on public.profiles (username);

-- ---------------------------------------------------------------------------
-- WARUNG
-- ---------------------------------------------------------------------------
create table if not exists public.warung (
    id          uuid primary key default gen_random_uuid(),
    nama        text not null check (char_length(trim(nama)) > 0),
    alamat      text not null check (char_length(trim(alamat)) > 0),
    deskripsi   text,
    maps_embed  text,
    created_at  timestamptz not null default now()
);

create index if not exists warung_nama_trgm_idx
    on public.warung using gin (nama gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- WARUNG_FOTO
-- ---------------------------------------------------------------------------
create table if not exists public.warung_foto (
    id          uuid primary key default gen_random_uuid(),
    warung_id   uuid not null references public.warung (id) on delete cascade,
    foto_url    text not null,
    urutan      integer not null default 0,
    created_at  timestamptz not null default now()
);

create index if not exists warung_foto_warung_urutan_idx
    on public.warung_foto (warung_id, urutan, created_at);

-- ---------------------------------------------------------------------------
-- REVIEWS
-- Satu user hanya boleh punya satu review per warung (unique constraint).
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
    id          uuid primary key default gen_random_uuid(),
    warung_id   uuid not null references public.warung (id) on delete cascade,
    user_id     uuid not null references public.profiles (id) on delete cascade,
    rating      smallint not null check (rating between 1 and 5),
    komentar    text,
    created_at  timestamptz not null default now(),
    constraint reviews_warung_user_unique unique (warung_id, user_id)
);

create index if not exists reviews_warung_idx
    on public.reviews (warung_id, created_at desc);

create index if not exists reviews_user_idx
    on public.reviews (user_id);

-- ---------------------------------------------------------------------------
-- FAVORIT
-- Satu user hanya boleh memfavoritkan warung yang sama sekali.
-- ---------------------------------------------------------------------------
create table if not exists public.favorit (
    id          uuid primary key default gen_random_uuid(),
    warung_id   uuid not null references public.warung (id) on delete cascade,
    user_id     uuid not null references public.profiles (id) on delete cascade,
    created_at  timestamptz not null default now(),
    constraint favorit_warung_user_unique unique (warung_id, user_id)
);

create index if not exists favorit_user_idx
    on public.favorit (user_id);

create index if not exists favorit_warung_idx
    on public.favorit (warung_id);

-- ---------------------------------------------------------------------------
-- VIEW: warung_with_rating
-- Dipakai langsung oleh app (select *, order avg_rating, ilike nama, eq id).
-- security_invoker = true agar RLS tabel dasar tetap berlaku.
-- ---------------------------------------------------------------------------
create or replace view public.warung_with_rating
with (security_invoker = true)
as
select
    w.id,
    w.nama,
    w.alamat,
    w.deskripsi,
    w.maps_embed,
    w.created_at,
    coalesce(r.avg_rating, 0)::numeric(3, 1) as avg_rating,
    coalesce(r.total_reviews, 0)::bigint      as total_reviews,
    f.foto_url                                as foto_thumbnail
from public.warung w
left join (
    select
        warung_id,
        avg(rating)::numeric(3, 1) as avg_rating,
        count(*)::bigint           as total_reviews
    from public.reviews
    group by warung_id
) r on r.warung_id = w.id
left join lateral (
    select wf.foto_url
    from public.warung_foto wf
    where wf.warung_id = w.id
    order by wf.urutan asc, wf.created_at asc
    limit 1
) f on true;

-- ---------------------------------------------------------------------------
-- TRIGGER: handle_new_user
-- Sekali user mendaftar, otomatis dibuatkan row profiles.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, username)
    values (
        new.id,
        left(
            coalesce(
                nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
                nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
                'user-' || left(new.id::text, 8)
            ),
            50
        )
    )
    on conflict (id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- TRIGGER: protect_is_admin
-- User biasa tidak boleh mengubah is_admin miliknya sendiri.
-- Service role / SQL Editor (auth.uid() null) tetap boleh, mis. untuk
-- mengangkat admin pertama lewat Dashboard.
-- ---------------------------------------------------------------------------
create or replace function public.protect_is_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if tg_op = 'INSERT' then
        if new.is_admin and auth.uid() is not null then
            raise exception 'is_admin hanya boleh diatur oleh service role';
        end if;
        return new;
    end if;

    if new.is_admin is distinct from old.is_admin and auth.uid() is not null then
        raise exception 'is_admin hanya boleh diatur oleh service role';
    end if;

    return new;
end;
$$;

drop trigger if exists protect_is_admin on public.profiles;
create trigger protect_is_admin
    before insert or update on public.profiles
    for each row execute function public.protect_is_admin();

commit;
