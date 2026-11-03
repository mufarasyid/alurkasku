package service

import (
	"time"

	"github.com/mufarasyid/alurkasku/server/internal/modules/subscription/domain"
	userDomain "github.com/mufarasyid/alurkasku/server/internal/modules/user/domain"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
)

type Service struct {
	repo     domain.SubscriptionRepository
	userRepo userDomain.UserRepository
}

func New(repo domain.SubscriptionRepository, userRepo userDomain.UserRepository) *Service {
	return &Service{repo: repo, userRepo: userRepo}
}

func (s *Service) CreateSubscription(userID string, req domain.CreateSubscriptionRequest) (*domain.Subscription, error) {
	user, err := s.currentUser(userID)
	if err != nil {
		return nil, err
	}

	if user.Role != userDomain.RoleUser && user.Role != userDomain.RoleAdmin {
		return nil, apperror.Unauthorized("invalid role for subscription")
	}

	if err := validatePlan(req.Plan); err != nil {
		return nil, err
	}
	if req.Status == "" {
		req.Status = "active"
	}

	sub := &domain.Subscription{
		UserID:    userID,
		Plan:      req.Plan,
		Status:    req.Status,
		StartDate: req.StartDate,
		EndDate:   req.EndDate,
	}
	if sub.StartDate.IsZero() {
		sub.StartDate = time.Now()
	}
	if err := s.repo.Create(sub); err != nil {
		return nil, apperror.Internal("failed to create subscription", err)
	}
	return sub, nil
}

func (s *Service) GetSubscription(id string) (*domain.Subscription, error) {
	sub, err := s.repo.GetByID(id)
	if err != nil {
		return nil, apperror.Internal("failed to get subscription", err)
	}
	if sub == nil {
		return nil, apperror.NotFound("subscription not found")
	}
	return sub, nil
}

func (s *Service) GetSubscriptionByUser(userID string) (*domain.Subscription, error) {
	sub, err := s.repo.GetByUserID(userID)
	if err != nil {
		return nil, apperror.Internal("failed to get subscription", err)
	}
	if sub == nil {
		return nil, apperror.NotFound("subscription not found")
	}
	return sub, nil
}

func (s *Service) UpdateSubscription(id string, req domain.UpdateSubscriptionRequest) (*domain.Subscription, error) {
	sub, err := s.repo.GetByID(id)
	if err != nil {
		return nil, apperror.Internal("failed to get subscription", err)
	}
	if sub == nil {
		return nil, apperror.NotFound("subscription not found")
	}

	if req.Plan != "" {
		if err := validatePlan(req.Plan); err != nil {
			return nil, err
		}
		sub.Plan = req.Plan
	}
	if req.Status != "" {
		sub.Status = req.Status
	}
	if !req.StartDate.IsZero() {
		sub.StartDate = req.StartDate
	}
	if req.EndDate != nil {
		sub.EndDate = req.EndDate
	}

	if err := s.repo.Update(sub); err != nil {
		return nil, apperror.Internal("failed to update subscription", err)
	}
	return sub, nil
}

func (s *Service) DeleteSubscription(id string) error {
	if err := s.repo.Delete(id); err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			return appErr
		}
		return apperror.Internal("failed to delete subscription", err)
	}
	return nil
}

func (s *Service) ListByUser(userID string) ([]domain.Subscription, error) {
	subs, err := s.repo.ListByUser(userID)
	if err != nil {
		return nil, apperror.Internal("failed to list subscriptions", err)
	}
	return subs, nil
}

func validatePlan(plan string) error {
	if plan == "" {
		return apperror.BadRequest("plan is required")
	}
	return nil
}

func (s *Service) ListSubscriptions(page, pageSize int) ([]domain.Subscription, int, error) {
	return s.repo.List(page, pageSize)
}

func (s *Service) currentUser(userID string) (*userDomain.User, error) {
	return s.userRepo.GetByID(userID)
}
