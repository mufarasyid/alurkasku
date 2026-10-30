package service

import (
	"github.com/mufarasyid/alurkasku/server/internal/modules/user/domain"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
)

type Service struct {
	repo domain.UserRepository
}

func New(repo domain.UserRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreateUser(req domain.CreateUserRequest) (*domain.User, error) {
	existing, err := s.repo.GetByEmail(req.Email)
	if err != nil {
		return nil, apperror.Internal("failed to check existing user", err)
	}
	if existing != nil {
		return nil, apperror.Conflict("email already registered")
	}

	u := &domain.User{
		Email:    req.Email,
		Password: req.Password, // hashed by handler/middleware layer before call
		Name:     req.Name,
	}
	if err := s.repo.Create(u); err != nil {
		return nil, apperror.Internal("failed to create user", err)
	}
	return u, nil
}

func (s *Service) GetUser(id uint64) (*domain.User, error) {
	u, err := s.repo.GetByID(id)
	if err != nil {
		return nil, apperror.Internal("failed to get user", err)
	}
	if u == nil {
		return nil, apperror.NotFound("user not found")
	}
	return u, nil
}

func (s *Service) GetUserByEmail(email string) (*domain.User, error) {
	u, err := s.repo.GetByEmail(email)
	if err != nil {
		return nil, apperror.Internal("failed to get user by email", err)
	}
	if u == nil {
		return nil, apperror.NotFound("user not found")
	}
	return u, nil
}

func (s *Service) UpdateUser(id uint64, req domain.UpdateUserRequest) (*domain.User, error) {
	u, err := s.GetUser(id)
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		u.Name = req.Name
	}
	if req.Email != "" && req.Email != u.Email {
		existing, err := s.repo.GetByEmail(req.Email)
		if err != nil {
			return nil, apperror.Internal("failed to check email", err)
		}
		if existing != nil {
			return nil, apperror.Conflict("email already in use")
		}
		u.Email = req.Email
	}

	if err := s.repo.Update(u); err != nil {
		return nil, apperror.Internal("failed to update user", err)
	}
	return u, nil
}

func (s *Service) DeleteUser(id uint64) error {
	if err := s.repo.Delete(id); err != nil {
		return apperror.Internal("failed to delete user", err)
	}
	return nil
}

func (s *Service) ListUsers(offset, limit int) ([]domain.User, int64, error) {
	return s.repo.List(offset, limit)
}
