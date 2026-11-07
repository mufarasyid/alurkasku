package domain

import "time"

type Transfer struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	Kind          string    `json:"kind"`
	FromAccountID string    `json:"from_account_id"`
	FromAccount   string    `json:"from_account"`
	ToAccountID   string    `json:"to_account_id"`
	ToAccount     string    `json:"to_account"`
	Amount        int64     `json:"amount"`
	Fee           int64     `json:"fee"`
	Note          string    `json:"note"`
	OccurredAt    time.Time `json:"occurred_at"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

const (
	KindTransfer    = "transfer"
	KindWithdrawal  = "withdrawal"
)

func ToResponse(t Transfer) TransferResponse {
	return TransferResponse{
		ID:            t.ID,
		Kind:          t.Kind,
		FromAccountID: t.FromAccountID,
		FromAccount:   t.FromAccount,
		ToAccountID:   t.ToAccountID,
		ToAccount:     t.ToAccount,
		Amount:        t.Amount,
		Fee:           t.Fee,
		Note:          t.Note,
		OccurredAt:    t.OccurredAt,
		CreatedAt:     t.CreatedAt,
		UpdatedAt:     t.UpdatedAt,
	}
}

type CreateTransferRequest struct {
	FromAccountID string    `json:"from_account_id"`
	ToAccountID   string    `json:"to_account_id"`
	Amount        int64     `json:"amount"`
	Fee           int64     `json:"fee"`
	Note          string    `json:"note"`
	OccurredAt    time.Time `json:"occurred_at"`
}

type TransferResponse struct {
	ID            string    `json:"id"`
	Kind          string    `json:"kind"`
	FromAccountID string    `json:"from_account_id"`
	FromAccount   string    `json:"from_account"`
	ToAccountID   string    `json:"to_account_id"`
	ToAccount     string    `json:"to_account"`
	Amount        int64     `json:"amount"`
	Fee           int64     `json:"fee"`
	Note          string    `json:"note"`
	OccurredAt    time.Time `json:"occurred_at"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
