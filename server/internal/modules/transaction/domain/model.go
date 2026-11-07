package domain

import "time"

type Transaction struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	AccountID    string    `json:"account_id"`
	Account      string    `json:"account"`
	CategoryID   *string   `json:"category_id"`
	Category     string    `json:"category"`
	CategoryIcon string    `json:"category_icon"`
	Type         string    `json:"type"`
	Amount       int64     `json:"amount"`
	Note         string    `json:"note"`
	OccurredAt   time.Time `json:"occurred_at"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

const (
	TypeIncome  = "Income"
	TypeExpense = "Expense"
)

func ToResponse(t Transaction) TransactionResponse {
	return TransactionResponse{
		ID:           t.ID,
		AccountID:    t.AccountID,
		Account:      t.Account,
		CategoryID:   t.CategoryID,
		Category:     t.Category,
		CategoryIcon: t.CategoryIcon,
		Type:         t.Type,
		Amount:       t.Amount,
		Note:         t.Note,
		OccurredAt:   t.OccurredAt,
		CreatedAt:    t.CreatedAt,
		UpdatedAt:    t.UpdatedAt,
	}
}

type CreateTransactionRequest struct {
	AccountID  string    `json:"account_id"`
	CategoryID *string   `json:"category_id"`
	Type       string    `json:"type"`
	Amount     int64     `json:"amount"`
	Note       string    `json:"note"`
	OccurredAt time.Time `json:"occurred_at"`
}

type TransactionResponse struct {
	ID           string    `json:"id"`
	AccountID    string    `json:"account_id"`
	Account      string    `json:"account"`
	CategoryID   *string   `json:"category_id"`
	Category     string    `json:"category"`
	CategoryIcon string    `json:"category_icon"`
	Type         string    `json:"type"`
	Amount       int64     `json:"amount"`
	Note         string    `json:"note"`
	OccurredAt   time.Time `json:"occurred_at"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Sums struct {
	Income       int64
	Expense      int64
	IncomeCount  int
	ExpenseCount int
	Count        int
}

type PeriodSummary struct {
	Amount   int64    `json:"amount"`
	Count    int      `json:"count"`
	DeltaPct *float64 `json:"delta_pct"`
}

type OverviewResponse struct {
	Period  string        `json:"period"`
	From    time.Time     `json:"from"`
	To      time.Time     `json:"to"`
	Total   PeriodSummary `json:"total"`
	Income  PeriodSummary `json:"income"`
	Expense PeriodSummary `json:"expense"`
}

type CategorySum struct {
	Category string  `json:"category"`
	Icon     string  `json:"icon"`
	Amount   int64   `json:"amount"`
	Pct      float64 `json:"pct"`
}

type OverviewRequest struct {
	Period string
}
