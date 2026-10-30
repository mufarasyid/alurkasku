package domain

type UserService interface {
	CreateUser(req CreateUserRequest) (*User, error)
	GetUser(id uint64) (*User, error)
	GetUserByEmail(email string) (*User, error)
	UpdateUser(id uint64, req UpdateUserRequest) (*User, error)
	DeleteUser(id uint64) error
	ListUsers(offset, limit int) ([]User, int64, error)
}
