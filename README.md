# MyMieAyam

Website rekomendasi mie ayam: katalog warung, foto, review, dan favorit.
Dibangun dengan Next.js 16 (App Router) + Supabase (Auth, Postgres, Storage, Realtime).

## Prasyarat

- Node.js 20+
- Project Supabase baru (gratis cukup)
- (Opsional) Supabase CLI + Docker, jika ingin push migration dari terminal

## 1. Buat project Supabase

1. Buka <https://supabase.com/dashboard> lalu **New project**.
2. Simpan **project ref**, **anon key**, dan **service role key** (service role
   jangan pernah dipakai di browser / dikomit).
3. Di **Authentication -> Providers**, pastikan Email aktif.
4. Di **Authentication -> URL Configuration**, isi Site URL
   `http://localhost:3000` dan tambahkan Redirect URL `http://localhost:3000/**`.
5. Untuk development cepat, "Confirm email" boleh dinonaktifkan di
   **Authentication -> Providers -> Email** agar bisa langsung login setelah daftar.

## 2. Konfigurasi environment

```bash
cp .env.example .env.local
```

Isi `.env.local` dari **Project Settings -> API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Hanya variabel `NEXT_PUBLIC_*` yang dipakai aplikasi. Jangan menaruh service
role key di file ini. Jika sudah ada `.env` lama, `.env.local` akan
diprioritaskan oleh Next.js sehingga aman untuk menimpa konfigurasi lama.

## 3. Jalankan migration

Migration ada di `supabase/migrations/` dan **wajib dijalankan berurutan**:

| Urutan | File | Isi |
| --- | --- | --- |
| 1 | `20261026000000_initial_schema.sql` | Tabel, view, index, trigger |
| 2 | `20261026000001_rls.sql` | Row Level Security + policy |
| 3 | `20261026000002_storage.sql` | Bucket & policy Storage |
| 4 | `20261026000003_realtime.sql` | Publikasi realtime tabel reviews |
| 5 | `20261030000000_reviews_moderation.sql` | Admin boleh hapus review siapa saja + replica identity realtime |

### Cara A — SQL Editor (tanpa CLI)

1. Buka **SQL Editor** di dashboard Supabase.
2. Buka tiap file sesuai urutan di atas, salin seluruh isinya, lalu **Run**.
3. Pastikan tiap file selesai tanpa error sebelum lanjut ke file berikutnya.

### Cara B — Supabase CLI

```bash
npx supabase init   # lewati jika supabase/config.toml sudah ada
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

`db push` hanya menjalankan migration, **bukan** seed. Lanjut ke langkah 4.
Docker harus berjalan untuk perintah CLI yang butuh database lokal.

## 4. Seed data contoh

Buka `supabase/seed.sql` di SQL Editor lalu **Run**. Seed mengisi 3 warung
dengan 3 foto masing-masing dan aman dijalankan ulang (`on conflict`).

Seed tidak membuat user. User harus mendaftar lewat aplikasi agar profile
dibuat otomatis oleh trigger `handle_new_user`. Review/favorit tidak di-seed
karena membutuhkan `user_id` yang valid.

## 5. Jadikan admin pertama

Daftar akun lewat aplikasi terlebih dahulu, lalu jalankan di SQL Editor:

```sql
update public.profiles
set is_admin = true
where id = (
  select id from auth.users where email = 'email-kamu@contoh.com'
);
```

Trigger `protect_is_admin` hanya mengizinkan perubahan `is_admin` dari service
role / SQL Editor, sehingga user biasa tidak bisa menaikkan hak aksesnya
sendiri.

## 6. Jalankan aplikasi

```bash
npm install
npm run dev
```

Buka <http://localhost:3000>. Halaman `/admin` hanya bisa diakses akun dengan
`is_admin = true`.

## Skema database

- `profiles` — data publik user + `is_admin` (dibuat otomatis saat signup).
- `warung` — katalog warung.
- `warung_foto` — foto warung, urut berdasarkan `urutan` lalu `created_at`.
- `reviews` — rating 1–5, satu review per user per warung.
- `favorit` — satu favorit per user per warung.
- `warung_with_rating` — view `security_invoker` berisi `avg_rating`,
  `total_reviews`, dan `foto_thumbnail` untuk kartu warung.

Bucket Storage: `warung-photos` (10 MB, admin) dan `avatars` (5 MB, folder
`<user_id>/`). Keduanya publik untuk dibaca.

## Keamanan

- RLS aktif di semua tabel; user hanya bisa mengubah data miliknya.
- Penulisan `warung`/`warung_foto` dan upload foto warung dibatasi admin.
- Review hanya bisa diubah/dihapus pemiliknya; admin boleh menghapus review mana pun.
- Avatar hanya bisa ditulis ke folder milik user.
- API key yang boleh ada di client hanyalah anon key.

## Troubleshooting

- **Gambar seed tidak tampil**: pastikan URL memakai `/png` dari placehold.co.
  `next/image` dikonfigurasi dengan `dangerouslyAllowSVG: false`.
- **`relation "warung_with_rating" does not exist`**: migration belum dijalankan
  atau urutannya terbalik.
- **Upload foto warung ditolak**: akun belum `is_admin`, atau tipe file bukan
  WebP/JPEG/PNG.
- **Realtime review tidak masuk**: pastikan migration realtime sudah dijalankan
  dan Realtime aktif. Alternatif: buka **Database -> Replication**, pilih
  publication `supabase_realtime`, lalu tambahkan tabel `public.reviews`.
- **Aksi pertama terasa lambat**: `npm run dev` mengompilasi route/server action
  saat pertama dipakai, dan Supabase gratis bisa cold start. Uji dengan
  `npm run build && npm start`. Pengiriman email reset juga bisa butuh beberapa
  detik; jangan refresh halaman saat proses berjalan.
- **Setelah verifikasi email malah diminta login / password salah**: link
  verifikasi otomatis membuat sesi, jadi kamu tidak perlu login lagi. Mendaftar
  ulang dengan email yang sama tidak mengganti password akun lama; gunakan
  password saat pendaftaran pertama atau reset password.
