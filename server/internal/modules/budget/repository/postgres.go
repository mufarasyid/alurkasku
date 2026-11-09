package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/lib/pq"

	"github.com/mufarasyid/alurkasku/server/internal/modules/budget/domain"
)

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

var ilikeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

// spent is derived from expense transactions in the budget's category within
// the current period window (week / month / year), so it always reflects the
// latest transactions without a stored counter to keep in sync.
const selectBudget = `SELECT b.id, b.user_id, b.name, b.category_id, COALESCE(c.name, ''), b.period, b.limit_amount, COALESCE(SUM(t.amount), 0) AS spent, b.icon, b.created_at, b.updated_at
FROM budgets b
LEFT JOIN categories c ON c.id = b.category_id
LEFT JOIN transactions t ON t.category_id = b.category_id
  AND t.user_id = b.user_id
  AND t.type = 'Expense'
  AND t.occurred_at >= CASE b.period
    WHEN 'Weekly' THEN date_trunc('week', NOW())
    WHEN 'Yearly' THEN date_trunc('year', NOW())
    ELSE date_trunc('month', NOW())
  END
  AND t.occurred_at < CASE b.period
    WHEN 'Weekly' THEN date_trunc('week', NOW()) + INTERVAL '1 week'
    WHEN 'Yearly' THEN date_trunc('year', NOW()) + INTERVAL '1 year'
    ELSE date_trunc('month', NOW()) + INTERVAL '1 month'
  END`

func scanBudget(scan func(dest ...interface{}) error) (domain.Budget, error) {
	b := domain.Budget{}
	err := scan(&b.ID, &b.UserID, &b.Name, &b.CategoryID, &b.Category, &b.Period, &b.Limit, &b.Spent, &b.Icon, &b.CreatedAt, &b.UpdatedAt)
	return b, err
}

func (r *PostgresRepository) Create(b *domain.Budget) error {
	query := `INSERT INTO budgets (user_id, name, category_id, period, limit_amount, spent, icon, created_at, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW()) RETURNING id, created_at, updated_at`
	err := r.db.QueryRow(query, b.UserID, b.Name, b.CategoryID, b.Period, b.Limit, b.Spent, b.Icon).Scan(&b.ID, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return err
	}
	if b.CategoryID != nil {
		return r.db.QueryRow(`SELECT COALESCE(name, '') FROM categories WHERE id = $1`, *b.CategoryID).Scan(&b.Category)
	}
	return nil
}

func (r *PostgresRepository) GetByID(userID, id string) (*domain.Budget, error) {
	row := r.db.QueryRow(selectBudget+` WHERE b.id = $1 AND b.user_id = $2 GROUP BY b.id, c.name`, id, userID)
	b, err := scanBudget(row.Scan)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *PostgresRepository) Update(b *domain.Budget) error {
	query := `UPDATE budgets SET name=$1, category_id=$2, period=$3, limit_amount=$4, spent=$5, icon=$6, updated_at=NOW() WHERE id=$7 AND user_id=$8`
	_, err := r.db.Exec(query, b.Name, b.CategoryID, b.Period, b.Limit, b.Spent, b.Icon, b.ID, b.UserID)
	return err
}

func (r *PostgresRepository) Delete(userID, id string) (int64, error) {
	res, err := r.db.Exec(`DELETE FROM budgets WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

func (r *PostgresRepository) BulkDelete(userID string, ids []string) (int64, error) {
	res, err := r.db.Exec(`DELETE FROM budgets WHERE user_id = $1 AND id = ANY($2::uuid[])`, userID, pq.Array(ids))
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

func (r *PostgresRepository) CountByUser(userID string) (int, error) {
	var count int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM budgets WHERE user_id = $1`, userID).Scan(&count)
	return count, err
}

func budgetsWhere(userID string, filters domain.ListFilters) (string, []interface{}) {
	query := ` WHERE b.user_id = $1`
	args := []interface{}{userID}
	if filters.Period != "" {
		args = append(args, filters.Period)
		query += fmt.Sprintf(` AND b.period = $%d`, len(args))
	}
	if q := strings.TrimSpace(filters.Query); q != "" {
		args = append(args, "%"+ilikeEscaper.Replace(q)+"%")
		query += fmt.Sprintf(` AND (b.name ILIKE $%d OR c.name ILIKE $%d)`, len(args), len(args))
	}
	return query, args
}

func countBudgets(db *sql.DB, where string, args []interface{}) (int64, error) {
	var total int64
	err := db.QueryRow(`SELECT COUNT(*) FROM budgets b LEFT JOIN categories c ON c.id = b.category_id`+where, args...).Scan(&total)
	return total, err
}

func (r *PostgresRepository) ListByUser(userID string, filters domain.ListFilters) ([]domain.Budget, int64, error) {
	where, args := budgetsWhere(userID, filters)
	total, err := countBudgets(r.db, where, args)
	if err != nil {
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
	query := selectBudget + where
	query += ` GROUP BY b.id, c.name ORDER BY b.created_at DESC`
	args = append(args, pageSize, (page-1)*pageSize)
	query += fmt.Sprintf(` LIMIT $%d OFFSET $%d`, len(args)-1, len(args))

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	budgets := []domain.Budget{}
	for rows.Next() {
		b, err := scanBudget(rows.Scan)
		if err != nil {
			return nil, 0, err
		}
		budgets = append(budgets, b)
	}
	return budgets, total, rows.Err()
}
