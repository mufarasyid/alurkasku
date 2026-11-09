package repository

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/mufarasyid/alurkasku/server/internal/modules/transaction/domain"
)

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

var ilikeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

const selectTransaction = `SELECT t.id, t.user_id, t.account_id, a.name, t.category_id, COALESCE(c.name, ''), COALESCE(c.icon, ''), t.type, t.amount, t.note, t.occurred_at, t.created_at, t.updated_at
FROM transactions t JOIN accounts a ON a.id = t.account_id
LEFT JOIN categories c ON c.id = t.category_id`

func scanTransaction(scan func(dest ...interface{}) error) (domain.Transaction, error) {
	t := domain.Transaction{}
	err := scan(&t.ID, &t.UserID, &t.AccountID, &t.Account, &t.CategoryID, &t.Category, &t.CategoryIcon, &t.Type, &t.Amount, &t.Note, &t.OccurredAt, &t.CreatedAt, &t.UpdatedAt)
	return t, err
}

func (r *PostgresRepository) Create(t *domain.Transaction) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `INSERT INTO transactions (user_id, account_id, category_id, type, amount, note, occurred_at, created_at, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW()) RETURNING id, created_at, updated_at`
	if err := tx.QueryRow(query, t.UserID, t.AccountID, t.CategoryID, t.Type, t.Amount, t.Note, t.OccurredAt).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt); err != nil {
		return err
	}

	delta := t.Amount
	if t.Type == domain.TypeExpense {
		delta = -t.Amount
	}
	res, err := tx.Exec(`UPDATE accounts SET balance = balance + $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`, delta, t.AccountID, t.UserID)
	if err != nil {
		return err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return fmt.Errorf("account not found")
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	if created, err := r.GetByID(t.UserID, t.ID); err == nil && created != nil {
		t.Account = created.Account
		t.Category = created.Category
		t.CategoryIcon = created.CategoryIcon
	}
	return nil
}

func (r *PostgresRepository) GetByID(userID, id string) (*domain.Transaction, error) {
	row := r.db.QueryRow(selectTransaction+` WHERE t.id = $1 AND t.user_id = $2`, id, userID)
	t, err := scanTransaction(row.Scan)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *PostgresRepository) List(userID string, filters domain.ListFilters) ([]domain.Transaction, int64, error) {
	where := ` WHERE t.user_id = $1`
	args := []interface{}{userID}
	if filters.Type != "" {
		args = append(args, filters.Type)
		where += fmt.Sprintf(` AND t.type = $%d`, len(args))
	}
	if q := strings.TrimSpace(filters.Query); q != "" {
		args = append(args, "%"+ilikeEscaper.Replace(q)+"%")
		where += fmt.Sprintf(` AND (t.note ILIKE $%d OR c.name ILIKE $%d OR a.name ILIKE $%d)`, len(args), len(args), len(args))
	}
	if filters.From != nil {
		args = append(args, *filters.From)
		where += fmt.Sprintf(` AND t.occurred_at >= $%d`, len(args))
	}
	if filters.To != nil {
		args = append(args, *filters.To)
		where += fmt.Sprintf(` AND t.occurred_at < $%d`, len(args))
	}

	countQuery := `SELECT COUNT(*) FROM transactions t
		LEFT JOIN categories c ON c.id = t.category_id
		LEFT JOIN accounts a ON a.id = t.account_id` + where
	var total int64
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	page := filters.Page
	if page < 1 {
		page = 1
	}
	pageSize := filters.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	query := selectTransaction + where
	query += ` ORDER BY t.occurred_at DESC`
	args = append(args, pageSize, (page-1)*pageSize)
	query += fmt.Sprintf(` LIMIT $%d OFFSET $%d`, len(args)-1, len(args))

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	transactions := []domain.Transaction{}
	for rows.Next() {
		t, err := scanTransaction(rows.Scan)
		if err != nil {
			return nil, 0, err
		}
		transactions = append(transactions, t)
	}
	return transactions, total, rows.Err()
}

func (r *PostgresRepository) SumBetween(userID string, from, to time.Time) (domain.Sums, error) {
	var s domain.Sums
	query := `SELECT
		COALESCE(SUM(amount) FILTER (WHERE type = 'Income'), 0),
		COALESCE(SUM(amount) FILTER (WHERE type = 'Expense'), 0),
		COUNT(*) FILTER (WHERE type = 'Income'),
		COUNT(*) FILTER (WHERE type = 'Expense'),
		COUNT(*)
	FROM transactions WHERE user_id = $1 AND occurred_at >= $2 AND occurred_at < $3`
	err := r.db.QueryRow(query, userID, from, to).Scan(&s.Income, &s.Expense, &s.IncomeCount, &s.ExpenseCount, &s.Count)
	return s, err
}

func (r *PostgresRepository) Breakdown(userID string, from, to time.Time, limit int) ([]domain.CategorySum, error) {
	if limit <= 0 {
		limit = 5
	}
	query := `SELECT COALESCE(c.name, 'Uncategorized'), COALESCE(c.icon, 'Tag'), SUM(t.amount)
FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
WHERE t.user_id = $1 AND t.type = 'Expense' AND t.occurred_at >= $2 AND t.occurred_at < $3
GROUP BY 1, 2 ORDER BY 3 DESC LIMIT $4`
	rows, err := r.db.Query(query, userID, from, to, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	sums := []domain.CategorySum{}
	for rows.Next() {
		var s domain.CategorySum
		if err := rows.Scan(&s.Category, &s.Icon, &s.Amount); err != nil {
			return nil, err
		}
		sums = append(sums, s)
	}
	return sums, rows.Err()
}
