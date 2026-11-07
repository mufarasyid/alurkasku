package domain

import "time"

type Category struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Icon      string    `json:"icon"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

const (
	TypeIncome  = "Income"
	TypeExpense = "Expense"
)

func ToResponse(c Category) CategoryResponse {
	return CategoryResponse{
		ID:        c.ID,
		Name:      c.Name,
		Type:      c.Type,
		Icon:      c.Icon,
		CreatedAt: c.CreatedAt,
		UpdatedAt: c.UpdatedAt,
	}
}

type CreateCategoryRequest struct {
	Name string `json:"name"`
	Type string `json:"type"`
	Icon string `json:"icon"`
}

type UpdateCategoryRequest struct {
	Name string `json:"name"`
	Type string `json:"type"`
	Icon string `json:"icon"`
}

type BulkDeleteRequest struct {
	IDs []string `json:"ids"`
}

type CategoryResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Icon      string    `json:"icon"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
