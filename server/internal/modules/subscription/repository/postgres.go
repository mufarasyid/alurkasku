package repository

import (
	"database/sql"

	"github.com/mufarasyid/alurkasku/server/internal/modules/subscription/domain"
)

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) Create(sub *domain.Subscription) error {
	query := `INSERT INTO subscriptions (user_id, plan, status, start_date, end_date, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW()) RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query, sub.UserID, sub.Plan, sub.Status, sub.StartDate, sub.EndDate).Scan(&sub.ID, &sub.CreatedAt, &sub.UpdatedAt)
}

func (r *PostgresRepository) GetByID(id string) (*domain.Subscription, error) {
	query := `SELECT id, user_id, plan, status, start_date, end_date, created_at, updated_at FROM subscriptions WHERE id = $1`
	s := &domain.Subscription{}
	err := r.db.QueryRow(query, id).Scan(&s.ID, &s.UserID, &s.Plan, &s.Status, &s.StartDate, &s.EndDate, &s.CreatedAt, &s.UpdatedAt)
	if err == sql.ErrNoRows { return nil, nil }
	return s, err
}

func (r *PostgresRepository) GetByUserID(userID string) (*domain.Subscription, error) {
	query := `SELECT id, user_id, plan, status, start_date, end_date, created_at, updated_at FROM subscriptions WHERE user_id = $1`
	s := &domain.Subscription{}
	err := r.db.QueryRow(query, userID).Scan(&s.ID, &s.UserID, &s.Plan, &s.Status, &s.StartDate, &s.EndDate, &s.CreatedAt, &s.UpdatedAt)
	if err == sql.ErrNoRows { return nil, nil }
	return s, err
}

func (r *PostgresRepository) Update(sub *domain.Subscription) error {
	query := `UPDATE subscriptions SET plan=$1, status=$2, start_date=$3, end_date=$4, updated_at=NOW() WHERE id=$5`
	_, err := r.db.Exec(query, sub.Plan, sub.Status, sub.StartDate, sub.EndDate, sub.ID)
	return err
}

func (r *PostgresRepository) Delete(id string) error {
	_, err := r.db.Exec(`DELETE FROM subscriptions WHERE id=$1`, id)
	return err
}

func (r *PostgresRepository) List(page, pageSize int) ([]domain.Subscription, int, error) {
	query := `SELECT id, user_id, plan, status, start_date, end_date, created_at, updated_at FROM subscriptions ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	rows, err := r.db.Query(query, pageSize, (page-1)*pageSize)
	if err != nil { return nil, 0, err }
	defer rows.Close()

	subs := []domain.Subscription{}
	for rows.Next() {
		s := domain.Subscription{}
		rows.Scan(&s.ID, &s.UserID, &s.Plan, &s.Status, &s.StartDate, &s.EndDate, &s.CreatedAt, &s.UpdatedAt)
		subs = append(subs, s)
	}

	var total int
	r.db.QueryRow(`SELECT COUNT(*) FROM subscriptions`).Scan(&total)
	return subs, total, nil
}

func (r *PostgresRepository) ListByUser(userID string) ([]domain.Subscription, error) {
	query := `SELECT id, user_id, plan, status, start_date, end_date, created_at, updated_at FROM subscriptions WHERE user_id = $1`
	rows, err := r.db.Query(query, userID)
	if err != nil { return nil, err }
	defer rows.Close()

	subs := []domain.Subscription{}
	for rows.Next() {
		s := domain.Subscription{}
		rows.Scan(&s.ID, &s.UserID, &s.Plan, &s.Status, &s.StartDate, &s.EndDate, &s.CreatedAt, &s.UpdatedAt)
		subs = append(subs, s)
	}
	return subs, nil
}
