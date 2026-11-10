package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/mufarasyid/alurkasku/server/internal/modules/user/domain"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
)

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) Create(u *domain.User) error {
	query := `
		INSERT INTO users (email, password, name, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query, u.Email, u.Password, u.Name, u.Role).Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
}

func (r *PostgresRepository) GetByID(id string) (*domain.User, error) {
	query := `SELECT id, email, password, name, role, payday_day, created_at, updated_at, deleted_at FROM users WHERE id = $1 AND deleted_at IS NULL`
	u := &domain.User{}
	err := r.db.QueryRow(query, id).Scan(&u.ID, &u.Email, &u.Password, &u.Name, &u.Role, &u.PaydayDay, &u.CreatedAt, &u.UpdatedAt, &u.DeletedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *PostgresRepository) GetByEmail(email string) (*domain.User, error) {
	query := `SELECT id, email, password, name, role, payday_day, created_at, updated_at, deleted_at FROM users WHERE email = $1 AND deleted_at IS NULL`
	u := &domain.User{}
	err := r.db.QueryRow(query, email).Scan(&u.ID, &u.Email, &u.Password, &u.Name, &u.Role, &u.PaydayDay, &u.CreatedAt, &u.UpdatedAt, &u.DeletedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *PostgresRepository) Update(u *domain.User) error {
	query := `
		UPDATE users
		SET email = $1, name = $2, role = $3, payday_day = $4, updated_at = NOW()
		WHERE id = $5 AND deleted_at IS NULL
		RETURNING updated_at`
	return r.db.QueryRow(query, u.Email, u.Name, u.Role, u.PaydayDay, u.ID).Scan(&u.UpdatedAt)
}

func (r *PostgresRepository) Delete(id string) error {
	query := `UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return apperror.NotFound("user not found")
	}
	return nil
}

func (r *PostgresRepository) List(offset, limit int, filters domain.ListFilters) ([]domain.User, int64, error) {
	where := "WHERE deleted_at IS NULL"
	args := make([]interface{}, 0, 3)

	if role := strings.TrimSpace(filters.Role); role != "" {
		if !domain.ValidRole(role) {
			return nil, 0, apperror.BadRequest("invalid role filter")
		}
		args = append(args, role)
		where += fmt.Sprintf(" AND role = $%d", len(args))
	}
	if q := strings.TrimSpace(filters.Query); q != "" {
		args = append(args, q)
		where += fmt.Sprintf(" AND (name ILIKE '%%' || $%d || '%%' OR email ILIKE '%%' || $%d || '%%')", len(args), len(args))
	}

	var total int64
	countQuery := "SELECT COUNT(*) FROM users " + where
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	args = append(args, limit, offset)
	query := `
		SELECT id, email, password, name, role, payday_day, created_at, updated_at, deleted_at
		FROM users
		` + where + fmt.Sprintf(`
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d`, len(args)-1, len(args))
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.Email, &u.Password, &u.Name, &u.Role, &u.PaydayDay, &u.CreatedAt, &u.UpdatedAt, &u.DeletedAt); err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}
	return users, total, rows.Err()
}

// Compile-time check
var _ domain.UserRepository = (*PostgresRepository)(nil)
