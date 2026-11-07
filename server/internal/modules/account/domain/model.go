package domain

import "time"

type Account struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Detail    string    `json:"detail"`
	Balance   int64     `json:"balance"`
	Icon      string    `json:"icon"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

const (
	TypeBank   = "Bank"
	TypeWallet = "Wallet"
	TypeCash   = "Cash"
)

func ToResponse(a Account) AccountResponse {
	return AccountResponse{
		ID:        a.ID,
		Name:      a.Name,
		Type:      a.Type,
		Detail:    a.Detail,
		Balance:   a.Balance,
		Icon:      a.Icon,
		CreatedAt: a.CreatedAt,
		UpdatedAt: a.UpdatedAt,
	}
}

type CreateAccountRequest struct {
	Name    string `json:"name"`
	Type    string `json:"type"`
	Detail  string `json:"detail"`
	Balance int64  `json:"balance"`
	Icon    string `json:"icon"`
}

type UpdateAccountRequest struct {
	Name    string `json:"name"`
	Type    string `json:"type"`
	Detail  *string `json:"detail"`
	Balance *int64 `json:"balance"`
	Icon    string `json:"icon"`
}

type BulkDeleteRequest struct {
	IDs []string `json:"ids"`
}

type AccountResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Detail    string    `json:"detail"`
	Balance   int64     `json:"balance"`
	Icon      string    `json:"icon"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
