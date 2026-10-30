-- ============================================================================
-- MMA — Review moderation
-- ============================================================================
-- Admin boleh menghapus review siapa saja. User tetap boleh update/delete
-- review miliknya lewat policy reviews_update_own / reviews_delete_own.
-- Replica identity full agar event realtime DELETE membawa warung_id.
-- ============================================================================

begin;

drop policy if exists "reviews_delete_admin" on public.reviews;
create policy "reviews_delete_admin" on public.reviews
    for delete to authenticated
    using (public.is_admin());

alter table public.reviews replica identity full;

commit;
