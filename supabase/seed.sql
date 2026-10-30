-- ============================================================================
-- MMA — Seed Data (contoh)
-- ============================================================================
-- Jalankan sekali setelah migration di Supabase SQL Editor:
--   psql <connection-string> -f supabase/seed.sql   (opsional)
--
-- Catatan:
--   - Seed ini hanya mengisi warung + foto. Tidak membuat auth.users.
--   - User asli harus mendaftar lewat aplikasi agar profile dibuat otomatis
--     oleh trigger handle_new_user.
--   - Review & favorit sengaja tidak di-seed karena butuh user_id valid.
--   - URL foto memakai placehold.co berformat PNG karena next/image
--     dikonfigurasi dengan dangerouslyAllowSVG = false.
-- ============================================================================

begin;

set local search_path = public;

insert into public.warung (id, nama, alamat, deskripsi, maps_embed)
values
    (
        '11111111-1111-4111-8111-111111111111',
        'Mie Ayam Pak Slamet',
        'Jl. Merdeka No. 12, Kec. Sukamaju',
        'Mie ayam klasik dengan kuah kaldu ayam kampung, topping ayam kecap melimpah, dan pangsit goreng renyah.',
        null
    ),
    (
        '22222222-2222-4222-8222-222222222222',
        'Bakso & Mie Ayam Sedap',
        'Jl. Raya Kenanga No. 45, Kec. Harapan',
        'Kombinasi mie ayam dan bakso sapi asli. Porsi besar, harga ramah kantong, cocok untuk makan siang.',
        null
    ),
    (
        '33333333-3333-4333-8333-333333333333',
        'Mie Ayam Wonogiri Bu Lastri',
        'Jl. Pahlawan No. 8, Kec. Sejahtera',
        'Mie ayam khas Wonogiri dengan ayam kampung cincang, sayur sawi segar, dan sambal rawit buatan sendiri.',
        null
    )
on conflict (id) do update
set nama       = excluded.nama,
    alamat     = excluded.alamat,
    deskripsi  = excluded.deskripsi,
    maps_embed = excluded.maps_embed;

insert into public.warung_foto (id, warung_id, foto_url, urutan)
values
    (
        'a1111111-1111-4111-8111-111111111111',
        '11111111-1111-4111-8111-111111111111',
        'https://placehold.co/800x600/f59e0b/ffffff/png?text=Mie+Ayam+Pak+Slamet',
        0
    ),
    (
        'a1111111-1111-4111-8111-222222222222',
        '11111111-1111-4111-8111-111111111111',
        'https://placehold.co/800x600/fb923c/ffffff/png?text=Semangkuk+Mie+Ayam',
        1
    ),
    (
        'a1111111-1111-4111-8111-333333333333',
        '11111111-1111-4111-8111-111111111111',
        'https://placehold.co/800x600/fcd34d/1f2937/png?text=Pangsit+Goreng',
        2
    ),
    (
        'a2222222-2222-4222-8222-111111111111',
        '22222222-2222-4222-8222-222222222222',
        'https://placehold.co/800x600/dc2626/ffffff/png?text=Bakso+%26+Mie+Ayam+Sedap',
        0
    ),
    (
        'a2222222-2222-4222-8222-222222222222',
        '22222222-2222-4222-8222-222222222222',
        'https://placehold.co/800x600/ef4444/ffffff/png?text=Bakso+Sapi+Asli',
        1
    ),
    (
        'a2222222-2222-4222-8222-333333333333',
        '22222222-2222-4222-8222-222222222222',
        'https://placehold.co/800x600/fca5a5/1f2937/png?text=Porsi+Jumbo',
        2
    ),
    (
        'a3333333-3333-4333-8333-111111111111',
        '33333333-3333-4333-8333-333333333333',
        'https://placehold.co/800x600/16a34a/ffffff/png?text=Mie+Ayam+Bu+Lastri',
        0
    ),
    (
        'a3333333-3333-4333-8333-222222222222',
        '33333333-3333-4333-8333-333333333333',
        'https://placehold.co/800x600/22c55e/ffffff/png?text=Ayam+Kampung+Cincang',
        1
    ),
    (
        'a3333333-3333-4333-8333-333333333333',
        '33333333-3333-4333-8333-333333333333',
        'https://placehold.co/800x600/86efac/1f2937/png?text=Sambal+Rawit',
        2
    )
on conflict (id) do update
set warung_id = excluded.warung_id,
    foto_url  = excluded.foto_url,
    urutan    = excluded.urutan;

commit;
