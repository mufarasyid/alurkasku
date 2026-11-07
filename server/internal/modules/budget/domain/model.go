package domain

import "time"

type Budget struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	Name       string    `json:"name"`
	CategoryID *string   `json:"category_id"`
	Category   string    `json:"category"`
	Period     string    `json:"period"`
	Limit      int64     `json:"limit"`
	Spent      int64     `json:"spent"`
	Icon       string    `json:"icon"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

const (
	PeriodWeekly  = "Weekly"
	PeriodMonthly = "Monthly"
	PeriodYearly  = "Yearly"
)

func ToResponse(b Budget) BudgetResponse {
	return BudgetResponse{
		ID:         b.ID,
		Name:       b.Name,
		CategoryID: b.CategoryID,
		Category:   b.Category,
		Period:     b.Period,
		Limit:      b.Limit,
		Spent:      b.Spent,
		Icon:       b.Icon,
		CreatedAt:  b.CreatedAt,
		UpdatedAt:  b.UpdatedAt,
	}
}

type CreateBudgetRequest struct {
	Name       string  `json:"name"`
	CategoryID *string `json:"category_id"`
	Period     string  `json:"period"`
	Limit      int64   `json:"limit"`
	Spent      int64   `json:"spent"`
	Icon       string  `json:"icon"`
}

type UpdateBudgetRequest struct {
	Name       string  `json:"name"`
	CategoryID *string `json:"category_id"`
	Period     string  `json:"period"`
	Limit      *int64  `json:"limit"`
	Spent      *int64  `json:"spent"`
	Icon       string  `json:"icon"`
}

type BulkDeleteRequest struct {
	IDs []string `json:"ids"`
}

type BudgetResponse struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	CategoryID *string   `json:"category_id"`
	Category   string    `json:"category"`
	Period     string    `json:"period"`
	Limit      int64     `json:"limit"`
	Spent      int64     `json:"spent"`
	Icon       string    `json:"icon"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
