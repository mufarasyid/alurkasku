package domain

type TransferRepository interface {
	Create(t *Transfer) error
	ListByUser(userID, kind string, limit, offset int) ([]Transfer, int64, error)
}
