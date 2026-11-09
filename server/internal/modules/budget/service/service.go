package service

import (
	"strings"

	"github.com/mufarasyid/alurkasku/server/internal/modules/budget/domain"
	catDomain "github.com/mufarasyid/alurkasku/server/internal/modules/category/domain"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
	"github.com/mufarasyid/alurkasku/server/internal/shared/httpx"
)

type Service struct {
	repo         domain.BudgetRepository
	categoryRepo catDomain.CategoryRepository
}

func New(repo domain.BudgetRepository, categoryRepo catDomain.CategoryRepository) *Service {
	return &Service{repo: repo, categoryRepo: categoryRepo}
}

var defaultBudgets = []struct {
	name, category, period, icon string
	limit                        int64
}{
	{name: "Food & Drinks", category: "Food & Drinks", period: domain.PeriodMonthly, limit: 2_000_000, icon: "Utensils"},
	{name: "Coffee", category: "Coffee", period: domain.PeriodMonthly, limit: 300_000, icon: "Coffee"},
	{name: "Transportation", category: "Transportation", period: domain.PeriodMonthly, limit: 500_000, icon: "Car"},
	{name: "Home", category: "Housing & Utilities", period: domain.PeriodMonthly, limit: 1_500_000, icon: "Home"},
	{name: "Dating", period: domain.PeriodMonthly, limit: 750_000, icon: "Flower2"},
	{name: "Shopping", category: "Shopping", period: domain.PeriodMonthly, limit: 1_000_000, icon: "ShoppingBag"},
	{name: "Health", category: "Health", period: domain.PeriodMonthly, limit: 400_000, icon: "HeartPulse"},
	{name: "Entertainment", category: "Entertainment", period: domain.PeriodMonthly, limit: 500_000, icon: "Clapperboard"},
	{name: "Education", category: "Education", period: domain.PeriodMonthly, limit: 500_000, icon: "GraduationCap"},
	{name: "Gifts & Donations", category: "Gifts & Donations", period: domain.PeriodMonthly, limit: 300_000, icon: "Gift"},
	{name: "Subscriptions", category: "Subscriptions", period: domain.PeriodMonthly, limit: 200_000, icon: "Repeat"},
	{name: "Travel", category: "Travel", period: domain.PeriodYearly, limit: 5_000_000, icon: "Plane"},
}

func (s *Service) SeedDefaults(userID string) error {
	existing, err := s.repo.CountByUser(userID)
	if err != nil {
		return apperror.Internal("failed to check budgets", err)
	}
	if existing > 0 {
		return nil
	}
	categories, _, err := s.categoryRepo.ListByUser(userID, catDomain.ListFilters{})
	if err != nil {
		return apperror.Internal("failed to list categories", err)
	}
	categoryIDs := make(map[string]string, len(categories))
	for _, c := range categories {
		categoryIDs[c.Name] = c.ID
	}
	for _, d := range defaultBudgets {
		b := &domain.Budget{
			UserID: userID,
			Name:   d.name,
			Period: d.period,
			Limit:  d.limit,
			Icon:   d.icon,
		}
		if id, ok := categoryIDs[d.category]; ok {
			b.CategoryID = &id
		}
		if err := s.repo.Create(b); err != nil {
			return apperror.Internal("failed to seed default budgets", err)
		}
	}
	return nil
}

func (s *Service) CreateBudget(userID string, req domain.CreateBudgetRequest) (*domain.Budget, error) {
	b := &domain.Budget{
		UserID: userID,
		Name:   strings.TrimSpace(req.Name),
		Period: strings.TrimSpace(req.Period),
		Limit:  req.Limit,
		Spent:  req.Spent,
		Icon:   strings.TrimSpace(req.Icon),
	}
	if err := validateBudget(b.Name, b.Period, b.Limit, b.Spent, b.Icon); err != nil {
		return nil, err
	}
	if b.Icon == "" {
		b.Icon = "Tag"
	}
	categoryID, err := s.resolveCategory(userID, req.CategoryID)
	if err != nil {
		return nil, err
	}
	b.CategoryID = categoryID

	if err := s.repo.Create(b); err != nil {
		return nil, apperror.Internal("failed to create budget", err)
	}
	return b, nil
}

func (s *Service) GetBudget(userID, id string) (*domain.Budget, error) {
	b, err := s.repo.GetByID(userID, id)
	if err != nil {
		return nil, apperror.Internal("failed to get budget", err)
	}
	if b == nil {
		return nil, apperror.NotFound("budget not found")
	}
	return b, nil
}

func (s *Service) UpdateBudget(userID, id string, req domain.UpdateBudgetRequest) (*domain.Budget, error) {
	b, err := s.GetBudget(userID, id)
	if err != nil {
		return nil, err
	}
	if v := strings.TrimSpace(req.Name); v != "" {
		b.Name = v
	}
	if v := strings.TrimSpace(req.Period); v != "" {
		b.Period = v
	}
	if req.Limit != nil {
		b.Limit = *req.Limit
	}
	if req.Spent != nil {
		b.Spent = *req.Spent
	}
	if v := strings.TrimSpace(req.Icon); v != "" {
		b.Icon = v
	}
	if err := validateBudget(b.Name, b.Period, b.Limit, b.Spent, b.Icon); err != nil {
		return nil, err
	}
	if req.CategoryID != nil {
		categoryID, err := s.resolveCategory(userID, req.CategoryID)
		if err != nil {
			return nil, err
		}
		b.CategoryID = categoryID
	}
	if err := s.repo.Update(b); err != nil {
		return nil, apperror.Internal("failed to update budget", err)
	}
	return s.GetBudget(userID, id)
}

func (s *Service) DeleteBudget(userID, id string) error {
	affected, err := s.repo.Delete(userID, id)
	if err != nil {
		return apperror.Internal("failed to delete budget", err)
	}
	if affected == 0 {
		return apperror.NotFound("budget not found")
	}
	return nil
}

func (s *Service) BulkDeleteBudgets(userID string, ids []string) (int64, error) {
	affected, err := s.repo.BulkDelete(userID, ids)
	if err != nil {
		return 0, apperror.Internal("failed to delete budgets", err)
	}
	return affected, nil
}

func (s *Service) ListBudgets(userID string, filters domain.ListFilters) ([]domain.Budget, int64, error) {
	if filters.Period != "" && !isValidPeriod(filters.Period) {
		return nil, 0, apperror.BadRequest("period must be one of: Weekly, Monthly, Yearly")
	}
	budgets, total, err := s.repo.ListByUser(userID, filters)
	if err != nil {
		return nil, 0, apperror.Internal("failed to list budgets", err)
	}
	return budgets, total, nil
}

func (s *Service) resolveCategory(userID string, categoryID *string) (*string, error) {
	if categoryID == nil {
		return nil, nil
	}
	id := strings.TrimSpace(*categoryID)
	if id == "" {
		return nil, nil
	}
	if _, err := httpx.ParseID(id); err != nil {
		return nil, apperror.BadRequest("invalid category_id")
	}
	category, err := s.categoryRepo.GetByID(userID, id)
	if err != nil {
		return nil, apperror.Internal("failed to get category", err)
	}
	if category == nil {
		return nil, apperror.BadRequest("category not found")
	}
	return &id, nil
}

func validateBudget(name, period string, limit, spent int64, icon string) error {
	if name == "" {
		return apperror.BadRequest("name is required")
	}
	if len(name) > 255 {
		return apperror.BadRequest("name must be at most 255 characters")
	}
	if !isValidPeriod(period) {
		return apperror.BadRequest("period must be one of: Weekly, Monthly, Yearly")
	}
	if limit < 0 {
		return apperror.BadRequest("limit must not be negative")
	}
	if spent < 0 {
		return apperror.BadRequest("spent must not be negative")
	}
	if len(icon) > 50 {
		return apperror.BadRequest("icon must be at most 50 characters")
	}
	return nil
}

func isValidPeriod(p string) bool {
	return p == domain.PeriodWeekly || p == domain.PeriodMonthly || p == domain.PeriodYearly
}
