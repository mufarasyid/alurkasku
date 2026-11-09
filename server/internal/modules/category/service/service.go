package service

import (
	"strings"

	"github.com/mufarasyid/alurkasku/server/internal/modules/category/domain"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
)

type Service struct {
	repo domain.CategoryRepository
}

func New(repo domain.CategoryRepository) *Service {
	return &Service{repo: repo}
}

var defaultCategories = []struct {
	name, typ, icon string
}{
	{"Salary", domain.TypeIncome, "Briefcase"},
	{"Freelance", domain.TypeIncome, "Laptop"},
	{"Investments", domain.TypeIncome, "TrendingUp"},
	{"Food & Drinks", domain.TypeExpense, "Utensils"},
	{"Transportation", domain.TypeExpense, "Car"},
	{"Shopping", domain.TypeExpense, "ShoppingBag"},
	{"Housing & Utilities", domain.TypeExpense, "Home"},
	{"Health", domain.TypeExpense, "HeartPulse"},
	{"Entertainment", domain.TypeExpense, "Clapperboard"},
	{"Education", domain.TypeExpense, "GraduationCap"},
	{"Travel", domain.TypeExpense, "Plane"},
	{"Subscriptions", domain.TypeExpense, "Repeat"},
	{"Gifts & Donations", domain.TypeExpense, "Gift"},
	{"Coffee", domain.TypeExpense, "Coffee"},
	{"Dating", domain.TypeExpense, "Flower2"},
}

func (s *Service) SeedDefaults(userID string) error {
	existing, err := s.repo.CountByUser(userID)
	if err != nil {
		return apperror.Internal("failed to check categories", err)
	}
	if existing > 0 {
		return nil
	}
	for _, d := range defaultCategories {
		c := &domain.Category{UserID: userID, Name: d.name, Type: d.typ, Icon: d.icon}
		if err := s.repo.Create(c); err != nil {
			return apperror.Internal("failed to seed default categories", err)
		}
	}
	return nil
}

func (s *Service) CreateCategory(userID string, req domain.CreateCategoryRequest) (*domain.Category, error) {
	c := &domain.Category{
		UserID: userID,
		Name:   strings.TrimSpace(req.Name),
		Type:   strings.TrimSpace(req.Type),
		Icon:   strings.TrimSpace(req.Icon),
	}
	if err := validateCategory(c.Name, c.Type, c.Icon); err != nil {
		return nil, err
	}
	if c.Icon == "" {
		c.Icon = "Tag"
	}
	if err := s.repo.Create(c); err != nil {
		return nil, apperror.Internal("failed to create category", err)
	}
	return c, nil
}

func (s *Service) GetCategory(userID, id string) (*domain.Category, error) {
	c, err := s.repo.GetByID(userID, id)
	if err != nil {
		return nil, apperror.Internal("failed to get category", err)
	}
	if c == nil {
		return nil, apperror.NotFound("category not found")
	}
	return c, nil
}

func (s *Service) UpdateCategory(userID, id string, req domain.UpdateCategoryRequest) (*domain.Category, error) {
	c, err := s.GetCategory(userID, id)
	if err != nil {
		return nil, err
	}
	if v := strings.TrimSpace(req.Name); v != "" {
		c.Name = v
	}
	if v := strings.TrimSpace(req.Type); v != "" {
		c.Type = v
	}
	if v := strings.TrimSpace(req.Icon); v != "" {
		c.Icon = v
	}
	if err := validateCategory(c.Name, c.Type, c.Icon); err != nil {
		return nil, err
	}
	if err := s.repo.Update(c); err != nil {
		return nil, apperror.Internal("failed to update category", err)
	}
	return c, nil
}

func (s *Service) DeleteCategory(userID, id string) error {
	affected, err := s.repo.Delete(userID, id)
	if err != nil {
		return apperror.Internal("failed to delete category", err)
	}
	if affected == 0 {
		return apperror.NotFound("category not found")
	}
	return nil
}

func (s *Service) BulkDeleteCategories(userID string, ids []string) (int64, error) {
	affected, err := s.repo.BulkDelete(userID, ids)
	if err != nil {
		return 0, apperror.Internal("failed to delete categories", err)
	}
	return affected, nil
}

func (s *Service) ListCategories(userID string, filters domain.ListFilters) ([]domain.Category, int64, error) {
	if filters.Type != "" && !isValidType(filters.Type) {
		return nil, 0, apperror.BadRequest("type must be one of: Income, Expense")
	}
	categories, total, err := s.repo.ListByUser(userID, filters)
	if err != nil {
		return nil, 0, apperror.Internal("failed to list categories", err)
	}
	return categories, total, nil
}

func validateCategory(name, typ, icon string) error {
	if name == "" {
		return apperror.BadRequest("name is required")
	}
	if len(name) > 255 {
		return apperror.BadRequest("name must be at most 255 characters")
	}
	if !isValidType(typ) {
		return apperror.BadRequest("type must be one of: Income, Expense")
	}
	if len(icon) > 50 {
		return apperror.BadRequest("icon must be at most 50 characters")
	}
	return nil
}

func isValidType(t string) bool {
	return t == domain.TypeIncome || t == domain.TypeExpense
}
