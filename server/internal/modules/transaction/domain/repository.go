package domain

import "time"

type TransactionRepository interface {
	Create(t *Transaction) error
	GetByID(userID, id string) (*Transaction, error)
	List(userID string, filters ListFilters) ([]Transaction, error)
	SumBetween(userID string, from, to time.Time) (Sums, error)
	Breakdown(userID string, from, to time.Time, limit int) ([]CategorySum, error)
}

type ListFilters struct {
	Type  string
	Query string
	From  *time.Time
	To    *time.Time
	Limit int
}
