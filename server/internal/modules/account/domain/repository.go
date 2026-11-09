package domain

type AccountRepository interface {
	Create(a *Account) error
	GetByID(userID, id string) (*Account, error)
	Update(a *Account) error
	Delete(userID, id string) (int64, error)
	BulkDelete(userID string, ids []string) (int64, error)
	ListByUser(userID string, filters ListFilters) ([]Account, int64, error)
}

type ListFilters struct {
	Type     string
	Query    string
	Page     int
	PageSize int
}
