package domain

type BudgetRepository interface {
	Create(b *Budget) error
	GetByID(userID, id string) (*Budget, error)
	Update(b *Budget) error
	Delete(userID, id string) (int64, error)
	BulkDelete(userID string, ids []string) (int64, error)
	ListByUser(userID string, filters ListFilters) ([]Budget, error)
}

type ListFilters struct {
	Period string
	Query  string
}
