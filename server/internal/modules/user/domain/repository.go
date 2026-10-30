package domain

type UserRepository interface {
	Create(u *User) error
	GetByID(id uint64) (*User, error)
	GetByEmail(email string) (*User, error)
	Update(u *User) error
	Delete(id uint64) error
	List(offset, limit int) ([]User, int64, error)
}
