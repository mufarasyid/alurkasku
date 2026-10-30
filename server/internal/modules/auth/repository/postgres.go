package repository

import (
	"database/sql"

	"github.com/mufarasyid/alurkasku/server/internal/modules/auth/domain"
)

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) Create(token *domain.RefreshToken) error {
	query := `
		INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
		VALUES ($1, $2, $3, NOW())
		RETURNING id, created_at`
	return r.db.QueryRow(query, token.UserID, token.Token, token.ExpiresAt).Scan(&token.ID, &token.CreatedAt)
}

func (r *PostgresRepository) GetByToken(token string) (*domain.RefreshToken, error) {
	query := `SELECT id, user_id, token, expires_at, created_at FROM refresh_tokens WHERE token = $1`
	t := &domain.RefreshToken{}
	err := r.db.QueryRow(query, token).Scan(&t.ID, &t.UserID, &t.Token, &t.ExpiresAt, &t.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return t, nil
}

func (r *PostgresRepository) Delete(token string) error {
	_, err := r.db.Exec(`DELETE FROM refresh_tokens WHERE token = $1`, token)
	return err
}

func (r *PostgresRepository) DeleteByUserID(userID uint64) error {
	_, err := r.db.Exec(`DELETE FROM refresh_tokens WHERE user_id = $1`, userID)
	return err
}
