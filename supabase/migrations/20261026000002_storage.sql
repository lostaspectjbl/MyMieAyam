-- ============================================================================
-- MMA — Storage
-- ============================================================================
-- Bucket:
--   - warung-photos : public read, admin write. File selalu WebP (hasil
--                     kompresi client) sehingga SVG tidak diizinkan.
--   - avatars       : public read, user hanya folder miliknya sendiri.
--
-- Path yang dipakai app:
--   warung-photos/{warung_id}/{timestamp}-{nama}.webp
--   avatars/{user_id}/{timestamp}-{nama}.{ext}
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'warung-photos',
    'warung-photos',
    true,
    10485760, -- 10 MB
    array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'avatars',
    'avatars',
    true,
    5242880, -- 5 MB
    array['image/webp', 'image/jpeg', 'image/png', 'image/gif']
)
on conflict (id) do update
set public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- warung-photos
-- ---------------------------------------------------------------------------
drop policy if exists "mma_warung_photos_read" on storage.objects;
create policy "mma_warung_photos_read" on storage.objects
    for select
    using (bucket_id = 'warung-photos');

drop policy if exists "mma_warung_photos_admin_insert" on storage.objects;
create policy "mma_warung_photos_admin_insert" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'warung-photos' and public.is_admin());

drop policy if exists "mma_warung_photos_admin_update" on storage.objects;
create policy "mma_warung_photos_admin_update" on storage.objects
    for update to authenticated
    using (bucket_id = 'warung-photos' and public.is_admin())
    with check (bucket_id = 'warung-photos' and public.is_admin());

drop policy if exists "mma_warung_photos_admin_delete" on storage.objects;
create policy "mma_warung_photos_admin_delete" on storage.objects
    for delete to authenticated
    using (bucket_id = 'warung-photos' and public.is_admin());

-- ---------------------------------------------------------------------------
-- avatars
-- ---------------------------------------------------------------------------
drop policy if exists "mma_avatars_read" on storage.objects;
create policy "mma_avatars_read" on storage.objects
    for select
    using (bucket_id = 'avatars');

drop policy if exists "mma_avatars_insert_own" on storage.objects;
create policy "mma_avatars_insert_own" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

drop policy if exists "mma_avatars_update_own" on storage.objects;
create policy "mma_avatars_update_own" on storage.objects
    for update to authenticated
    using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

drop policy if exists "mma_avatars_delete_own" on storage.objects;
create policy "mma_avatars_delete_own" on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

commit;
