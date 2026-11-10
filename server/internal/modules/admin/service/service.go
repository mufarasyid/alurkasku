package service

import (
	"time"

	"github.com/mufarasyid/alurkasku/server/internal/modules/account/domain"
	accountsvc "github.com/mufarasyid/alurkasku/server/internal/modules/account/service"
	budgetdomain "github.com/mufarasyid/alurkasku/server/internal/modules/budget/domain"
	budgetsvc "github.com/mufarasyid/alurkasku/server/internal/modules/budget/service"
	catdomain "github.com/mufarasyid/alurkasku/server/internal/modules/category/domain"
	catsvc "github.com/mufarasyid/alurkasku/server/internal/modules/category/service"
	subdomain "github.com/mufarasyid/alurkasku/server/internal/modules/subscription/domain"
	subsvc "github.com/mufarasyid/alurkasku/server/internal/modules/subscription/service"
	transactiondomain "github.com/mufarasyid/alurkasku/server/internal/modules/transaction/domain"
	transactionsvc "github.com/mufarasyid/alurkasku/server/internal/modules/transaction/service"
	userdomain "github.com/mufarasyid/alurkasku/server/internal/modules/user/domain"
)

// Service composes existing module services to give admins read access to
// member financial data and manage member accounts.
type Service struct {
	users         userdomain.UserService
	accounts      *accountsvc.Service
	transactions  *transactionsvc.Service
	budgets       *budgetsvc.Service
	categories    *catsvc.Service
	subscriptions *subsvc.Service
}

func New(
	users userdomain.UserService,
	accounts *accountsvc.Service,
	transactions *transactionsvc.Service,
	budgets *budgetsvc.Service,
	categories *catsvc.Service,
	subscriptions *subsvc.Service,
) *Service {
	return &Service{
		users:         users,
		accounts:      accounts,
		transactions:  transactions,
		budgets:       budgets,
		categories:    categories,
		subscriptions: subscriptions,
	}
}

func (s *Service) ListUsers(offset, limit int, filters userdomain.ListFilters) ([]userdomain.User, int64, error) {
	return s.users.ListUsers(offset, limit, filters)
}

func (s *Service) GetUser(id string) (*userdomain.User, error) {
	return s.users.GetUser(id)
}

func (s *Service) UpdateUser(id string, req userdomain.UpdateUserRequest) (*userdomain.User, error) {
	return s.users.UpdateUser(id, req)
}

func (s *Service) DeleteUser(id string) error {
	return s.users.DeleteUser(id)
}

func (s *Service) ListUserAccounts(userID string, filters domain.ListFilters) ([]domain.Account, int64, error) {
	return s.accounts.ListAccounts(userID, filters)
}

func (s *Service) ListUserTransactions(userID string, filters transactiondomain.ListFilters) ([]transactiondomain.Transaction, int64, error) {
	return s.transactions.ListTransactions(userID, filters)
}

func (s *Service) PeriodWindowFor(userID, period string) (time.Time, time.Time, error) {
	return s.transactions.PeriodWindowFor(userID, period)
}

func (s *Service) GetUserOverview(userID, period string) (*transactiondomain.OverviewResponse, error) {
	return s.transactions.GetOverview(userID, period)
}

func (s *Service) GetUserBreakdown(userID, period string) ([]transactiondomain.CategorySum, error) {
	return s.transactions.GetBreakdown(userID, period)
}

func (s *Service) ListUserBudgets(userID string, filters budgetdomain.ListFilters) ([]budgetdomain.Budget, int64, error) {
	return s.budgets.ListBudgets(userID, filters)
}

func (s *Service) ListUserCategories(userID string, filters catdomain.ListFilters) ([]catdomain.Category, int64, error) {
	return s.categories.ListCategories(userID, filters)
}

func (s *Service) ListUserSubscriptions(userID string) ([]subdomain.Subscription, error) {
	return s.subscriptions.ListByUser(userID)
}
