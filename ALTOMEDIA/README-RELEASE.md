# MINERINDO — Rilis & Panduan Build Android

## Ringkasan Proyek

**MINERINDO** adalah game mining kripto bertema tambang untuk Android,
dikembangkan oleh **ALTOMEDIA** (Developer, Karawang, Jawa Barat, ID).

- Repository: `kdsmedia/Minerindo` (branch `main`)
- Stack: React Native (Expo SDK 53), TypeScript, Supabase (PostgreSQL + RLS + Edge Functions)
- Package ID: `com.altomedia.minerindo`
- Versi: `1.0.0` (versionCode `1`)

## Build Android

### Prasyarat

- JDK 21
- Android SDK: platform 35/36/37.0, build-tools 37.0.0, platform-tools
- Node.js + pnpm (dependensi Expo)

### Keystore (RAHASIA)

File `ALTOMEDIA.jks` disimpan **lokal** di:

- `/home/openhands/keystores/ALTOMEDIA.jks`
- `ALTOMEDIA/keystore/ALTOMEDIA.jks` (di-gitignore, **tidak** ikut push)

> **PENTING**: jangan pernah commit keystore atau `android/key.properties` ke repository publik.

### Menjalankan build

```bash
# 1. Siapkan folder native (sekali
npx expo prebuild --platform android --no-install

# 2. Pastikan android/key.properties ada (isi sesuai keystore
storeFile=ALTOMEDIA/keystore/ALTOMEDIA.jks
storePassword=**RAHASIA**
keyAlias=kdsmedia
keyPassword=**RAHASIA**

# 3. Build
cd android
ANDROID_HOME=/opt/android-sdk ANDROID_SDK_ROOT=/opt/android-sdk ./gradlew assembleRelease

# 4. Hasil
app/build/outputs/apk/release/app-release.apk
```

APK release ditandatangani dengan keystore ALTOMEDIA (alias `kdsmedia`).
Hash & detail sertifikat diverifikasi sebelum upload.

## Identitas

| Aspek | Nilai |
|---|---|
| Nama app | MINERINDO |
| Developer | ALTOMEDIA |
| Alamat | Karawang, Jawa Barat, Indonesia (ID) |
| Package | com.altomedia.minerindo |
| minSdk | 21 |
| targetSdk |  ​37 (Play Console saat ini: target 35+ wajib; 37 memenuhi terbaru) |
| compileSdk |  ​37 |
| buildTools |  ​37.0.0 |
| Keystore validity |​ 10.000 hari |
| Alias | kdsmedia |

## Struktur Folder ALTOMEDIA

- `README-RELEASE.md` — dokumen ini
- `PRIVACY-POLICY.md` — kebijakan privasi
- `TERMS-OF-SERVICE.md` — syarat & ketentuan
- `STORE-LISTING.md` — materi listing Play Console
- `CHANGELOG.md` — riwayat rilis
- `ARTIKEL-BLOG.md` — artikel promosi 4000+ karakter
- `store-assets/` — icon, feature graphic, screenshots
- `keystore/` — keystore (local, rahasia, tidak di-commit)

## Catatan Rilis

- Database Supabase inti ( 6 tabel, 15 policy RLS, RPC) sudah dimigrasi & diverifikasi.

- Tidak ada data dummy/test tersisa di database.

- TypeScript lulus pengecekan (`npx tsc --noEmit`  — 0 error)
- Foldash native `android/` di-generate (`expo prebuild`)  silakan regen ulang bila perlu