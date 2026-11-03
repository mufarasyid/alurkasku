# Catatan Pengembangan — Alurkasku Server

Fokus: `@alurkasku/server/` (internal/modules + db/migrations + README).

---

## 1. Flow yang sudah ada (README + Kode)

**README endpoint (terdokumentasi):**
- Auth: `POST /api/v1/auth/{register,login,refresh,logout}`
- User: `POST/GET/PUT/DELETE /api/v1/users/{id}` + `GET /api/v1/users` (pagination)
- **Subscription: TIDAK ada di README**, tapi sudah di kode (`route/route.go`): `POST/GET/PUT/DELETE /api/v1/subscriptions/{id}` + `GET /api/v1/subscriptions`.

**Arsitektur:** feature-based (`internal/modules/{auth,user,subscription}`) dengan `domain/repository/service/handler/route`. DB PostgreSQL via `lib/pq`, JWT + bcrypt di `platform/security`.

---

## 2. DB yang sudah ada (migrasi berurutan)

| Migrasi | Tabel | Catatan penting |
|---|---|---|
| `001` | `users` | UUID PK, `email` UNIQUE, `password`, `name`, `created_at/updated_at`, `deleted_at` (soft delete). Index email + deleted_at. |
| `002` | `refresh_tokens` | UUID PK, `user_id` FK (CASCADE), `token` UNIQUE, `expires_at`, `created_at`. Index user_id + token. |
| `003` | `users` | `ALTER` tambah `role VARCHAR(20)` DEFAULT `'user'`, constraint `chk_users_role IN ('admin','user')`. Index role. |
| `004` | `subscriptions` | UUID PK, `user_id` FK (ON DELETE CASCADE), `plan` (default `'monthly'`), `status` (default `'active'`), `start_date`, `end_date`, `created_at/updated_at`. **Tidak ada `deleted_at`**. Index user_id. |

---

## 3. Endpoint per Modul vs DB — Cek Kesesuaian

### Auth (`internal/modules/auth/`)
- **Route:** 4 endpoint (register/login/refresh/logout) — sesuai README.
- **DB:** `users` + `refresh_tokens`. Repo `auth/repository/postgres.go` insert/select/delete token dengan `token`, `expires_at`, `created_at`. **Sesuai DB `002`.**
- **Service:** Register membuat `userDomain.User{Role: RoleUser}` (sesuai `003` default). Login cek password + issue token pair. Refresh validasi token di DB lalu issue baru. Logout hapus token dari DB.
- **Status:** ✅ Sesuai DB. Tidak perlu perubahan skema.

### User (`internal/modules/user/`)
- **Route:** 5 endpoint (create/get/update/delete/list) — sesuai README. Semua lewat `authMiddleware`.
- **DB:** `users` (`001` + `003`). Repo handle `deleted_at IS NULL`, `role`, `email` UNIQUE check.
- **Model:** `domain/model.go` ada `Role` (user/admin), `DeletedAt *time.Time`. `CreateUserRequest` **tidak ada field `Role`** (DB default `'user'` → aman). `UpdateUserRequest` juga tidak ada `Role`, tapi repo `Update` set `role = $3` dari `u.Role`; jika user update tanpa kirim role, nil bisa bermasalah — perlu dicek saat request.
- **Status:** ⚠️ Minor: `UpdateUserRequest` belum memfasilitasi update `role`. Jika intinya admin bisa ubah role, perlu ditambahkan. Soft delete sudah benar.

### Subscription (`internal/modules/subscription/`)
- **Route:** 5 endpoint — **belum terdokumentasi di README**.
- **DB:** `subscriptions` (`004`) punya `start_date`, `end_date`. **Model/repo/service mengabaikan 2 kolom ini.**
- **Model (`domain/model.go`):** `Subscription` hanya punya `ID, UserID, Plan, Status, CreatedAt, UpdatedAt`. **Tidak ada `StartDate`, `EndDate`.** `CreateSubscriptionRequest` tidak ada field tanggal.
- **Repo (`repository/postgres.go`):** Insert/select/update hanya `user_id, plan, status, created_at, updated_at`. **`start_date`/`end_date` tidak disertakan.** Update `SET plan, status, updated_at`. Delete hard (tidak ada `deleted_at` di DB, konsisten).
- **Service (`service/service.go`):** `CreateSubscription` cek `user.Role != userDomain.RoleUser` → **hanya `user` boleh, `admin` diblokir** (`Unauthorized`). Ini mungkin tidak sengaja; jika admin harus bisa kelola, perlu diperbaiki.
- **Status:** ❌ Perlu penyelarasan DB ↔ Kode.

---

## 4. Mismatch / Risiko Saat Ini

1. **Subscription DB ↔ Kode:** `start_date` dan `end_date` (kolom `004`) tidak ada di model/repo/handler. Jika aplikasi memerlukan tanggal mulai/berakhir, data akan hilang atau default `NULL` tanpa kontrol.
2. **Subscription akses:** Service membatasi hanya `RoleUser`; admin terblokir. Perlu keputusan: admin boleh atau tidak?
3. **README:** Tidak menyebut `subscription`. Endpoint sudah aktif tapi tidak terdocumentasi.
4. **User Update:** `UpdateUserRequest` tidak punya `Role`; repo tetap update `role`. Jika request tidak kirim role, bisa jadi error atau over-write ke default — perlu validasi.
5. **Subscription Delete:** Hard delete sesuai DB (tidak ada `deleted_at`). Jika ke depan butuh soft delete, harus tambah migrasi `005` + update repo/service/model.
6. **Pagination:** User dan Subscription sudah ada `page/pageSize`. Pastikan parameter query (`?page=` / `?page_size=`) konsisten antara handler.

---

## 5. Note Pengembangan Fitur Selanjutnya

### A. Perbaikan Segera (sebelum fitur baru)
- [ ] **Sesuaikan Subscription dengan DB `004`:** Tambah `StartDate`, `EndDate` ke `domain/model`, `CreateSubscriptionRequest`, `UpdateSubscriptionRequest`, repo (insert/select/update), dan response.
- [ ] **Keputusan akses subscription:** Ubah `service/service.go` (cek `user.Role`) jika admin harus bisa kelola; atau tambahkan middleware role-based jika perlu.
- [ ] **Update README:** Tambah tabel endpoint subscription + penjelasan `start_date`/`end_date`.
- [ ] **User Update Role:** Tambah `Role` ke `UpdateUserRequest` (dengan validasi `ValidRole`) jika admin boleh ubah; atau pastikan repo tidak over-write jika tidak dikirim.
- [ ] **Test endpoint subscription:** Belum terlihat test khusus subscription; tambahkan unit/integration test setelah model/repo selaras.

### B. Fitur Berikutnya (rekomendasi urutan)
1. **Billing / Pembayaran** → Tabel baru `payments` (migrasi `005`) dengan `subscription_id` FK, `amount`, `method`, `status`, `paid_at`. Integrasi dengan `subscriptions.end_date` untuk auto-renew / expire.
2. **Notifikasi / Email** → Modul `notification` atau `email` (domain + repo + handler) untuk remi berakhir / pembayaran berhasil. Bisa pakai `users.email` yang sudah ada.
3. **Audit Log** → Tabel `audit_logs` (`user_id`, `action`, `table_name`, `record_id`, `ip`, `created_at`) untuk tracking perubahan user/subscription.
4. **Role-based Middleware / Admin Endpoint** → Endpoint khusus untuk `admin` (misal `GET /api/v1/admin/users`, `GET /api/v1/admin/subscriptions`) dengan middleware cek `role == 'admin'`.
5. **Subscription Soft Delete / Archive** → Jika butuh, tambah `deleted_at` ke `subscriptions` (migrasi `005_down` = drop; `005_up` = alter + index) dan sesuaikan repo.
6. **Dokumentasi OpenAPI / Swagger** → Buat `docs/swagger.yaml` atau gunakan `go-swagger` agar endpoint auth/user/subscription terdokumentasi otomatis.

### C. Bahan Mentah DB
- `users` sudah siap untuk `role`, `deleted_at`.
- `refresh_tokens` siap untuk rotasi/token baru.
- `subscriptions` siap untuk `plan`/`status`; hanya perlu **memperbaiki model/repo** agar `start_date`/`end_date` aktif, lalu tambah `payments` jika billing masuk.

---

**Ringkasan 1 baris:** Auth dan User sudah sinkron dengan DB; **Subscription butuh penyelarasan model/repo dengan `start_date`/`end_date` dan keputusan akses admin** sebelum fitur billing/notifikasi dibangun.
