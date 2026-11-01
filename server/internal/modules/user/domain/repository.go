package domain

type UserRepository interface {
	Create(u *User) error
	GetByID(id string) (*User, error)
	GetByEmail(email string) (*User, error)
	Update(u *User) error
	Delete(id string) error
	List(offset, limit int) ([]User, int64, error)
}
