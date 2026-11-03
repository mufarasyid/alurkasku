# Alurkasku Client

Frontend modern untuk aplikasi Alurkasku. Dibangun dengan React 19, Vite, Tailwind CSS v4, dan React Router. Fokus pada pengalaman pengguna yang cepat, bersih, dan responsif.

## Struktur Project

```
src/
  assets/              # Gambar, icon, font statis
  components/          # Komponen reusable (UI, form, layout)
    templates/         # Template komponen halaman
    ui/                # Komponen dasar (button, input, card)
  lib/                 # Utilitas & konfigurasi (api client, utils)
  pages/               # Halaman aplikasi
    auth/              # Login & Register
    dashboard/         # Dashboard, Transaction, Settings
    landingpage/       # Halaman depan
  services/            # Layer API (auth, user, transaction)
App.jsx               # Router & layout utama
index.css             # Style global + Tailwind directives
main.jsx              # Entry point React
```

## Prinsip Desain

- **Feature-based pages**: Setiap fitur (auth, dashboard, transaction) punya halaman dan komponen sendiri.
- **API layer terpisah**: `services/` menangani semua komunikasi ke backend, sementara komponen hanya mengurus tampilan.
- **Komponen modular**: Menggunakan `class-variance-authority`, `clsx`, dan `tailwind-merge` untuk gaya yang konsisten dan dapat dikombinasikan.
- **Routing declaratif**: React Router v8 dengan layout bersarang (`DashboardLayout`).
- **No global state library**: Mengandalkan prop-drilling lokal dan konteks sederhana bila diperlukan.

## Rute (Pages)

| Path | Komponen | Keterangan |
|------|----------|------------|
| `/login` | `LoginPage` | Form autentikasi |
| `/register` | `RegisterPage` | Form pendaftaran |
| `/dashboard` | `DashboardPage` | Ringkasan utama |
| `/dashboard/transaction` | `TransactionPage` | Riwayat transaksi |
| `/dashboard/settings` | `SettingsPage` | Pengaturan akun |

## Script (Makefile / NPM)

```bash
npm run dev        # Jalankan development server (Vite + HMR)
npm run build      # Build produksi ke `dist/`
npm run preview    # Preview build produksi secara lokal
npm run lint       # ESLint dengan konfigurasi modern
```

## Cara Menjalankan Project (Pertama Kali)

### 1. Masuk direktori

```bash
cd alurkasku/client
```

### 2. Salin env

```bash
cp .env.example .env
```

Edit `.env` jika backend berjalan di port atau domain berbeda:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

### 3. Install dependensi

```bash
npm install
```

### 4. Jalankan server development

```bash
npm run dev
```

Aplikasi berjalan di `http://localhost:5173` secara default.

## Konfigurasi API

File `src/lib/api.js` mengatur instance `axios`. Semua endpoint backend (`/auth/login`, `/users`, dll.) dipanggil melalui `services/auth.js`, `services/user.js`, atau `services/subscription.js`.

## Styling

- **Tailwind CSS v4** dengan `@tailwindcss/vite`
- **Radix UI** untuk aksesibilitas komponen select, slot, dialog
- **Lucide React** untuk icon konsisten
- **SnitchUI** sebagai library komponen UI siap pakai

## Teknologi

- React 19.3+
- Vite 6+
- React Router 8
- Tailwind CSS v4
- Axios
- Radix UI
- Lucide React
- ESLint (flat config)

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `CORS error` saat login | Pastikan backend `CORS` sudah diaktifkan atau `VITE_API_URL` sesuai host backend |
| `404 /api/v1/auth/login` | Pastikan server Go berjalan di port yang benar (`APP_PORT`) |
| Build lambat / error | Hapus `node_modules/` dan `package-lock.json`, lalu `npm install` ulang |

## Catatan Pengembangan

- Tambah halaman baru: buat folder di `src/pages/` dan daftarkan route di `App.jsx`.
- Tambah komponen reusable: letakkan di `src/components/ui/` atau `src/components/templates/`.
- Semua perubahan skema atau endpoint harus disinkronkan dengan backend (`@alurkasku/server/`).
