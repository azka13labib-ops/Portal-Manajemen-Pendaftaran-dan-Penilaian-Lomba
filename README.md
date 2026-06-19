# 🏆 Portal Manajemen Pendaftaran dan Penilaian Lomba

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database%20&%20Auth-3ECF8E?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)

Aplikasi *end-to-end* untuk mengelola penyelenggaraan kompetisi/lomba secara profesional. Dirancang dengan antarmuka modern yang kaya akan mikro-animasi (*framer-motion*), portal ini menyatukan alur kerja **Admin (Panitia)**, **Juri**, dan **Peserta** dalam satu platform terpadu.

---

## ✨ Fitur Utama

### 👑 1. Panel Admin (Panitia)
- **Manajemen Event Terpusat**: Buat kompetisi baru, tentukan jadwal pendaftaran, dan kelola rubrik kriteria penilaian.
- **Verifikasi Peserta**: Cek dokumen pendaftaran peserta secara manual (Approve/Reject dengan catatan).
- **Distribusi Penilaian**: *Assign* Juri ke kompetisi dan sebarkan puluhan karya ke juri-juri yang ditugaskan hanya dengan 1 klik (Distribusi Otomatis).
- **Real-time Leaderboard**: Pantau peringkat peserta secara *live* berdasarkan agregat nilai dari seluruh juri.
- **Finalisasi & E-Sertifikat Otomatis**: Kunci nilai lomba dan otomatis hasilkan PDF E-Sertifikat untuk Juara dan seluruh Partisipan secara massal (Batch Generation).

### ⚖️ 2. Panel Juri
- **Antrian Penilaian Terorganisir**: Juri hanya melihat karya yang secara spesifik ditugaskan kepada mereka.
- **Formulir Interaktif**: Berikan nilai menggunakan *range slider* dinamis dengan batas min/max yang terkunci sesuai bobot kriteria.
- **Simpan sebagai Draft**: Juri dapat menyicil penilaian (Save as Draft) sebelum mengirim skor final (Lock & Submit).

### 👥 3. Panel Peserta
- **Pendaftaran Fleksibel**: Mendukung mode pendaftaran **Individu** maupun **Tim**.
- **Pelacakan Status**: Pantau status dokumen syarat (Pending, Ditolak, atau Disetujui).
- **Manajemen Karya**: Unggah karya berupa berkas dokumen/ZIP maupun tautan link eksternal (YouTube/Drive).
- **Unduh E-Sertifikat**: Akses dan unduh sertifikat PDF resmi secara mandiri setelah kompetisi ditutup.

---

## 🛠️ Tech Stack & Arsitektur

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS (Utility-first), Framer Motion (Animasi UI/UX), Lucide React (Ikon)
- **Backend & Database**: Supabase (PostgreSQL)
- **Autentikasi**: Supabase Auth (Multi-role session)
- **Storage**: Supabase Storage Bucket (Penyimpanan Berkas Karya & PDF)
- **PDF Generator**: `pdf-lib` (Node.js Server-side PDF manipulation)

---

## 🚀 Panduan Setup & Instalasi Lokal

### 1. Kloning Repositori
```bash
git clone https://github.com/azka13labib-ops/Portal-Manajemen-Pendaftaran-dan-Penilaian-Lomba.git
cd Portal-Manajemen-Pendaftaran-dan-Penilaian-Lomba/portal-lomba
```

### 2. Install Dependensi
Karena aplikasi ini dikelola menggunakan **pnpm**, jalankan perintah:
```bash
pnpm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env.local` di root folder (`portal-lomba`) dan isi dengan kredensial Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### 4. Setup Database Supabase
Pastikan Anda menjalankan *SQL Script* utama untuk menginisialisasi tabel, relasi, fungsi, dan kebijakan keamanan RLS:
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Masuk ke menu **SQL Editor**
3. Eksekusi semua *query* yang ada di dalam file `supabase/setup.sql`.
4. *(Jika mengalami kendala hak akses Juri)*, eksekusi juga perintah perbaikan di file `rls_fix.sql`.

### 5. Jalankan Server Development
```bash
pnpm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

---

## 🔐 Struktur Roles & Autentikasi

Aplikasi ini menggunakan **Supabase Auth** standar dengan *Custom Claims* untuk membedakan role. Tabel internal `public.roles` dan `public.user_roles` mengatur hak akses. 

**Cara mengakses fitur spesifik:**
* Jika Anda mendaftar pertama kali secara normal di `/auth/register`, Anda akan menjadi **Peserta**.
* Untuk mengakses halaman Admin (`/admin`), akun Anda harus diberi *Role ID* `1` (ADMIN) secara manual di database.
* Untuk akun Juri (`/judge`), Admin harus meng-upgrade role akun via halaman *Manajemen Juri* di Panel Admin.

---

## 👨‍💻 Kontribusi

Silakan ajukan *Pull Request* atau *Issue* jika menemukan bug atau ingin menambahkan fitur yang berguna untuk ekosistem manajemen kompetisi.

**Developer:** Azka Labib Abdillah Zain
