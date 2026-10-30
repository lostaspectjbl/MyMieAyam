-- ============================================================================
-- MMA — Realtime
-- ============================================================================
-- ReviewList di app berlangganan INSERT pada tabel reviews.
-- Tanpa menambahkan tabel ke publication, update realtime tidak akan terkirim.
-- ============================================================================

begin;

do $$
begin
    if exists (
        select 1
        from pg_publication
        where pubname = 'supabase_realtime'
    ) and not exists (
        select 1
        from pg_publication_tables
        where pubname    = 'supabase_realtime'
          and schemaname = 'public'
          and tablename  = 'reviews'
    ) then
        alter publication supabase_realtime add table public.reviews;
    end if;
end
$$;

commit;
