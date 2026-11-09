package service

import (
	"strings"
	"time"

	"github.com/mufarasyid/alurkasku/server/internal/modules/transfer/domain"
	accountDomain "github.com/mufarasyid/alurkasku/server/internal/modules/account/domain"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
	"github.com/mufarasyid/alurkasku/server/internal/shared/httpx"
)

type Service struct {
	repo        domain.TransferRepository
	accountRepo accountDomain.AccountRepository
}

func New(repo domain.TransferRepository, accountRepo accountDomain.AccountRepository) *Service {
	return &Service{repo: repo, accountRepo: accountRepo}
}

func (s *Service) Transfer(userID string, req domain.CreateTransferRequest) (*domain.Transfer, error) {
	from, err := s.ownedAccount(userID, req.FromAccountID, "from_account_id")
	if err != nil {
		return nil, err
	}
	to, err := s.ownedAccount(userID, req.ToAccountID, "to_account_id")
	if err != nil {
		return nil, err
	}
	if from.ID == to.ID {
		return nil, apperror.BadRequest("source and destination must be different accounts")
	}
	return s.execute(userID, domain.KindTransfer, from, to, req)
}

func (s *Service) Withdraw(userID string, req domain.CreateTransferRequest) (*domain.Transfer, error) {
	from, err := s.ownedAccount(userID, req.FromAccountID, "from_account_id")
	if err != nil {
		return nil, err
	}
	if from.Type != accountDomain.TypeBank && from.Type != accountDomain.TypeWallet {
		return nil, apperror.BadRequest("withdrawal source must be a Bank or Wallet account")
	}
	to, err := s.ownedAccount(userID, req.ToAccountID, "to_account_id")
	if err != nil {
		return nil, err
	}
	if to.Type != accountDomain.TypeCash {
		return nil, apperror.BadRequest("withdrawal destination must be a Cash account")
	}
	return s.execute(userID, domain.KindWithdrawal, from, to, req)
}

func (s *Service) ListTransfers(userID string, limit, offset int) ([]domain.Transfer, int64, error) {
	transfers, total, err := s.repo.ListByUser(userID, domain.KindTransfer, limit, offset)
	if err != nil {
		return nil, 0, apperror.Internal("failed to list transfers", err)
	}
	return transfers, total, nil
}

func (s *Service) ListWithdrawals(userID string, limit, offset int) ([]domain.Transfer, int64, error) {
	withdrawals, total, err := s.repo.ListByUser(userID, domain.KindWithdrawal, limit, offset)
	if err != nil {
		return nil, 0, apperror.Internal("failed to list withdrawals", err)
	}
	return withdrawals, total, nil
}

func (s *Service) execute(userID, kind string, from, to *accountDomain.Account, req domain.CreateTransferRequest) (*domain.Transfer, error) {
	t := &domain.Transfer{
		UserID:        userID,
		Kind:          kind,
		FromAccountID: from.ID,
		ToAccountID:   to.ID,
		Amount:        req.Amount,
		Fee:           req.Fee,
		Note:          strings.TrimSpace(req.Note),
		OccurredAt:    req.OccurredAt,
	}
	if t.Amount <= 0 {
		return nil, apperror.BadRequest("amount must be greater than 0")
	}
	if t.Fee < 0 {
		return nil, apperror.BadRequest("fee must not be negative")
	}
	if len(t.Note) > 255 {
		return nil, apperror.BadRequest("note must be at most 255 characters")
	}
	if t.OccurredAt.IsZero() {
		t.OccurredAt = time.Now()
	}
	if from.Balance < t.Amount+t.Fee {
		return nil, apperror.BadRequest("insufficient account balance")
	}
	if err := s.repo.Create(t); err != nil {
		return nil, apperror.Internal("failed to create transfer", err)
	}
	return t, nil
}

func (s *Service) ownedAccount(userID, id, field string) (*accountDomain.Account, error) {
	id = strings.TrimSpace(id)
	if _, err := httpx.ParseID(id); err != nil {
		return nil, apperror.BadRequest("invalid " + field)
	}
	account, err := s.accountRepo.GetByID(userID, id)
	if err != nil {
		return nil, apperror.Internal("failed to get account", err)
	}
	if account == nil {
		return nil, apperror.BadRequest("account not found")
	}
	return account, nil
}
