package service

import (
	"strings"

	"github.com/mufarasyid/alurkasku/server/internal/modules/account/domain"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
)

type Service struct {
	repo domain.AccountRepository
}

func New(repo domain.AccountRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreateAccount(userID string, req domain.CreateAccountRequest) (*domain.Account, error) {
	a := &domain.Account{
		UserID:  userID,
		Name:    strings.TrimSpace(req.Name),
		Type:    strings.TrimSpace(req.Type),
		Detail:  strings.TrimSpace(req.Detail),
		Balance: req.Balance,
		Icon:    strings.TrimSpace(req.Icon),
	}
	if err := validateAccount(a.Name, a.Type, a.Detail, a.Balance, a.Icon); err != nil {
		return nil, err
	}
	if a.Icon == "" {
		a.Icon = "Wallet"
	}
	if err := s.repo.Create(a); err != nil {
		return nil, apperror.Internal("failed to create account", err)
	}
	return a, nil
}

func (s *Service) GetAccount(userID, id string) (*domain.Account, error) {
	a, err := s.repo.GetByID(userID, id)
	if err != nil {
		return nil, apperror.Internal("failed to get account", err)
	}
	if a == nil {
		return nil, apperror.NotFound("account not found")
	}
	return a, nil
}

func (s *Service) UpdateAccount(userID, id string, req domain.UpdateAccountRequest) (*domain.Account, error) {
	a, err := s.GetAccount(userID, id)
	if err != nil {
		return nil, err
	}
	if v := strings.TrimSpace(req.Name); v != "" {
		a.Name = v
	}
	if v := strings.TrimSpace(req.Type); v != "" {
		a.Type = v
	}
	if req.Detail != nil {
		a.Detail = strings.TrimSpace(*req.Detail)
	}
	if req.Balance != nil {
		a.Balance = *req.Balance
	}
	if v := strings.TrimSpace(req.Icon); v != "" {
		a.Icon = v
	}
	if err := validateAccount(a.Name, a.Type, a.Detail, a.Balance, a.Icon); err != nil {
		return nil, err
	}
	if err := s.repo.Update(a); err != nil {
		return nil, apperror.Internal("failed to update account", err)
	}
	return a, nil
}

func (s *Service) DeleteAccount(userID, id string) error {
	affected, err := s.repo.Delete(userID, id)
	if err != nil {
		return apperror.Internal("failed to delete account", err)
	}
	if affected == 0 {
		return apperror.NotFound("account not found")
	}
	return nil
}

func (s *Service) BulkDeleteAccounts(userID string, ids []string) (int64, error) {
	affected, err := s.repo.BulkDelete(userID, ids)
	if err != nil {
		return 0, apperror.Internal("failed to delete accounts", err)
	}
	return affected, nil
}

func (s *Service) ListAccounts(userID string, filters domain.ListFilters) ([]domain.Account, int64, error) {
	if filters.Type != "" && !isValidType(filters.Type) {
		return nil, 0, apperror.BadRequest("type must be one of: Bank, Wallet, Cash")
	}
	accounts, total, err := s.repo.ListByUser(userID, filters)
	if err != nil {
		return nil, 0, apperror.Internal("failed to list accounts", err)
	}
	return accounts, total, nil
}

func validateAccount(name, typ, detail string, balance int64, icon string) error {
	if name == "" {
		return apperror.BadRequest("name is required")
	}
	if len(name) > 255 {
		return apperror.BadRequest("name must be at most 255 characters")
	}
	if !isValidType(typ) {
		return apperror.BadRequest("type must be one of: Bank, Wallet, Cash")
	}
	if len(detail) > 255 {
		return apperror.BadRequest("detail must be at most 255 characters")
	}
	if balance < 0 {
		return apperror.BadRequest("balance must not be negative")
	}
	if len(icon) > 50 {
		return apperror.BadRequest("icon must be at most 50 characters")
	}
	return nil
}

func isValidType(t string) bool {
	return t == domain.TypeBank || t == domain.TypeWallet || t == domain.TypeCash
}
