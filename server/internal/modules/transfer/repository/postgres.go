package repository

import (
	"database/sql"
	"fmt"

	"github.com/mufarasyid/alurkasku/server/internal/modules/transfer/domain"
)

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

const selectTransfer = `SELECT t.id, t.user_id, t.kind, t.from_account_id, fa.name, t.to_account_id, ta.name, t.amount, t.fee, t.note, t.occurred_at, t.created_at, t.updated_at
FROM transfers t JOIN accounts fa ON fa.id = t.from_account_id
JOIN accounts ta ON ta.id = t.to_account_id`

func scanTransfer(scan func(dest ...interface{}) error) (domain.Transfer, error) {
	t := domain.Transfer{}
	err := scan(&t.ID, &t.UserID, &t.Kind, &t.FromAccountID, &t.FromAccount, &t.ToAccountID, &t.ToAccount, &t.Amount, &t.Fee, &t.Note, &t.OccurredAt, &t.CreatedAt, &t.UpdatedAt)
	return t, err
}

func (r *PostgresRepository) Create(t *domain.Transfer) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `INSERT INTO transfers (user_id, kind, from_account_id, to_account_id, amount, fee, note, occurred_at, created_at, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW()) RETURNING id, created_at, updated_at`
	if err := tx.QueryRow(query, t.UserID, t.Kind, t.FromAccountID, t.ToAccountID, t.Amount, t.Fee, t.Note, t.OccurredAt).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt); err != nil {
		return err
	}

	res, err := tx.Exec(`UPDATE accounts SET balance = balance - $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`, t.Amount+t.Fee, t.FromAccountID, t.UserID)
	if err != nil {
		return err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return fmt.Errorf("source account not found")
	}

	res, err = tx.Exec(`UPDATE accounts SET balance = balance + $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`, t.Amount, t.ToAccountID, t.UserID)
	if err != nil {
		return err
	}
	affected, err = res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return fmt.Errorf("destination account not found")
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	row := r.db.QueryRow(selectTransfer+` WHERE t.id = $1`, t.ID)
	created, err := scanTransfer(row.Scan)
	if err != nil {
		*t = domain.Transfer{ID: t.ID, UserID: t.UserID, Kind: t.Kind, FromAccountID: t.FromAccountID, ToAccountID: t.ToAccountID, Amount: t.Amount, Fee: t.Fee, Note: t.Note, OccurredAt: t.OccurredAt, CreatedAt: t.CreatedAt, UpdatedAt: t.UpdatedAt}
		return nil
	}
	*t = created
	return nil
}

func (r *PostgresRepository) ListByUser(userID, kind string, limit, offset int) ([]domain.Transfer, int64, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	var total int64
	if err := r.db.QueryRow(`SELECT COUNT(*) FROM transfers WHERE user_id = $1 AND kind = $2`, userID, kind).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.db.Query(selectTransfer+` WHERE t.user_id = $1 AND t.kind = $2 ORDER BY t.occurred_at DESC LIMIT $3 OFFSET $4`, userID, kind, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	transfers := []domain.Transfer{}
	for rows.Next() {
		t, err := scanTransfer(rows.Scan)
		if err != nil {
			return nil, 0, err
		}
		transfers = append(transfers, t)
	}
	return transfers, total, rows.Err()
}
