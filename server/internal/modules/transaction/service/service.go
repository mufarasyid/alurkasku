package service

import (
	"strings"
	"time"

	"github.com/mufarasyid/alurkasku/server/internal/modules/transaction/domain"
	accountDomain "github.com/mufarasyid/alurkasku/server/internal/modules/account/domain"
	catDomain "github.com/mufarasyid/alurkasku/server/internal/modules/category/domain"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
	"github.com/mufarasyid/alurkasku/server/internal/shared/httpx"
)

type Service struct {
	repo         domain.TransactionRepository
	accountRepo  accountDomain.AccountRepository
	categoryRepo catDomain.CategoryRepository
}

func New(repo domain.TransactionRepository, accountRepo accountDomain.AccountRepository, categoryRepo catDomain.CategoryRepository) *Service {
	return &Service{repo: repo, accountRepo: accountRepo, categoryRepo: categoryRepo}
}

func (s *Service) CreateTransaction(userID string, req domain.CreateTransactionRequest) (*domain.Transaction, error) {
	t := &domain.Transaction{
		UserID:     userID,
		AccountID:  strings.TrimSpace(req.AccountID),
		Type:       strings.TrimSpace(req.Type),
		Amount:     req.Amount,
		Note:       strings.TrimSpace(req.Note),
		OccurredAt: req.OccurredAt,
	}
	if t.Type != domain.TypeIncome && t.Type != domain.TypeExpense {
		return nil, apperror.BadRequest("type must be one of: Income, Expense")
	}
	if t.Amount <= 0 {
		return nil, apperror.BadRequest("amount must be greater than 0")
	}
	if len(t.Note) > 255 {
		return nil, apperror.BadRequest("note must be at most 255 characters")
	}
	if t.OccurredAt.IsZero() {
		t.OccurredAt = time.Now()
	}
	if _, err := httpx.ParseID(t.AccountID); err != nil {
		return nil, apperror.BadRequest("invalid account_id")
	}
	account, err := s.accountRepo.GetByID(userID, t.AccountID)
	if err != nil {
		return nil, apperror.Internal("failed to get account", err)
	}
	if account == nil {
		return nil, apperror.BadRequest("account not found")
	}
	if t.Type == domain.TypeExpense && t.Amount > account.Balance {
		return nil, apperror.BadRequest("insufficient account balance")
	}

	if req.CategoryID != nil {
		id := strings.TrimSpace(*req.CategoryID)
		if id == "" {
			t.CategoryID = nil
		} else {
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
			if category.Type != t.Type {
				return nil, apperror.BadRequest("category type does not match transaction type")
			}
			t.CategoryID = &id
		}
	}

	if err := s.repo.Create(t); err != nil {
		return nil, apperror.Internal("failed to create transaction", err)
	}
	return t, nil
}

func (s *Service) ListTransactions(userID string, filters domain.ListFilters) ([]domain.Transaction, error) {
	if filters.Type != "" && filters.Type != domain.TypeIncome && filters.Type != domain.TypeExpense {
		return nil, apperror.BadRequest("type must be one of: Income, Expense")
	}
	transactions, err := s.repo.List(userID, filters)
	if err != nil {
		return nil, apperror.Internal("failed to list transactions", err)
	}
	return transactions, nil
}

func (s *Service) GetOverview(userID, period string) (*domain.OverviewResponse, error) {
	from, to, err := PeriodWindow(period)
	if err != nil {
		return nil, err
	}
	window := to.Sub(from)
	prevFrom, prevTo := from.Add(-window), from

	cur, err := s.repo.SumBetween(userID, from, to)
	if err != nil {
		return nil, apperror.Internal("failed to summarize transactions", err)
	}
	prev, err := s.repo.SumBetween(userID, prevFrom, prevTo)
	if err != nil {
		return nil, apperror.Internal("failed to summarize transactions", err)
	}

	curTotal := cur.Income + cur.Expense
	prevTotal := prev.Income + prev.Expense
	curTotalCount := cur.IncomeCount + cur.ExpenseCount

	return &domain.OverviewResponse{
		Period: period,
		From:   from,
		To:     to,
		Total: domain.PeriodSummary{
			Amount:   curTotal,
			Count:    curTotalCount,
			DeltaPct: deltaPct(curTotal, prevTotal),
		},
		Income: domain.PeriodSummary{
			Amount:   cur.Income,
			Count:    cur.IncomeCount,
			DeltaPct: deltaPct(cur.Income, prev.Income),
		},
		Expense: domain.PeriodSummary{
			Amount:   cur.Expense,
			Count:    cur.ExpenseCount,
			DeltaPct: deltaPct(cur.Expense, prev.Expense),
		},
	}, nil
}

func (s *Service) GetBreakdown(userID, period string) ([]domain.CategorySum, error) {
	from, to, err := PeriodWindow(period)
	if err != nil {
		return nil, err
	}
	sums, err := s.repo.Breakdown(userID, from, to, 5)
	if err != nil {
		return nil, apperror.Internal("failed to summarize breakdown", err)
	}
	totals, err := s.repo.SumBetween(userID, from, to)
	if err != nil {
		return nil, apperror.Internal("failed to summarize breakdown", err)
	}
	if totals.Expense > 0 {
		for i := range sums {
			sums[i].Pct = float64(sums[i].Amount) / float64(totals.Expense) * 100
		}
	}
	return sums, nil
}

func PeriodWindow(period string) (time.Time, time.Time, error) {
	now := time.Now()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	switch period {
	case "this-month":
		return monthStart, monthStart.AddDate(0, 1, 0), nil
	case "last-month":
		return monthStart.AddDate(0, -1, 0), monthStart, nil
	case "last-3-months":
		return monthStart.AddDate(0, -2, 0), monthStart.AddDate(0, 1, 0), nil
	case "this-year":
		yearStart := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
		return yearStart, yearStart.AddDate(1, 0, 0), nil
	default:
		return time.Time{}, time.Time{}, apperror.BadRequest("period must be one of: this-month, last-month, last-3-months, this-year")
	}
}

func deltaPct(cur, prev int64) *float64 {
	if prev == 0 {
		return nil
	}
	d := float64(cur-prev) / float64(prev) * 100
	return &d
}
