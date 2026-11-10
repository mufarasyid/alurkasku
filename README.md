# ALURKASKU

Money management app untuk individu (Indonesian market): catat transaksi, accounts, budgets, categories, patungan.

## Struktur

- `client/` — React 19 + Vite + Tailwind (dashboard, termasuk **admin console** untuk role admin)
- `server/` — Go (net/http + ServeMux, PostgreSQL), lihat `server/README.md` untuk endpoint lengkap

## Admin console

User dengan `role: admin` bisa mengelola semua member dari dashboard (menu **Administration → Members** di `/dashboard/admin`): lihat daftar member + search/filter role, edit profil/role, hapus member (soft delete), dan melihat data keuangan member secara **read-only** (accounts, transactions, budgets, categories, subscriptions, overview).

Membuat admin pertama:

```bash
cd server
go run ./cmd/promote-admin -email anda@example.com -role admin   # atau: make promote-admin email=anda@example.com
```

Lalu login ulang. Dokumentasi API admin ada di `server/README.md`.
