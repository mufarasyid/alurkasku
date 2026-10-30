package service

import (
	"time"

	"github.com/mufarasyid/alurkasku/server/internal/modules/auth/domain"
	userDomain "github.com/mufarasyid/alurkasku/server/internal/modules/user/domain"
	"github.com/mufarasyid/alurkasku/server/internal/platform/security"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
)

type Service struct {
	authRepo      domain.RefreshTokenRepository
	userRepo      userDomain.UserRepository
	userSvc       userDomain.UserService
	jwtMgr        *security.Manager
	accessExpiry  time.Duration
	refreshExpiry time.Duration
}

func New(authRepo domain.RefreshTokenRepository, userRepo userDomain.UserRepository, userSvc userDomain.UserService, jwtMgr *security.Manager, accessExpiry, refreshExpiry time.Duration) *Service {
	return &Service{
		authRepo:      authRepo,
		userRepo:      userRepo,
		userSvc:       userSvc,
		jwtMgr:        jwtMgr,
		accessExpiry:  accessExpiry,
		refreshExpiry: refreshExpiry,
	}
}

func (s *Service) Register(req domain.RegisterRequest) (*domain.AuthResponse, error) {
	existing, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, apperror.Internal("failed to check existing user", err)
	}
	if existing != nil {
		return nil, apperror.Conflict("email already registered")
	}

	hash, err := security.HashPassword(req.Password)
	if err != nil {
		return nil, apperror.Internal("failed to hash password", err)
	}

	u := &userDomain.User{
		Email:    req.Email,
		Password: hash,
		Name:     req.Name,
	}
	if err := s.userRepo.Create(u); err != nil {
		return nil, apperror.Internal("failed to create user", err)
	}

	return s.issueTokens(u.ID, u.Email, u.Name)
}

func (s *Service) Login(req domain.LoginRequest) (*domain.AuthResponse, error) {
	u, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, apperror.Internal("failed to get user", err)
	}
	if u == nil {
		return nil, apperror.Unauthorized("invalid email or password")
	}

	if err := security.CheckPassword(req.Password, u.Password); err != nil {
		return nil, apperror.Unauthorized("invalid email or password")
	}

	return s.issueTokens(u.ID, u.Email, u.Name)
}

func (s *Service) Refresh(req domain.RefreshRequest) (*domain.TokenPair, error) {
	stored, err := s.authRepo.GetByToken(req.RefreshToken)
	if err != nil {
		return nil, apperror.Internal("failed to validate refresh token", err)
	}
	if stored == nil {
		return nil, apperror.Unauthorized("invalid refresh token")
	}
	if time.Now().After(stored.ExpiresAt) {
		s.authRepo.Delete(req.RefreshToken)
		return nil, apperror.Unauthorized("refresh token expired")
	}

	if _, err := s.jwtMgr.ValidateToken(req.RefreshToken); err != nil {
		return nil, apperror.Unauthorized("invalid refresh token")
	}

	u, err := s.userRepo.GetByID(stored.UserID)
	if err != nil {
		return nil, apperror.Internal("failed to get user", err)
	}
	if u == nil {
		return nil, apperror.Unauthorized("user not found")
	}

	if err := s.authRepo.Delete(req.RefreshToken); err != nil {
		return nil, apperror.Internal("failed to rotate refresh token", err)
	}

	return s.issueTokenPair(u.ID, u.Email, u.Name)
}

func (s *Service) Logout(refreshToken string) error {
	if err := s.authRepo.Delete(refreshToken); err != nil {
		return apperror.Internal("failed to logout", err)
	}
	return nil
}

func (s *Service) issueTokens(userID uint64, email, name string) (*domain.AuthResponse, error) {
	pair, err := s.issueTokenPair(userID, email, name)
	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		User:  domain.UserProfile{ID: userID, Email: email, Name: name},
		Token: *pair,
	}, nil
}

func (s *Service) issueTokenPair(userID uint64, email, name string) (*domain.TokenPair, error) {
	accessToken, err := s.jwtMgr.GenerateAccessToken(userID, email)
	if err != nil {
		return nil, apperror.Internal("failed to generate access token", err)
	}

	refreshToken, err := s.jwtMgr.GenerateRefreshToken(userID, email)
	if err != nil {
		return nil, apperror.Internal("failed to generate refresh token", err)
	}

	if err := s.authRepo.Create(&domain.RefreshToken{
		UserID:    userID,
		Token:     refreshToken,
		ExpiresAt: time.Now().Add(s.refreshExpiry),
	}); err != nil {
		return nil, apperror.Internal("failed to store refresh token", err)
	}

	return &domain.TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.accessExpiry.Seconds()),
	}, nil
}
