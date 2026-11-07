package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/lib/pq"

	"github.com/mufarasyid/alurkasku/server/internal/modules/account/domain"
)

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

var ilikeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

func (r *PostgresRepository) Create(a *domain.Account) error {
	query := `INSERT INTO accounts (user_id, name, type, detail, balance, icon, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query, a.UserID, a.Name, a.Type, a.Detail, a.Balance, a.Icon).Scan(&a.ID, &a.CreatedAt, &a.UpdatedAt)
}

func (r *PostgresRepository) GetByID(userID, id string) (*domain.Account, error) {
	query := `SELECT id, user_id, name, type, detail, balance, icon, created_at, updated_at FROM accounts WHERE id = $1 AND user_id = $2`
	a := &domain.Account{}
	err := r.db.QueryRow(query, id, userID).Scan(&a.ID, &a.UserID, &a.Name, &a.Type, &a.Detail, &a.Balance, &a.Icon, &a.CreatedAt, &a.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return a, err
}

func (r *PostgresRepository) Update(a *domain.Account) error {
	query := `UPDATE accounts SET name=$1, type=$2, detail=$3, balance=$4, icon=$5, updated_at=NOW() WHERE id=$6 AND user_id=$7`
	_, err := r.db.Exec(query, a.Name, a.Type, a.Detail, a.Balance, a.Icon, a.ID, a.UserID)
	return err
}

func (r *PostgresRepository) Delete(userID, id string) (int64, error) {
	res, err := r.db.Exec(`DELETE FROM accounts WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

func (r *PostgresRepository) BulkDelete(userID string, ids []string) (int64, error) {
	res, err := r.db.Exec(`DELETE FROM accounts WHERE user_id = $1 AND id = ANY($2::uuid[])`, userID, pq.Array(ids))
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

func (r *PostgresRepository) ListByUser(userID string, filters domain.ListFilters) ([]domain.Account, error) {
	query := `SELECT id, user_id, name, type, detail, balance, icon, created_at, updated_at FROM accounts WHERE user_id = $1`
	args := []interface{}{userID}
	if filters.Type != "" {
		args = append(args, filters.Type)
		query += fmt.Sprintf(` AND type = $%d`, len(args))
	}
	if q := strings.TrimSpace(filters.Query); q != "" {
		args = append(args, "%"+ilikeEscaper.Replace(q)+"%")
		query += fmt.Sprintf(` AND (name ILIKE $%d OR detail ILIKE $%d)`, len(args), len(args))
	}
	query += ` ORDER BY created_at DESC`

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	accounts := []domain.Account{}
	for rows.Next() {
		a := domain.Account{}
		if err := rows.Scan(&a.ID, &a.UserID, &a.Name, &a.Type, &a.Detail, &a.Balance, &a.Icon, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		accounts = append(accounts, a)
	}
	return accounts, rows.Err()
}
