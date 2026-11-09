package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/lib/pq"

	"github.com/mufarasyid/alurkasku/server/internal/modules/category/domain"
)

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

var ilikeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

func (r *PostgresRepository) Create(c *domain.Category) error {
	query := `INSERT INTO categories (user_id, name, type, icon, created_at, updated_at) VALUES ($1,$2,$3,$4,NOW(),NOW()) RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query, c.UserID, c.Name, c.Type, c.Icon).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)
}

func (r *PostgresRepository) GetByID(userID, id string) (*domain.Category, error) {
	query := `SELECT id, user_id, name, type, icon, created_at, updated_at FROM categories WHERE id = $1 AND user_id = $2`
	c := &domain.Category{}
	err := r.db.QueryRow(query, id, userID).Scan(&c.ID, &c.UserID, &c.Name, &c.Type, &c.Icon, &c.CreatedAt, &c.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return c, err
}

func (r *PostgresRepository) Update(c *domain.Category) error {
	query := `UPDATE categories SET name=$1, type=$2, icon=$3, updated_at=NOW() WHERE id=$4 AND user_id=$5`
	_, err := r.db.Exec(query, c.Name, c.Type, c.Icon, c.ID, c.UserID)
	return err
}

func (r *PostgresRepository) Delete(userID, id string) (int64, error) {
	res, err := r.db.Exec(`DELETE FROM categories WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

func (r *PostgresRepository) BulkDelete(userID string, ids []string) (int64, error) {
	res, err := r.db.Exec(`DELETE FROM categories WHERE user_id = $1 AND id = ANY($2::uuid[])`, userID, pq.Array(ids))
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

func (r *PostgresRepository) ListByUser(userID string, filters domain.ListFilters) ([]domain.Category, int64, error) {
	where := ` WHERE user_id = $1`
	args := []interface{}{userID}
	if filters.Type != "" {
		args = append(args, filters.Type)
		where += fmt.Sprintf(` AND type = $%d`, len(args))
	}
	if q := strings.TrimSpace(filters.Query); q != "" {
		args = append(args, "%"+ilikeEscaper.Replace(q)+"%")
		where += fmt.Sprintf(` AND name ILIKE $%d`, len(args))
	}

	var total int64
	if err := r.db.QueryRow(`SELECT COUNT(*) FROM categories`+where, args...).Scan(&total); err != nil {
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
	query := `SELECT id, user_id, name, type, icon, created_at, updated_at FROM categories` + where
	query += ` ORDER BY created_at DESC`
	args = append(args, pageSize, (page-1)*pageSize)
	query += fmt.Sprintf(` LIMIT $%d OFFSET $%d`, len(args)-1, len(args))

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	categories := []domain.Category{}
	for rows.Next() {
		c := domain.Category{}
		if err := rows.Scan(&c.ID, &c.UserID, &c.Name, &c.Type, &c.Icon, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, 0, err
		}
		categories = append(categories, c)
	}
	return categories, total, rows.Err()
}

func (r *PostgresRepository) CountByUser(userID string) (int, error) {
	var total int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM categories WHERE user_id = $1`, userID).Scan(&total)
	return total, err
}
