package domain

type CategoryRepository interface {
	Create(c *Category) error
	GetByID(userID, id string) (*Category, error)
	Update(c *Category) error
	Delete(userID, id string) (int64, error)
	BulkDelete(userID string, ids []string) (int64, error)
	ListByUser(userID string, filters ListFilters) ([]Category, int64, error)
	CountByUser(userID string) (int, error)
}

type ListFilters struct {
	Type     string
	Query    string
	Page     int
	PageSize int
}
