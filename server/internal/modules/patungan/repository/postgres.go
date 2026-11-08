package repository

import (
	"database/sql"
	"strings"

	"github.com/mufarasyid/alurkasku/server/internal/modules/patungan/domain"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
)

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func isDuplicate(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505")
}

const selectGroup = `SELECT g.id, g.creator_user_id, g.name, g.note, g.created_at, g.updated_at,
		COALESCE((SELECT COUNT(*) FROM patungan_participants p WHERE p.group_id = g.id), 0) AS member_count,
		COALESCE((SELECT SUM(total_amount) FROM patungan_expenses e WHERE e.group_id = g.id), 0) AS total_expense
	FROM patungan_groups g`

func scanGroup(scan func(dest ...interface{}) error) (domain.Group, error) {
	var g domain.Group
	err := scan(&g.ID, &g.CreatorUserID, &g.Name, &g.Note, &g.CreatedAt, &g.UpdatedAt, &g.MemberCount, &g.TotalExpense)
	return g, err
}

func (r *PostgresRepository) CreateGroup(g *domain.Group, members []domain.Participant) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if err := tx.QueryRow(
		`INSERT INTO patungan_groups (creator_user_id, name, note, created_at, updated_at)
		 VALUES ($1,$2,$3,NOW(),NOW()) RETURNING id, created_at, updated_at`,
		g.CreatorUserID, g.Name, g.Note,
	).Scan(&g.ID, &g.CreatedAt, &g.UpdatedAt); err != nil {
		return err
	}

	for _, m := range members {
		m.GroupID = g.ID
		if err := tx.QueryRow(
			`INSERT INTO patungan_participants (group_id, display_name, linked_user_id, created_at, updated_at)
			 VALUES ($1,$2,$3,NOW(),NOW()) RETURNING id, created_at`,
			m.GroupID, m.DisplayName, m.LinkedUserID,
		).Scan(&m.ID, &m.CreatedAt); err != nil {
			if isDuplicate(err) {
				return apperror.Conflict("participant name already exists in this group")
			}
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	row := r.db.QueryRow(selectGroup+` WHERE g.id = $1`, g.ID)
	created, err := scanGroup(row.Scan)
	if err != nil {
		return nil
	}
	*g = created
	return nil
}

func (r *PostgresRepository) ListGroups(userID string) ([]domain.Group, error) {
	rows, err := r.db.Query(selectGroup+` WHERE g.creator_user_id = $1
		OR EXISTS (SELECT 1 FROM patungan_participants p WHERE p.group_id = g.id AND p.linked_user_id = $1)
		ORDER BY g.updated_at DESC LIMIT 100`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var groups []domain.Group
	for rows.Next() {
		g, err := scanGroup(rows.Scan)
		if err != nil {
			return nil, err
		}
		groups = append(groups, g)
	}
	return groups, rows.Err()
}

func (r *PostgresRepository) GetGroup(userID, groupID string) (*domain.Group, error) {
	row := r.db.QueryRow(selectGroup+` WHERE g.id = $1 AND (g.creator_user_id = $2
		OR EXISTS (SELECT 1 FROM patungan_participants p WHERE p.group_id = g.id AND p.linked_user_id = $2))`, groupID, userID)
	g, err := scanGroup(row.Scan)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func (r *PostgresRepository) UpdateGroup(userID, groupID, name, note string) (*domain.Group, error) {
	res, err := r.db.Exec(`UPDATE patungan_groups SET name = $1, note = $2, updated_at = NOW() WHERE id = $3 AND creator_user_id = $4`, name, note, groupID, userID)
	if err != nil {
		return nil, err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return nil, err
	}
	if affected == 0 {
		return nil, apperror.NotFound("group not found")
	}
	return r.GetGroup(userID, groupID)
}

func (r *PostgresRepository) DeleteGroup(userID, groupID string) error {
	res, err := r.db.Exec(`DELETE FROM patungan_groups WHERE id = $1 AND creator_user_id = $2`, groupID, userID)
	if err != nil {
		return err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return apperror.NotFound("group not found")
	}
	return nil
}

const selectParticipant = `SELECT id, group_id, display_name, linked_user_id, created_at FROM patungan_participants`

func scanParticipant(scan func(dest ...interface{}) error) (domain.Participant, error) {
	var p domain.Participant
	err := scan(&p.ID, &p.GroupID, &p.DisplayName, &p.LinkedUserID, &p.CreatedAt)
	return p, err
}

func (r *PostgresRepository) ListParticipants(groupID string) ([]domain.Participant, error) {
	rows, err := r.db.Query(selectParticipant+` WHERE group_id = $1 ORDER BY created_at ASC`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.Participant
	for rows.Next() {
		p, err := scanParticipant(rows.Scan)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (r *PostgresRepository) GetParticipant(groupID, memberID string) (*domain.Participant, error) {
	row := r.db.QueryRow(selectParticipant+` WHERE group_id = $1 AND id = $2`, groupID, memberID)
	p, err := scanParticipant(row.Scan)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PostgresRepository) AddParticipant(p *domain.Participant) error {
	if err := r.db.QueryRow(
		`INSERT INTO patungan_participants (group_id, display_name, linked_user_id, created_at, updated_at)
		 VALUES ($1,$2,$3,NOW(),NOW()) RETURNING id, created_at`,
		p.GroupID, p.DisplayName, p.LinkedUserID,
	).Scan(&p.ID, &p.CreatedAt); err != nil {
		if isDuplicate(err) {
			return apperror.Conflict("participant name already exists in this group")
		}
		return err
	}
	return nil
}

func (r *PostgresRepository) DeleteParticipant(groupID, memberID string) error {
	res, err := r.db.Exec(`DELETE FROM patungan_participants WHERE group_id = $1 AND id = $2`, groupID, memberID)
	if err != nil {
		return err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return apperror.NotFound("participant not found")
	}
	return nil
}

func (r *PostgresRepository) LinkParticipant(groupID, memberID, linkedUserID string) (*domain.Participant, error) {
	if err := r.db.QueryRow(
		`UPDATE patungan_participants SET linked_user_id = $1, updated_at = NOW()
		 WHERE group_id = $2 AND id = $3 RETURNING id`, linkedUserID, groupID, memberID,
	).Scan(new(string)); err != nil {
		if err == sql.ErrNoRows {
			return nil, apperror.NotFound("participant not found")
		}
		if isDuplicate(err) {
			return nil, apperror.Conflict("this account is already a participant in this group")
		}
		return nil, err
	}
	return r.GetParticipant(groupID, memberID)
}

const selectExpense = `SELECT e.id, e.group_id, e.payer_member_id, pm.display_name, e.created_by_user_id, e.category_id, e.total_amount, e.note, e.occurred_at, e.created_at, e.updated_at
	FROM patungan_expenses e JOIN patungan_participants pm ON pm.id = e.payer_member_id`

func scanExpense(row *sql.Row) (domain.Expense, error) {
	var e domain.Expense
	err := row.Scan(&e.ID, &e.GroupID, &e.PayerMemberID, &e.PayerName, &e.CreatedByUserID, &e.CategoryID, &e.TotalAmount, &e.Note, &e.OccurredAt, &e.CreatedAt, &e.UpdatedAt)
	return e, err
}

func (r *PostgresRepository) loadSplits(e *domain.Expense) error {
	rows, err := r.db.Query(`SELECT s.expense_id, s.member_id, p.display_name, s.share_amount
		FROM patungan_splits s JOIN patungan_participants p ON p.id = s.member_id
		WHERE s.expense_id = $1 ORDER BY p.created_at ASC`, e.ID)
	if err != nil {
		return err
	}
	defer rows.Close()
	e.Splits = []domain.Split{}
	for rows.Next() {
		var s domain.Split
		if err := rows.Scan(&s.ExpenseID, &s.MemberID, &s.MemberName, &s.ShareAmount); err != nil {
			return err
		}
		e.Splits = append(e.Splits, s)
	}
	return rows.Err()
}

func (r *PostgresRepository) CreateExpense(e *domain.Expense, splits []domain.Split) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if err := tx.QueryRow(
		`INSERT INTO patungan_expenses (group_id, payer_member_id, created_by_user_id, category_id, total_amount, note, occurred_at, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW()) RETURNING id, created_at, updated_at`,
		e.GroupID, e.PayerMemberID, e.CreatedByUserID, e.CategoryID, e.TotalAmount, e.Note, e.OccurredAt,
	).Scan(&e.ID, &e.CreatedAt, &e.UpdatedAt); err != nil {
		return err
	}
	for _, s := range splits {
		s.ExpenseID = e.ID
		if _, err := tx.Exec(`INSERT INTO patungan_splits (expense_id, member_id, share_amount) VALUES ($1,$2,$3)`, s.ExpenseID, s.MemberID, s.ShareAmount); err != nil {
			return err
		}
	}
	if _, err := tx.Exec(`UPDATE patungan_groups SET updated_at = NOW() WHERE id = $1`, e.GroupID); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	row := r.db.QueryRow(selectExpense+` WHERE e.id = $1`, e.ID)
	created, err := scanExpense(row)
	if err != nil {
		return nil
	}
	*e = created
	return r.loadSplits(e)
}

func (r *PostgresRepository) ListExpenses(groupID string) ([]domain.Expense, error) {
	rows, err := r.db.Query(selectExpense+` WHERE e.group_id = $1 ORDER BY e.occurred_at DESC, e.created_at DESC LIMIT 100`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.Expense
	for rows.Next() {
		var e domain.Expense
		if err := rows.Scan(&e.ID, &e.GroupID, &e.PayerMemberID, &e.PayerName, &e.CreatedByUserID, &e.CategoryID, &e.TotalAmount, &e.Note, &e.OccurredAt, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	for i := range out {
		if err := r.loadSplits(&out[i]); err != nil {
			return nil, err
		}
	}
	return out, nil
}

func (r *PostgresRepository) GetExpense(groupID, expenseID string) (*domain.Expense, error) {
	row := r.db.QueryRow(selectExpense+` WHERE e.group_id = $1 AND e.id = $2`, groupID, expenseID)
	e, err := scanExpense(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if err := r.loadSplits(&e); err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *PostgresRepository) DeleteExpense(groupID, expenseID string) error {
	res, err := r.db.Exec(`DELETE FROM patungan_expenses WHERE group_id = $1 AND id = $2`, groupID, expenseID)
	if err != nil {
		return err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return apperror.NotFound("expense not found")
	}
	return nil
}

const selectSettlement = `SELECT s.id, s.group_id, s.from_member_id, fp.display_name, s.to_member_id, tp.display_name, s.amount, s.note, s.occurred_at, s.created_at, s.updated_at
	FROM patungan_settlements s
	JOIN patungan_participants fp ON fp.id = s.from_member_id
	JOIN patungan_participants tp ON tp.id = s.to_member_id`

func scanSettlement(scan func(dest ...interface{}) error) (domain.Settlement, error) {
	var s domain.Settlement
	err := scan(&s.ID, &s.GroupID, &s.FromMemberID, &s.FromName, &s.ToMemberID, &s.ToName, &s.Amount, &s.Note, &s.OccurredAt, &s.CreatedAt, &s.UpdatedAt)
	return s, err
}

func (r *PostgresRepository) CreateSettlement(s *domain.Settlement) error {
	if err := r.db.QueryRow(
		`INSERT INTO patungan_settlements (group_id, from_member_id, to_member_id, amount, note, occurred_at, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) RETURNING id, created_at, updated_at`,
		s.GroupID, s.FromMemberID, s.ToMemberID, s.Amount, s.Note, s.OccurredAt,
	).Scan(&s.ID, &s.CreatedAt, &s.UpdatedAt); err != nil {
		return err
	}
	if _, err := r.db.Exec(`UPDATE patungan_groups SET updated_at = NOW() WHERE id = $1`, s.GroupID); err != nil {
		return err
	}
	row := r.db.QueryRow(selectSettlement+` WHERE s.id = $1`, s.ID)
	created, err := scanSettlement(row.Scan)
	if err != nil {
		return nil
	}
	*s = created
	return nil
}

func (r *PostgresRepository) ListSettlements(groupID string) ([]domain.Settlement, error) {
	rows, err := r.db.Query(selectSettlement+` WHERE s.group_id = $1 ORDER BY s.occurred_at DESC, s.created_at DESC LIMIT 100`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.Settlement
	for rows.Next() {
		s, err := scanSettlement(rows.Scan)
		if err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (r *PostgresRepository) DeleteSettlement(groupID, settlementID string) error {
	res, err := r.db.Exec(`DELETE FROM patungan_settlements WHERE group_id = $1 AND id = $2`, groupID, settlementID)
	if err != nil {
		return err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return apperror.NotFound("settlement not found")
	}
	return nil
}

func (r *PostgresRepository) HasParticipantHistory(groupID, memberID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(`SELECT EXISTS(
		SELECT 1 FROM patungan_expenses WHERE group_id = $1 AND payer_member_id = $2
		UNION ALL SELECT 1 FROM patungan_splits s JOIN patungan_expenses e ON e.id = s.expense_id WHERE e.group_id = $1 AND s.member_id = $2
		UNION ALL SELECT 1 FROM patungan_settlements WHERE group_id = $1 AND (from_member_id = $2 OR to_member_id = $2)
	)`, groupID, memberID).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}

func (r *PostgresRepository) GetSummary(groupID string) (*domain.Summary, error) {
	rows, err := r.db.Query(`SELECT p.id, p.display_name, p.linked_user_id,
		COALESCE((SELECT SUM(total_amount) FROM patungan_expenses e WHERE e.group_id = p.group_id AND e.payer_member_id = p.id), 0),
		COALESCE((SELECT SUM(share_amount) FROM patungan_splits s JOIN patungan_expenses e ON e.id = s.expense_id WHERE e.group_id = p.group_id AND s.member_id = p.id), 0),
		COALESCE((SELECT SUM(amount) FROM patungan_settlements s WHERE s.group_id = p.group_id AND s.from_member_id = p.id), 0),
		COALESCE((SELECT SUM(amount) FROM patungan_settlements s WHERE s.group_id = p.group_id AND s.to_member_id = p.id), 0)
		FROM patungan_participants p WHERE p.group_id = $1 ORDER BY p.created_at ASC`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	sum := &domain.Summary{GroupID: groupID, Balances: []domain.Balance{}, Suggestions: []domain.DebtSuggestion{}}
	for rows.Next() {
		var b domain.Balance
		var linked sql.NullString
		if err := rows.Scan(&b.MemberID, &b.DisplayName, &linked, &b.Paid, &b.Share, &b.SettledPaid, &b.SettledReceived); err != nil {
			return nil, err
		}
		b.IsGuest = !linked.Valid
		b.Net = b.Paid - b.Share + b.SettledPaid - b.SettledReceived
		sum.TotalExpense += b.Paid
		sum.Balances = append(sum.Balances, b)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return sum, nil
}

var _ domain.Repository = (*PostgresRepository)(nil)
