# Changelog — MINERINDO

## v1.0.0 (2026-08-31)

Rilis perdana ke Google Play.

### Migrasi Database (Supabase

- Se 6 tabel inti dibuat dan dimigrasi: profil pengguna, saldo/dompet,
  mesin, kepemilikan mesin, riwayat mining, dan tugas harian..
- **15 kebijakan RLS (Row Level Security)**  aktif di seluruh tabel inti —
  setiap pengguna hanya dapat mengakses datanya sendiri; admin memiliki
  akses penuh..
- RPC inti untuk operasi klaim bonus dan penarikan dibuat..
- Migrasi bersifat **idempoten**  — dapat diterapkan ulang tanpa efek
  ganda..

### Aplikasi (React Native / Expo

- Rebrand identitas: **MINERINDO by ALTOMEDIA**
- Package ID: `com.altomedia.minerindo`
- Konfigurasi build Android: `minSdkVersion 21`, `compileSdkVersion&targetSdkVersion 37`, `buildToolsVersion 37.0.0`
- Keystore signing `ALTOMEDIA.jks` (alias `kdsmedia`, validity 10.000 hari) disiapkan lokal dan diamankan (tidak di-commit).
- Folder native `android/` di-generate via `expo prebuild`..
- TypeScript: 0 error (`npx tsc --noEmit`).
- Perbaikan tipe gradient (`LinearGradient` tuple colors) dan prop
  `borderRadius` yang dipindah ke style, serta regenerasi typed routes
  expo-router.

### Kualitas

- Tidak ada data dummy/test tersisa di database..
- Verifikasi RLS end-to-end (insert anon lolos policy, deny akses
  silang)..
- Semua fitur dummy/simulasi yang tidak diperlukan sudah ditinjau dan
  dibersihkan.

### Aset Store

- Ikon 512x512, adaptive foreground 1024, feature graphic
  1024x500, dan 8 mockup screenshot phone di-generate di
  `ALTOMEDIA/store-assets/`. — Catatan: screenshots sebaiknya
   diganti tangkapan asli sebelum submit ke Play.

### Dokumen

- `PRIVACY-POLICY.md` dan `TERMS-OF-SERVICE.md` disiapkan untuk
  keperluan Play Console dan situs..
- `STORE-LISTING.md`: seluruh materi listing (judul, deskripsi,
  kategori, tag, data safety).
- `ARTIKEL-BLOG.md`: artikel promosi 4000+ karakter.