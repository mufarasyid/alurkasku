package domain

type UserService interface {
	CreateUser(req CreateUserRequest) (*User, error)
	GetUser(id string) (*User, error)
	GetUserByEmail(email string) (*User, error)
	UpdateUser(id string, req UpdateUserRequest) (*User, error)
	DeleteUser(id string) error
	ListUsers(offset, limit int) ([]User, int64, error)
}
