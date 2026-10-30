package repository

import (
	"database/sql"
	"fmt"

	"github.com/mufarasyid/alurkasku/server/internal/modules/user/domain"
)

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) Create(u *domain.User) error {
	query := `
		INSERT INTO users (email, password, name, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query, u.Email, u.Password, u.Name).Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
}

func (r *PostgresRepository) GetByID(id uint64) (*domain.User, error) {
	query := `SELECT id, email, password, name, created_at, updated_at, deleted_at FROM users WHERE id = $1 AND deleted_at IS NULL`
	u := &domain.User{}
	err := r.db.QueryRow(query, id).Scan(&u.ID, &u.Email, &u.Password, &u.Name, &u.CreatedAt, &u.UpdatedAt, &u.DeletedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *PostgresRepository) GetByEmail(email string) (*domain.User, error) {
	query := `SELECT id, email, password, name, created_at, updated_at, deleted_at FROM users WHERE email = $1 AND deleted_at IS NULL`
	u := &domain.User{}
	err := r.db.QueryRow(query, email).Scan(&u.ID, &u.Email, &u.Password, &u.Name, &u.CreatedAt, &u.UpdatedAt, &u.DeletedAt)
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
		SET email = $1, name = $2, updated_at = NOW()
		WHERE id = $3 AND deleted_at IS NULL
		RETURNING updated_at`
	return r.db.QueryRow(query, u.Email, u.Name, u.ID).Scan(&u.UpdatedAt)
}

func (r *PostgresRepository) Delete(id uint64) error {
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
		return fmt.Errorf("user not found")
	}
	return nil
}

func (r *PostgresRepository) List(offset, limit int) ([]domain.User, int64, error) {
	var total int64
	if err := r.db.QueryRow("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL").Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `
		SELECT id, email, password, name, created_at, updated_at, deleted_at
		FROM users
		WHERE deleted_at IS NULL
		ORDER BY id
		LIMIT $1 OFFSET $2`
	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.Email, &u.Password, &u.Name, &u.CreatedAt, &u.UpdatedAt, &u.DeletedAt); err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}
	return users, total, rows.Err()
}

// Compile-time check
var _ domain.UserRepository = (*PostgresRepository)(nil)
