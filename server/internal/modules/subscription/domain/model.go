package domain

import "time"

type Subscription struct {
	ID        string     `json:"id"`
	UserID    string     `json:"user_id"`
	Plan      string     `json:"plan"`
	Status    string     `json:"status"`
	StartDate time.Time  `json:"start_date"`
	EndDate   *time.Time `json:"end_date"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func ToResponse(sub Subscription) SubscriptionResponse {
	return SubscriptionResponse{
		ID:        sub.ID,
		UserID:    sub.UserID,
		Plan:      sub.Plan,
		Status:    sub.Status,
		StartDate: sub.StartDate,
		EndDate:   sub.EndDate,
		CreatedAt: sub.CreatedAt,
		UpdatedAt: sub.UpdatedAt,
	}
}

type CreateSubscriptionRequest struct {
	Plan      string     `json:"plan" validate:"required,min=1,max=50"`
	Status    string     `json:"status" validate:"omitempty,oneof=active inactive suspended cancelled"`
	StartDate time.Time  `json:"start_date" validate:"required"`
	EndDate   *time.Time `json:"end_date"`
}

type UpdateSubscriptionRequest struct {
	Plan      string     `json:"plan" validate:"omitempty,min=1,max=50"`
	Status    string     `json:"status" validate:"omitempty,oneof=active inactive suspended cancelled"`
	StartDate time.Time  `json:"start_date" validate:"omitempty"`
	EndDate   *time.Time `json:"end_date"`
}

type SubscriptionResponse struct {
	ID        string     `json:"id"`
	UserID    string     `json:"user_id"`
	Plan      string     `json:"plan"`
	Status    string     `json:"status"`
	StartDate time.Time  `json:"start_date"`
	EndDate   *time.Time `json:"end_date"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}
