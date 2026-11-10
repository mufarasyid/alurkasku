# Alurkasku Server

Backend Go profesional dengan clean architecture, PostgreSQL, dan fitur-based modules. Cocok untuk dikembangkan jangka panjang.

## Struktur Project

```
cmd/api/                # Entry point aplikasi (main.go)
internal/
  bootstrap/            # Dependency injection & wiring aplikasi
  config/               # Konfigurasi (viper + .env)
  modules/              # Fitur-fitur aplikasi (tiap fitur mandiri)
    user/               # Fitur: User (CRUD)
      domain/           # Model, interface repository, interface service
      repository/       # Implementasi repository (PostgreSQL)
      service/          # Business logic
      handler/          # HTTP handler
      route/            # Pendaftaran route
    auth/               # Fitur: Authentication (register, login, refresh, logout)
      domain/ repository/ service/ handler/ route/
    account/            # Fitur: Accounts (per-user, CRUD + bulk delete)
      domain/           # Model, interface repository, interface service
      repository/       # Implementasi repository (PostgreSQL)
      service/          # Business logic
      handler/          # HTTP handler
      route/            # Pendaftaran route
    admin/              # Fitur: Admin console (list/detail/update/delete user + read-only data keuangan user)
      domain/ repository/ service/ handler/ route/
    category/           # Fitur: Categories (per-user, CRUD + bulk delete + seed default)
      domain/ repository/ service/ handler/ route/
    budget/             # Fitur: Budgets (per-user, CRUD + bulk delete, FK ke category)
      domain/ repository/ service/ handler/ route/
    transaction/        # Fitur: Transactions (per-user, income/expense, update saldo account, overview & breakdown)
      domain/ repository/ service/ handler/ route/
    transfer/           # Fitur: Transfers & Withdrawals (per-user, pindah saldo antar account, biaya admin opsional)
      domain/ repository/ service/ handler/ route/
  platform/             # Cross-cutting concerns
    database/           # Koneksi PostgreSQL + runner migration
    logger/             # Zerolog wrapper
    security/           # Bcrypt password + JWT manager
  router/               # Wrapper HTTP router (net/http ServeMux)
  shared/               # Paket shared antar modul
    apperror/           # Error bertipe dengan kode + HTTP status
    response/           # Envelope respons JSON standar
    middleware/         # Logging, recovery, content-type JSON
db/migrations/          # SQL migration (up / down)
.env                    # Variabel lingkungan lokal (tidak di-commit)
.env.example            # Template env untuk tim lain
go.mod                  # Dependensi Go
Makefile                # Perintah development
README.md               # Dokumentasi ini
```

## Prinsip Desain

- **Feature-based modules**: Setiap fitur (user, auth) punya domain, repository, service, handler, route sendiri.
- **Dependency inversion**: Domain mendefinisikan interface; implementasi PostgreSQL berada di repository layer.
- **Tanpa framework web**: `net/http` bawaan + `ServeMux` dengan middleware custom.
- **Typed error**: `apperror.AppError` carries code + HTTP status.
- **Graceful shutdown**: `http.Server.Shutdown` saat SIGINT/SIGTERM.
- **12-factor config**: `.env` dibaca via Viper dengan validasi.

## Endpoint

| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `/api/v1/auth/register` | Daftar user baru |
| POST | `/api/v1/auth/login` | Masuk, dapat access + refresh token |
| POST | `/api/v1/auth/refresh` | Perbarui access token pakai refresh token |
| POST | `/api/v1/auth/logout` | Hapus refresh token |
| POST | `/api/v1/users` | Buat user baru (admin) |
| GET | `/api/v1/users` | List user, filter `?q=` dan `?role=admin\|user` (admin) |
| GET | `/api/v1/users/{id}` | Detail user (pemilik atau admin) |
| PUT | `/api/v1/users/{id}` | Update user; field `role` hanya boleh diubah admin (pemilik atau admin) |
| DELETE | `/api/v1/users/{id}` | Hapus user, soft delete (admin) |
| GET | `/api/v1/admin/users` | List semua user `?page=&page_size=&q=&role=` (admin) |
| GET | `/api/v1/admin/users/{id}` | Detail user (admin) |
| PUT | `/api/v1/admin/users/{id}` | Update user, termasuk `role`; admin tidak bisa ubah role diri sendiri (admin) |
| DELETE | `/api/v1/admin/users/{id}` | Hapus user, tidak bisa menghapus diri sendiri (admin) |
| GET | `/api/v1/admin/users/{id}/accounts` | Lihat accounts milik user `?page=&page_size=&q=&type=` (admin, read-only) |
| GET | `/api/v1/admin/users/{id}/transactions` | Lihat transactions milik user `?page=&page_size=&q=&type=&period=` (admin, read-only) |
| GET | `/api/v1/admin/users/{id}/transactions/overview` | Ringkasan income/expense untuk period `?period=this-month\|last-month\|last-3-months\|this-year` (admin, read-only) |
| GET | `/api/v1/admin/users/{id}/transactions/breakdown` | Expense per category untuk period (admin, read-only) |
| GET | `/api/v1/admin/users/{id}/budgets` | Lihat budgets milik user `?page=&page_size=&q=&period=` (admin, read-only) |
| GET | `/api/v1/admin/users/{id}/categories` | Lihat categories milik user `?page=&page_size=&q=&type=` (admin, read-only) |
| GET | `/api/v1/admin/users/{id}/subscriptions` | Lihat subscriptions milik user (admin, read-only) |
| POST | `/api/v1/subscriptions` | Buat subscription (user/admin) |
| GET | `/api/v1/subscriptions/{id}` | Detail subscription |
| GET | `/api/v1/subscriptions/me` | List subscription milik user yang login |
| POST | `/api/v1/transfers` | Buat transfer antar rekening sendiri (source berkurang amount+fee, destination bertambah amount) |
| GET | `/api/v1/transfers` | List transfer milik user yang login (`?limit=`) |
| POST | `/api/v1/withdrawals` | Tarik tunai: bank/wallet → account Cash (endpoints terpisah dari transfer) |
| GET | `/api/v1/withdrawals` | List tarik tunai milik user yang login (`?limit=`) |
| PUT | `/api/v1/subscriptions/{id}` | Update subscription |
| DELETE | `/api/v1/subscriptions/{id}` | Hapus subscription |
| GET | `/api/v1/subscriptions` | List subscription (pagination) |
| POST | `/api/v1/accounts` | Buat account (milik user yang login) |
| GET | `/api/v1/accounts` | List account (filter `?type=Bank\|Wallet&q=`) |
| GET | `/api/v1/accounts/{id}` | Detail account |
| PUT | `/api/v1/accounts/{id}` | Update account |
| DELETE | `/api/v1/accounts/{id}` | Hapus account |
| POST | `/api/v1/accounts/bulk-delete` | Hapus banyak account `{ids: [...]}` |
| POST | `/api/v1/categories` | Buat category (milik user yang login) |
| GET | `/api/v1/categories` | List category (filter `?type=Income\|Expense&q=`) |
| GET | `/api/v1/categories/{id}` | Detail category |
| PUT | `/api/v1/categories/{id}` | Update category |
| DELETE | `/api/v1/categories/{id}` | Hapus category |
| POST | `/api/v1/categories/bulk-delete` | Hapus banyak category `{ids: [...]}` |
| POST | `/api/v1/budgets` | Buat budget (milik user yang login) |
| GET | `/api/v1/budgets` | List budget (filter `?period=Weekly\|Monthly\|Yearly&q=`) |
| GET | `/api/v1/budgets/{id}` | Detail budget |
| PUT | `/api/v1/budgets/{id}` | Update budget |
| DELETE | `/api/v1/budgets/{id}` | Hapus budget |
| POST | `/api/v1/budgets/bulk-delete` | Hapus banyak budget `{ids: [...]}` |
| POST | `/api/v1/transactions` | Buat transaction (income/expense) — otomatis update saldo account |
| GET | `/api/v1/transactions` | List transaction (filter `?period=this-month\|last-month\|last-3-months\|this-year&type=Income\|Expense&q=&limit=`) |
| GET | `/api/v1/transactions/overview` | Ringkasan period (total/income/expense + `delta_pct` vs periode sebelumnya) |
| GET | `/api/v1/transactions/breakdown` | Expense per category untuk period (top 5, dengan `pct`) |

**Catatan:** `subscriptions` memiliki `start_date` dan `end_date`; user/auth mengelola via `role` (`admin`/`user`). Soft delete hanya di `users` (`deleted_at`); `subscriptions` hard delete.

**Admin (`/api/v1/admin/...`):** semua endpoint admin dilindungi `RequireAdmin` (JWT `role` harus `admin`). User biasa tidak bisa mengakses endpoint ini maupun list `/api/v1/users`. Pengelolaan user (list/detail/update/delete) dilakukan admin lewat `/api/v1/admin/users`; perubahan `role` oleh user biasa ditolak. Endpoint `/api/v1/admin/users/{id}/*` hanya membaca (read-only) data keuangan milik user tertentu — admin tidak bisa mengubah data keuangan user lewat endpoint ini. Admin tidak bisa mengubah role diri sendiri dan tidak bisa menghapus akun sendiri lewat console. Admin boleh mengubah role admin lain, termasuk melepas role admin — pastikan selalu tersisa minimal satu admin.

**Mengangkat admin pertama:** daftar seperti biasa, lalu jalankan:

```bash
go run ./cmd/promote-admin -email nama@example.com -role admin
# atau: make promote-admin email=nama@example.com
```

Token JWT yang sudah terbit tetap membawa role lama sampai user login ulang (role dibaca dari claims saat request; client harus re-login setelah promosi).

**Accounts, categories, budgets** bersifat per-user — semua query di-scope ke `user_id` dari JWT, jadi user hanya bisa melihat dan mengubah datanya sendiri. List endpoint mengembalikan **seluruh** data user (tanpa pagination) karena dataset personal finance kecil dan frontend melakukan search/filter/sort/pagination di sisi client; gunakan query param `type`/`period`/`q` untuk filter di server. `icon` disimpan sebagai nama string (mis. `"Utensils"`) yang dimapping ke komponen icon di frontend. Nominal (`balance`, `limit`, `spent`, `amount`) disimpan sebagai `BIGINT` rupiah tanpa desimal. Budget mereferensikan category via `category_id` (nullable, `ON DELETE SET NULL`); response budget menyertakan nama kategori lewat JOIN (`category`). `spent` budget tidak disimpan sebagai counter; server menghitungnya dinamis dari transaction `Expense` pada kategori budget dalam periode berjalan (week/month/year). Status budget (On track / Warning / Over) dihitung di client dari `spent` dan `limit`. Saat register, user baru otomatis mendapat 14 kategori default; user lama mendapat backfill yang sama dari migration `006_create_categories`.

**Accounts** punya tiga tipe: `Bank`, `Wallet`, `Cash` (sejak migration `009`). **Transfer** hanya antar rekening milik sendiri: source berkurang `amount + fee`, destination bertambah `amount`, semuanya dalam satu DB transaction; `fee` bersifat opsional dan tidak dikreditkan ke rekening mana pun. **Withdrawals** (tarik tunai) adalah fitur terpisah (`/api/v1/withdrawals`): source harus `Bank`/`Wallet`, destination harus `Cash`. Keduanya tidak memengaruhi laporan income/expense. Menghapus account menghapus riwayat transaction & transfer miliknya (`ON DELETE CASCADE`).

**Transactions** juga per-user. Setiap create memvalidasi kepemilikan `account_id`/`category_id` (category harus se-`type` dengan transaksi), menolak `amount <= 0`, dan menolak expense yang melebihi saldo account. Insert + update saldo account terjadi dalam satu DB transaction. Tidak ada `PUT`/`DELETE` untuk transactions saat ini — edit/hapus belum diekspos ke API.

**Payday cycle (migration `012`):** `users.payday_day` (`1-31`, nullable) membuat `this-month`/`last-month`/`last-3-months` dihitung dari siklus gajian (mis. payday 25 → 25 Okt sampai 24 Nov untuk November), termasuk pada `?period=` transactions list dan overview. `this-year` tetap kalender; budget "spent" juga tetap kalender. Set/hapus lewat `PUT /api/v1/users/{id}` (`payday_day` / `clear_payday_day`) atau UI Settings → "Payday cycle".

## Cara Menjalankan Project (Pertama Kali)

### 1. Clone dan masuk direktori

```bash
cd /Users/mac/Developer/riset/mufarasyid/alurkasku/server
```

### 2. Siapkan variabel lingkungan

```bash
cp .env.example .env
```

Edit `.env` sesuai kebutuhan. Pastikan `DB_NAME=alurkasku` untuk development lokal.

### 3. Install PostgreSQL (Mac via Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16
```

### 4. Buat database

```bash
createdb alurkasku
```

### 5. Install dependensi Go

```bash
go mod tidy
```

### 6. Jalankan migration

Jalankan semua file `.up.sql` di `db/migrations/` secara berurutan — atau gunakan `make migrate` (runner transactional dengan tabel `schema_migrations`):

```bash
go run ./cmd/migrate
```

Jika ingin manual via psql:

```bash
psql -h localhost -U postgres -d alurkasku -f db/migrations/001_create_users.up.sql
psql -h localhost -U postgres -d alurkasku -f db/migrations/002_create_refresh_tokens.up.sql
psql -h localhost -U postgres -d alurkasku -f db/migrations/003_add_users_role.up.sql
psql -h localhost -U postgres -d alurkasku -f db/migrations/004_create_subscriptions.up.sql
psql -h localhost -U postgres -d alurkasku -f db/migrations/005_create_accounts.up.sql
psql -h localhost -U postgres -d alurkasku -f db/migrations/006_create_categories.up.sql
psql -h localhost -U postgres -d alurkasku -f db/migrations/007_create_budgets.up.sql
psql -h localhost -U postgres -d alurkasku -f db/migrations/008_create_transactions.up.sql
psql -h localhost -U postgres -d alurkasku -f db/migrations/009_add_account_cash_type.up.sql
psql -h localhost -U postgres -d alurkasku -f db/migrations/010_create_transfers.up.sql
```

### 7. Jalankan server

```bash
go run ./cmd/api
```

Server berjalan di `http://localhost:8080`.

## Makefile (Perintah Pendek)

```bash
make run        # Jalankan server (go run ./cmd/api)
make test       # Jalankan semua test dengan race detector
make lint       # Jalankan golangci-lint
make tidy       # Bersihkan & unduh dependensi (go mod tidy)
make build      # Build binary untuk Linux (bin/api)
make fmt        # Format semua file Go (gofmt)
```

## Panduan Pengembangan Kedepan

### Menambah Tabel Baru (Migration Baru)

1. Buat file migration baru di `db/migrations/` dengan pola:
   - `003_nama_tabel.up.sql` — membuat tabel
   - `003_nama_tabel.down.sql` — menghapus tabel (rollback)

2. Contoh `003_create_posts.up.sql`:
   ```sql
   CREATE TABLE posts (
       id          BIGSERIAL PRIMARY KEY,
       user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       title       VARCHAR(255) NOT NULL,
       content     TEXT NOT NULL,
       created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
       updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
       deleted_at  TIMESTAMP WITH TIME ZONE
   );

   CREATE INDEX idx_posts_user_id ON posts(user_id);
   CREATE INDEX idx_posts_deleted_at ON posts(deleted_at);
   ```

3. Jalankan migration:
   ```bash
   psql -h localhost -U postgres -d alurkasku -f db/migrations/003_create_posts.up.sql
   ```

### Menambah Fitur Baru (Modul Baru)

Setiap fitur baru diikuti pola yang sama di `internal/modules/<nama_fitur>/`:

```
internal/modules/<fitur>/
  domain/
    model.go        # Struct model + request/response
    repository.go   # Interface repository
    service.go      # Interface service
  repository/
    postgres.go     # Implementasi repository dengan PostgreSQL
  service/
    service.go      # Implementasi business logic
  handler/
    handler.go      # HTTP handler (decode request, encode response)
  route/
    route.go        # Pendaftaran route ke router
```

4. Daftarkan route di `internal/bootstrap/bootstrap.go` dalam fungsi `NewApp`:
   ```go
   <fitur>Route.Setup(r, <fitur>Svc, logMiddleware)
   ```

### Menambah Data Baru

Data baru dimasukkan melalui endpoint API yang ada (misalnya `POST /api/v1/users`), atau langsung via SQL untuk keperluan seed development:

```sql
INSERT INTO users (email, password, name, created_at, updated_at)
VALUES ('admin@example.com', '$2a$10$...', 'Admin', NOW(), NOW());
```

**Jangan** langsung edit tabel production via SQL untuk perubahan skema — gunakan migration file agar bisa di-replay di semua environment.

### Menambah Environment Variable Baru

1. Tambahkan ke `.env` dan `.env.example`.
2. Tambahkan ke struct `Config` di `internal/config/config.go`.
3. Tambahkan `viper.SetDefault` dan baca nilainya di fungsi `Load()`.

## Testing

```bash
go test ./... -race -cover
```

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `connection refused` port 5432 | Pastikan Postgres berjalan: `brew services start postgresql@16` |
| `database "alurkasku" does not exist` | Jalankan `createdb alurkasku` |
| `relation "users" does not exist` | Pastikan migration `001_create_users.up.sql` sudah dijalankan |
| Port 8080 sudah dipakai | Ubah `APP_PORT` di `.env` |

## Teknologi

- Go 1.26+
- PostgreSQL 16+
- net/http (bawaan Go)
- Zerolog (logger)
- Viper (config)
- golang-jwt/jwt v5 (JWT)
- bcrypt (password hashing)
- lib/pq (PostgreSQL driver)