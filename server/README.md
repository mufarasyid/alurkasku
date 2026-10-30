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
| POST | `/api/v1/users` | Buat user baru |
| GET | `/api/v1/users` | List user (pagination) |
| GET | `/api/v1/users/{id}` | Detail user |
| PUT | `/api/v1/users/{id}` | Update user |
| DELETE | `/api/v1/users/{id}` | Hapus user (soft delete) |

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

Jalankan semua file `.up.sql` di `db/migrations/` secara berurutan:

```bash
psql -h localhost -U postgres -d alurkasku -f db/migrations/001_create_users.up.sql
psql -h localhost -U postgres -d alurkasku -f db/migrations/002_create_refresh_tokens.up.sql
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