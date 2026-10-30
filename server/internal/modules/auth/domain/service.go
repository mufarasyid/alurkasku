package domain

type AuthService interface {
	Register(req RegisterRequest) (*AuthResponse, error)
	Login(req LoginRequest) (*AuthResponse, error)
	Refresh(req RefreshRequest) (*TokenPair, error)
	Logout(refreshToken string) error
}
