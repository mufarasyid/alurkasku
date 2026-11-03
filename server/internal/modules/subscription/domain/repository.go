package domain

type SubscriptionRepository interface {
	Create(sub *Subscription) error
	GetByID(id string) (*Subscription, error)
	GetByUserID(userID string) (*Subscription, error)
	Update(sub *Subscription) error
	Delete(id string) error
	List(page, pageSize int) ([]Subscription, int, error)
	ListByUser(userID string) ([]Subscription, error)
}
