package domain

import "time"

type Role string

const (
	RoleUser Role = "user"
	RoleAdmin Role = "admin"
)

func ValidRole(r string) bool {
	return r == string(RoleUser) || r == string(RoleAdmin)
}

type User struct {
	ID        string     `json:"id"`
	Email     string     `json:"email"`
	Password  string     `json:"-"`
	Name      string     `json:"name"`
	Role      Role       `json:"role"`
	PaydayDay *int       `json:"payday_day"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"-"`
}

type CreateUserRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Name     string `json:"name" validate:"required,min=2"`
}

type UpdateUserRequest struct {
	Name  string `json:"name" validate:"omitempty,min=2"`
	Email string `json:"email" validate:"omitempty,email"`
	Role  string `json:"role" validate:"omitempty,oneof=admin user"`
	// Set payday_day to 1-31 to make monthly reports follow a payday cycle;
	// set clear_payday_day to revert to calendar months.
	PaydayDay      *int `json:"payday_day" validate:"omitempty,min=1,max=31"`
	ClearPaydayDay bool `json:"clear_payday_day"`
}

type UserResponse struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Role      Role      `json:"role"`
	PaydayDay *int      `json:"payday_day,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func ToResponse(u User) UserResponse {
	return UserResponse{
		ID:        u.ID,
		Email:     u.Email,
		Name:      u.Name,
		Role:      u.Role,
		PaydayDay: u.PaydayDay,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}
