package domain

type TransferRepository interface {
	Create(t *Transfer) error
	ListByUser(userID, kind string, limit int) ([]Transfer, error)
}
