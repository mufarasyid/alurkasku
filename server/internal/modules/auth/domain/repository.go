package domain

type RefreshTokenRepository interface {
	Create(token *RefreshToken) error
	GetByToken(token string) (*RefreshToken, error)
	Delete(token string) error
	DeleteByUserID(userID uint64) error
}
