package service

import (
	"testing"

	catDomain "github.com/mufarasyid/alurkasku/server/internal/modules/category/domain"
	"github.com/mufarasyid/alurkasku/server/internal/modules/patungan/domain"
	userDomain "github.com/mufarasyid/alurkasku/server/internal/modules/user/domain"
)

const (
	testOwnerID  = "11111111-1111-4111-8111-111111111111"
	testMemberID = "22222222-2222-4222-8222-222222222222"
	testGroupID  = "33333333-3333-4333-8333-333333333333"
)

type fakeRepo struct {
	group             *domain.Group
	summary           *domain.Summary
	hasHistory        bool
	expense           *domain.Expense
	deleteExpense     bool
	deleteSettle      bool
	deleteParticipant bool
}

func (f *fakeRepo) CreateGroup(*domain.Group, []domain.Participant) error { return nil }
func (f *fakeRepo) ListGroups(string, int, int) ([]domain.Group, int64, error) { return nil, 0, nil }
func (f *fakeRepo) GetGroup(string, string) (*domain.Group, error)        { return f.group, nil }
func (f *fakeRepo) UpdateGroup(string, string, string, string) (*domain.Group, error) {
	return f.group, nil
}
func (f *fakeRepo) DeleteGroup(string, string) error { return nil }
func (f *fakeRepo) ListParticipants(string) ([]domain.Participant, error) {
	return []domain.Participant{{ID: testMemberID, GroupID: testGroupID, DisplayName: "Budi"}}, nil
}
func (f *fakeRepo) GetParticipant(string, string) (*domain.Participant, error) {
	return &domain.Participant{ID: testMemberID, GroupID: testGroupID, DisplayName: "Budi"}, nil
}
func (f *fakeRepo) AddParticipant(*domain.Participant) error { return nil }
func (f *fakeRepo) DeleteParticipant(string, string) error {
	f.deleteParticipant = true
	return nil
}
func (f *fakeRepo) LinkParticipant(string, string, string) (*domain.Participant, error) {
	return &domain.Participant{ID: testMemberID}, nil
}
func (f *fakeRepo) CreateExpense(*domain.Expense, []domain.Split) error { return nil }
func (f *fakeRepo) ListExpenses(string, int, int) ([]domain.Expense, int64, error) { return nil, 0, nil }
func (f *fakeRepo) GetExpense(string, string) (*domain.Expense, error)  { return f.expense, nil }
func (f *fakeRepo) DeleteExpense(string, string) error {
	f.deleteExpense = true
	return nil
}
func (f *fakeRepo) CreateSettlement(*domain.Settlement) error { return nil }
func (f *fakeRepo) ListSettlements(string, int, int) ([]domain.Settlement, int64, error) {
	return nil, 0, nil
}
func (f *fakeRepo) DeleteSettlement(string, string) error {
	f.deleteSettle = true
	return nil
}
func (f *fakeRepo) HasParticipantHistory(string, string) (bool, error) { return f.hasHistory, nil }
func (f *fakeRepo) GetSummary(string) (*domain.Summary, error)         { return f.summary, nil }

type fakeUserRepo struct {
	user *userDomain.User
}

func (f *fakeUserRepo) Create(*userDomain.User) error { return nil }
func (f *fakeUserRepo) GetByID(string) (*userDomain.User, error) {
	return f.user, nil
}
func (f *fakeUserRepo) GetByEmail(string) (*userDomain.User, error) {
	return f.user, nil
}
func (f *fakeUserRepo) Update(*userDomain.User) error { return nil }
func (f *fakeUserRepo) Delete(string) error           { return nil }
func (f *fakeUserRepo) List(int, int) ([]userDomain.User, int64, error) {
	return nil, 0, nil
}

type fakeCatRepo struct {
	cat *catDomain.Category
}

func (f *fakeCatRepo) Create(*catDomain.Category) error { return nil }
func (f *fakeCatRepo) GetByID(string, string) (*catDomain.Category, error) {
	return f.cat, nil
}
func (f *fakeCatRepo) Update(*catDomain.Category) error { return nil }
func (f *fakeCatRepo) Delete(string, string) (int64, error) {
	return 0, nil
}
func (f *fakeCatRepo) BulkDelete(string, []string) (int64, error) { return 0, nil }
func (f *fakeCatRepo) ListByUser(string, catDomain.ListFilters) ([]catDomain.Category, int64, error) {
	return nil, 0, nil
}
func (f *fakeCatRepo) CountByUser(string) (int, error) { return 0, nil }

var _ domain.Repository = (*fakeRepo)(nil)
var _ userDomain.UserRepository = (*fakeUserRepo)(nil)
var _ catDomain.CategoryRepository = (*fakeCatRepo)(nil)

func newSvc(repo *fakeRepo) *Service {
	return New(repo, &fakeUserRepo{user: &userDomain.User{ID: testOwnerID}}, &fakeCatRepo{})
}

func TestDeleteMemberBlockedWhenHasHistory(t *testing.T) {
	repo := &fakeRepo{
		group:      &domain.Group{ID: testGroupID, CreatorUserID: testOwnerID, Name: "Padel"},
		summary:    &domain.Summary{Balances: []domain.Balance{{MemberID: testMemberID, Net: 0}}},
		hasHistory: true,
	}
	svc := newSvc(repo)
	if err := svc.DeleteMember(testOwnerID, testGroupID, testMemberID); err == nil {
		t.Fatal("expected error when member has history")
	}
	if repo.deleteParticipant {
		t.Fatal("should not delete member with history")
	}
}

func TestDeleteMemberAllowedWhenNoHistoryAndZeroNet(t *testing.T) {
	repo := &fakeRepo{
		group:      &domain.Group{ID: testGroupID, CreatorUserID: testOwnerID},
		summary:    &domain.Summary{Balances: []domain.Balance{{MemberID: testMemberID, Net: 0}}},
		hasHistory: false,
	}
	svc := newSvc(repo)
	if err := svc.DeleteMember(testOwnerID, testGroupID, testMemberID); err != nil {
		t.Fatalf("expected no error: %v", err)
	}
	if !repo.deleteParticipant {
		t.Fatal("expected member deleted")
	}
}

func TestDeleteSettlementOnlyOwner(t *testing.T) {
	repo := &fakeRepo{group: &domain.Group{ID: testGroupID, CreatorUserID: testOwnerID}}
	svc := newSvc(repo)
	err := svc.DeleteSettlement("99999999-9999-4999-8999-999999999999", testGroupID, testMemberID)
	if err == nil {
		t.Fatal("expected forbidden for non-owner")
	}
	if repo.deleteSettle {
		t.Fatal("non-owner should not delete settlement")
	}
	if err := svc.DeleteSettlement(testOwnerID, testGroupID, testMemberID); err != nil {
		t.Fatalf("owner should delete: %v", err)
	}
}

func TestCreateExpenseRejectsUnknownCategory(t *testing.T) {
	repo := &fakeRepo{group: &domain.Group{ID: testGroupID, CreatorUserID: testOwnerID}}
	svc := New(repo, &fakeUserRepo{user: &userDomain.User{ID: testOwnerID}}, &fakeCatRepo{cat: nil})
	catID := "44444444-4444-4444-8444-444444444444"
	_, err := svc.CreateExpense(testOwnerID, testGroupID, domain.CreateExpenseRequest{
		PayerMemberID: testMemberID,
		CategoryID:    &catID,
		TotalAmount:   100000,
		SplitType:     domain.SplitEqual,
		Splits:        []domain.SplitInput{{MemberID: testMemberID}},
	})
	if err == nil {
		t.Fatal("expected error for unknown category")
	}
}
