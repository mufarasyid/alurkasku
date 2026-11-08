package service

import (
	"sort"
	"strings"
	"time"

	catDomain "github.com/mufarasyid/alurkasku/server/internal/modules/category/domain"
	"github.com/mufarasyid/alurkasku/server/internal/modules/patungan/domain"
	userDomain "github.com/mufarasyid/alurkasku/server/internal/modules/user/domain"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
	"github.com/mufarasyid/alurkasku/server/internal/shared/httpx"
)

type Service struct {
	repo         domain.Repository
	userRepo     userDomain.UserRepository
	categoryRepo catDomain.CategoryRepository
}

func New(repo domain.Repository, userRepo userDomain.UserRepository, categoryRepo ...catDomain.CategoryRepository) *Service {
	s := &Service{repo: repo, userRepo: userRepo}
	if len(categoryRepo) > 0 {
		s.categoryRepo = categoryRepo[0]
	}
	return s
}

func validID(id, field string) (string, error) {
	id = strings.TrimSpace(id)
	if _, err := httpx.ParseID(id); err != nil {
		return "", apperror.BadRequest("invalid " + field)
	}
	return id, nil
}

func (s *Service) accessibleGroup(userID, groupID string) (*domain.Group, bool, error) {
	groupID, err := validID(groupID, "group id")
	if err != nil {
		return nil, false, err
	}
	g, err := s.repo.GetGroup(userID, groupID)
	if err != nil {
		return nil, false, apperror.Internal("failed to get group", err)
	}
	if g == nil {
		return nil, false, apperror.NotFound("group tidak ditemukan")
	}
	return g, g.CreatorUserID == userID, nil
}

func (s *Service) resolveUserID(linked *string, email string) (*string, error) {
	if linked != nil && strings.TrimSpace(*linked) != "" {
		id, err := validID(*linked, "linked_user_id")
		if err != nil {
			return nil, err
		}
		u, err := s.userRepo.GetByID(id)
		if err != nil {
			return nil, apperror.Internal("failed to get user", err)
		}
		if u == nil {
			return nil, apperror.BadRequest("user tidak ditemukan")
		}
		return &id, nil
	}
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return nil, nil
	}
	u, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return nil, apperror.Internal("failed to get user", err)
	}
	if u == nil {
		return nil, apperror.BadRequest("user dengan email ini belum register")
	}
	id := u.ID
	return &id, nil
}

func normalizeMembers(inputs []domain.MemberInput) []domain.Participant {
	out := make([]domain.Participant, 0, len(inputs))
	for _, m := range inputs {
		name := strings.TrimSpace(m.DisplayName)
		if name == "" {
			continue
		}
		out = append(out, domain.Participant{DisplayName: name})
	}
	return out
}

func (s *Service) CreateGroup(userID string, req domain.CreateGroupRequest) (*domain.Group, []domain.Participant, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, nil, apperror.BadRequest("nama group wajib diisi")
	}
	if len(name) > 120 {
		return nil, nil, apperror.BadRequest("nama group maksimal 120 karakter")
	}
	if len(strings.TrimSpace(req.Note)) > 255 {
		return nil, nil, apperror.BadRequest("note maksimal 255 karakter")
	}

	creatorUser, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, nil, apperror.Internal("failed to get user", err)
	}
	if creatorUser == nil {
		return nil, nil, apperror.Unauthorized("authentication required")
	}
	creatorName := strings.TrimSpace(creatorUser.Name)
	if creatorName == "" {
		creatorName = "Saya"
	}

	manual := normalizeMembers(req.Members)
	if len(manual) > 50 {
		return nil, nil, apperror.BadRequest("maksimal 50 peserta per group")
	}

	seen := map[string]bool{strings.ToLower(creatorName): true}
	for _, m := range manual {
		key := strings.ToLower(m.DisplayName)
		if seen[key] {
			return nil, nil, apperror.BadRequest("nama peserta dobel: " + m.DisplayName)
		}
		seen[key] = true
	}

	members := []domain.Participant{{DisplayName: creatorName, LinkedUserID: &userID}}
	for _, in := range req.Members {
		in.DisplayName = strings.TrimSpace(in.DisplayName)
		if in.DisplayName == "" {
			continue
		}
		linked, err := s.resolveUserID(in.LinkedUserID, in.Email)
		if err != nil {
			return nil, nil, err
		}
		members = append(members, domain.Participant{DisplayName: in.DisplayName, LinkedUserID: linked})
	}

	g := &domain.Group{CreatorUserID: userID, Name: name, Note: strings.TrimSpace(req.Note)}
	if err := s.repo.CreateGroup(g, members); err != nil {
		if ae, ok := err.(*apperror.AppError); ok {
			return nil, nil, ae
		}
		return nil, nil, apperror.Internal("failed to create group", err)
	}
	participants, err := s.repo.ListParticipants(g.ID)
	if err != nil {
		return nil, nil, apperror.Internal("failed to list participants", err)
	}
	return g, participants, nil
}

func (s *Service) ListGroups(userID string) ([]domain.Group, error) {
	groups, err := s.repo.ListGroups(userID)
	if err != nil {
		return nil, apperror.Internal("failed to list groups", err)
	}
	if groups == nil {
		groups = []domain.Group{}
	}
	return groups, nil
}

func (s *Service) GetGroup(userID, groupID string) (*domain.Group, []domain.Participant, error) {
	g, _, err := s.accessibleGroup(userID, groupID)
	if err != nil {
		return nil, nil, err
	}
	participants, err := s.repo.ListParticipants(g.ID)
	if err != nil {
		return nil, nil, apperror.Internal("failed to list participants", err)
	}
	if participants == nil {
		participants = []domain.Participant{}
	}
	return g, participants, nil
}

func (s *Service) UpdateGroup(userID, groupID string, req domain.UpdateGroupRequest) (*domain.Group, error) {
	g, isOwner, err := s.accessibleGroup(userID, groupID)
	if err != nil {
		return nil, err
	}
	if !isOwner {
		return nil, apperror.Forbidden("hanya pemilik group yang bisa mengubah group")
	}
	name := strings.TrimSpace(req.Name)
	if name == "" || len(name) > 120 {
		return nil, apperror.BadRequest("nama group maksimal 120 karakter")
	}
	if len(strings.TrimSpace(req.Note)) > 255 {
		return nil, apperror.BadRequest("note maksimal 255 karakter")
	}
	updated, err := s.repo.UpdateGroup(userID, g.ID, name, strings.TrimSpace(req.Note))
	if err != nil {
		if ae, ok := err.(*apperror.AppError); ok {
			return nil, ae
		}
		return nil, apperror.Internal("failed to update group", err)
	}
	return updated, nil
}

func (s *Service) DeleteGroup(userID, groupID string) error {
	g, isOwner, err := s.accessibleGroup(userID, groupID)
	if err != nil {
		return err
	}
	if !isOwner {
		return apperror.Forbidden("hanya pemilik group yang bisa menghapus group")
	}
	if err := s.repo.DeleteGroup(userID, g.ID); err != nil {
		if ae, ok := err.(*apperror.AppError); ok {
			return ae
		}
		return apperror.Internal("failed to delete group", err)
	}
	return nil
}

func (s *Service) AddMember(userID, groupID string, req domain.AddMemberRequest) (*domain.Participant, error) {
	g, _, err := s.accessibleGroup(userID, groupID)
	if err != nil {
		return nil, err
	}
	name := strings.TrimSpace(req.DisplayName)
	if name == "" || len(name) > 80 {
		return nil, apperror.BadRequest("nama peserta 1 sampai 80 karakter")
	}
	linked, err := s.resolveUserID(req.LinkedUserID, req.Email)
	if err != nil {
		return nil, err
	}
	p := &domain.Participant{GroupID: g.ID, DisplayName: name, LinkedUserID: linked}
	if err := s.repo.AddParticipant(p); err != nil {
		if ae, ok := err.(*apperror.AppError); ok {
			return nil, ae
		}
		return nil, apperror.Internal("failed to add participant", err)
	}
	return p, nil
}

func (s *Service) DeleteMember(userID, groupID, memberID string) error {
	g, _, err := s.accessibleGroup(userID, groupID)
	if err != nil {
		return err
	}
	memberID, err = validID(memberID, "member id")
	if err != nil {
		return err
	}
	participant, err := s.repo.GetParticipant(g.ID, memberID)
	if err != nil {
		return apperror.Internal("failed to get participant", err)
	}
	if participant == nil {
		return apperror.NotFound("peserta tidak ditemukan")
	}
	sum, err := s.repo.GetSummary(g.ID)
	if err != nil {
		return apperror.Internal("failed to get summary", err)
	}
	for _, b := range sum.Balances {
		if b.MemberID == memberID && b.Net != 0 {
			return apperror.BadRequest("selesaikan sisa saldo dulu sebelum hapus peserta")
		}
	}
	hasHistory, err := s.repo.HasParticipantHistory(g.ID, memberID)
	if err != nil {
		return apperror.Internal("failed to check participant history", err)
	}
	if hasHistory {
		return apperror.BadRequest("peserta punya riwayat pengeluaran atau pelunasan, tidak bisa dihapus")
	}
	if err := s.repo.DeleteParticipant(g.ID, memberID); err != nil {
		if ae, ok := err.(*apperror.AppError); ok {
			return ae
		}
		return apperror.Internal("failed to delete participant", err)
	}
	return nil
}

func (s *Service) LinkMember(userID, groupID, memberID string, req domain.LinkMemberRequest) (*domain.Participant, error) {
	g, _, err := s.accessibleGroup(userID, groupID)
	if err != nil {
		return nil, err
	}
	memberID, err = validID(memberID, "member id")
	if err != nil {
		return nil, err
	}
	linked, err := s.resolveUserID(req.LinkedUserID, req.Email)
	if err != nil {
		return nil, err
	}
	if linked == nil {
		return nil, apperror.BadRequest("email atau linked_user_id wajib diisi")
	}
	participant, err := s.repo.LinkParticipant(g.ID, memberID, *linked)
	if err != nil {
		if ae, ok := err.(*apperror.AppError); ok {
			return nil, ae
		}
		return nil, apperror.Internal("failed to link participant", err)
	}
	return participant, nil
}

func computeSplits(totalAmount int64, splitType string, inputs []domain.SplitInput) ([]domain.Split, error) {
	if len(inputs) == 0 {
		return nil, apperror.BadRequest("splits tidak boleh kosong")
	}
	if len(inputs) > 50 {
		return nil, apperror.BadRequest("maksimal 50 splits per expense")
	}
	switch splitType {
	case domain.SplitEqual, "":
		n := int64(len(inputs))
		base := totalAmount / n
		rem := totalAmount % n
		out := make([]domain.Split, len(inputs))
		for i, in := range inputs {
			amt := base
			if int64(i) < rem {
				amt++
			}
			out[i] = domain.Split{MemberID: in.MemberID, ShareAmount: amt}
		}
		return out, nil
	case domain.SplitNominal:
		var sum int64
		out := make([]domain.Split, len(inputs))
		for i, in := range inputs {
			if in.ShareAmount < 0 {
				return nil, apperror.BadRequest("share_amount tidak boleh negatif")
			}
			sum += in.ShareAmount
			out[i] = domain.Split{MemberID: in.MemberID, ShareAmount: in.ShareAmount}
		}
		if sum != totalAmount {
			return nil, apperror.BadRequest("total splits harus sama dengan total expense")
		}
		return out, nil
	case domain.SplitPercent:
		var sumPercent int
		out := make([]domain.Split, len(inputs))
		var allocated int64
		for i, in := range inputs {
			if in.Percent < 0 || in.Percent > 100 {
				return nil, apperror.BadRequest("percent harus 0 sampai 100")
			}
			sumPercent += in.Percent
			amt := totalAmount * int64(in.Percent) / 100
			if i == len(inputs)-1 {
				amt = totalAmount - allocated
			} else {
				allocated += amt
			}
			out[i] = domain.Split{MemberID: in.MemberID, ShareAmount: amt}
		}
		if sumPercent != 100 {
			return nil, apperror.BadRequest("total percent harus 100")
		}
		return out, nil
	default:
		return nil, apperror.BadRequest("split_type harus salah satu dari: equal, percent, nominal")
	}
}

func simplifyDebts(balances []domain.Balance) []domain.DebtSuggestion {
	type entry struct {
		id   string
		name string
		net  int64
	}
	var creditors, debtors []entry
	for _, b := range balances {
		if b.Net > 0 {
			creditors = append(creditors, entry{b.MemberID, b.DisplayName, b.Net})
		} else if b.Net < 0 {
			debtors = append(debtors, entry{b.MemberID, b.DisplayName, -b.Net})
		}
	}
	sort.Slice(creditors, func(i, j int) bool { return creditors[i].net > creditors[j].net })
	sort.Slice(debtors, func(i, j int) bool { return debtors[i].net > debtors[j].net })

	var out []domain.DebtSuggestion
	ci, di := 0, 0
	for ci < len(creditors) && di < len(debtors) {
		amt := creditors[ci].net
		if debtors[di].net < amt {
			amt = debtors[di].net
		}
		out = append(out, domain.DebtSuggestion{
			FromMemberID: debtors[di].id, FromName: debtors[di].name,
			ToMemberID: creditors[ci].id, ToName: creditors[ci].name,
			Amount: amt,
		})
		creditors[ci].net -= amt
		debtors[di].net -= amt
		if creditors[ci].net == 0 {
			ci++
		}
		if debtors[di].net == 0 {
			di++
		}
	}
	if out == nil {
		out = []domain.DebtSuggestion{}
	}
	return out
}

func (s *Service) CreateExpense(userID, groupID string, req domain.CreateExpenseRequest) (*domain.Expense, error) {
	g, _, err := s.accessibleGroup(userID, groupID)
	if err != nil {
		return nil, err
	}
	payerID, err := validID(req.PayerMemberID, "payer_member_id")
	if err != nil {
		return nil, err
	}
	if req.TotalAmount <= 0 {
		return nil, apperror.BadRequest("total_amount harus lebih dari 0")
	}
	if len(strings.TrimSpace(req.Note)) > 255 {
		return nil, apperror.BadRequest("note maksimal 255 karakter")
	}
	occurredAt := req.OccurredAt
	if occurredAt.IsZero() {
		occurredAt = time.Now()
	}

	participants, err := s.repo.ListParticipants(g.ID)
	if err != nil {
		return nil, apperror.Internal("failed to list participants", err)
	}
	valid := map[string]bool{}
	for _, p := range participants {
		valid[p.ID] = true
	}
	if !valid[payerID] {
		return nil, apperror.BadRequest("payer tidak termasuk peserta group")
	}
	for _, sp := range req.Splits {
		if _, err := validID(sp.MemberID, "member_id"); err != nil {
			return nil, err
		}
		if !valid[sp.MemberID] {
			return nil, apperror.BadRequest("member split tidak termasuk peserta group")
		}
	}

	splits, err := computeSplits(req.TotalAmount, strings.TrimSpace(req.SplitType), req.Splits)
	if err != nil {
		return nil, err
	}

	categoryID := req.CategoryID
	if categoryID != nil {
		cid := strings.TrimSpace(*categoryID)
		if cid == "" {
			categoryID = nil
		} else {
			if _, err := httpx.ParseID(cid); err != nil {
				return nil, apperror.BadRequest("invalid category_id")
			}
			if s.categoryRepo != nil {
				cat, err := s.categoryRepo.GetByID(userID, cid)
				if err != nil {
					return nil, apperror.Internal("failed to get category", err)
				}
				if cat == nil {
					return nil, apperror.BadRequest("category not found")
				}
			}
			categoryID = &cid
		}
	}

	e := &domain.Expense{
		GroupID:         g.ID,
		PayerMemberID:   payerID,
		CreatedByUserID: userID,
		CategoryID:      categoryID,
		TotalAmount:     req.TotalAmount,
		Note:            strings.TrimSpace(req.Note),
		OccurredAt:      occurredAt,
	}
	if err := s.repo.CreateExpense(e, splits); err != nil {
		return nil, apperror.Internal("failed to create expense", err)
	}
	return e, nil
}

func (s *Service) ListExpenses(userID, groupID string) ([]domain.Expense, error) {
	g, _, err := s.accessibleGroup(userID, groupID)
	if err != nil {
		return nil, err
	}
	expenses, err := s.repo.ListExpenses(g.ID)
	if err != nil {
		return nil, apperror.Internal("failed to list expenses", err)
	}
	if expenses == nil {
		expenses = []domain.Expense{}
	}
	return expenses, nil
}

func (s *Service) DeleteExpense(userID, groupID, expenseID string) error {
	g, isOwner, err := s.accessibleGroup(userID, groupID)
	if err != nil {
		return err
	}
	expenseID, err = validID(expenseID, "expense id")
	if err != nil {
		return err
	}
	if !isOwner {
		expense, err := s.repo.GetExpense(g.ID, expenseID)
		if err != nil {
			return apperror.Internal("failed to get expense", err)
		}
		if expense == nil {
			return apperror.NotFound("expense tidak ditemukan")
		}
		if expense.CreatedByUserID != userID {
			return apperror.Forbidden("hanya pemilik group atau pencatat yang bisa menghapus expense")
		}
	}
	if err := s.repo.DeleteExpense(g.ID, expenseID); err != nil {
		if ae, ok := err.(*apperror.AppError); ok {
			return ae
		}
		return apperror.Internal("failed to delete expense", err)
	}
	return nil
}

func (s *Service) CreateSettlement(userID, groupID string, req domain.CreateSettlementRequest) (*domain.Settlement, error) {
	g, _, err := s.accessibleGroup(userID, groupID)
	if err != nil {
		return nil, err
	}
	fromID, err := validID(req.FromMemberID, "from_member_id")
	if err != nil {
		return nil, err
	}
	toID, err := validID(req.ToMemberID, "to_member_id")
	if err != nil {
		return nil, err
	}
	if fromID == toID {
		return nil, apperror.BadRequest("from_member_id dan to_member_id harus beda")
	}
	if req.Amount <= 0 {
		return nil, apperror.BadRequest("amount harus lebih dari 0")
	}
	if len(strings.TrimSpace(req.Note)) > 255 {
		return nil, apperror.BadRequest("note maksimal 255 karakter")
	}
	for _, id := range []string{fromID, toID} {
		p, err := s.repo.GetParticipant(g.ID, id)
		if err != nil {
			return nil, apperror.Internal("failed to get participant", err)
		}
		if p == nil {
			return nil, apperror.BadRequest("member tidak termasuk peserta group")
		}
	}
	occurredAt := req.OccurredAt
	if occurredAt.IsZero() {
		occurredAt = time.Now()
	}
	st := &domain.Settlement{
		GroupID:      g.ID,
		FromMemberID: fromID,
		ToMemberID:   toID,
		Amount:       req.Amount,
		Note:         strings.TrimSpace(req.Note),
		OccurredAt:   occurredAt,
	}
	if err := s.repo.CreateSettlement(st); err != nil {
		return nil, apperror.Internal("failed to create settlement", err)
	}
	return st, nil
}

func (s *Service) ListSettlements(userID, groupID string) ([]domain.Settlement, error) {
	g, _, err := s.accessibleGroup(userID, groupID)
	if err != nil {
		return nil, err
	}
	settlements, err := s.repo.ListSettlements(g.ID)
	if err != nil {
		return nil, apperror.Internal("failed to list settlements", err)
	}
	if settlements == nil {
		settlements = []domain.Settlement{}
	}
	return settlements, nil
}

func (s *Service) DeleteSettlement(userID, groupID, settlementID string) error {
	g, isOwner, err := s.accessibleGroup(userID, groupID)
	if err != nil {
		return err
	}
	if !isOwner {
		return apperror.Forbidden("hanya pemilik group yang bisa menghapus pelunasan")
	}
	settlementID, err = validID(settlementID, "settlement id")
	if err != nil {
		return err
	}
	if err := s.repo.DeleteSettlement(g.ID, settlementID); err != nil {
		if ae, ok := err.(*apperror.AppError); ok {
			return ae
		}
		return apperror.Internal("failed to delete settlement", err)
	}
	return nil
}

func (s *Service) GetSummary(userID, groupID string) (*domain.Summary, error) {
	g, _, err := s.accessibleGroup(userID, groupID)
	if err != nil {
		return nil, err
	}
	sum, err := s.repo.GetSummary(g.ID)
	if err != nil {
		return nil, apperror.Internal("failed to get summary", err)
	}
	sum.Suggestions = simplifyDebts(sum.Balances)
	return sum, nil
}
