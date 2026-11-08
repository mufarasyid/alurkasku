package domain

import "time"

type Group struct {
	ID            string    `json:"id"`
	CreatorUserID string    `json:"creator_user_id"`
	Name          string    `json:"name"`
	Note          string    `json:"note"`
	MemberCount   int       `json:"member_count"`
	TotalExpense  int64     `json:"total_expense"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type Participant struct {
	ID           string    `json:"id"`
	GroupID      string    `json:"group_id"`
	DisplayName  string    `json:"display_name"`
	LinkedUserID *string   `json:"linked_user_id"`
	IsGuest      bool      `json:"is_guest"`
	CreatedAt    time.Time `json:"created_at"`
}

type Split struct {
	ExpenseID   string `json:"expense_id"`
	MemberID    string `json:"member_id"`
	MemberName  string `json:"member_name"`
	ShareAmount int64  `json:"share_amount"`
}

type Expense struct {
	ID              string    `json:"id"`
	GroupID         string    `json:"group_id"`
	PayerMemberID   string    `json:"payer_member_id"`
	PayerName       string    `json:"payer_name"`
	CreatedByUserID string    `json:"created_by_user_id"`
	CategoryID      *string   `json:"category_id"`
	TotalAmount     int64     `json:"total_amount"`
	Note            string    `json:"note"`
	OccurredAt      time.Time `json:"occurred_at"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	Splits          []Split   `json:"splits"`
}

type Settlement struct {
	ID           string    `json:"id"`
	GroupID      string    `json:"group_id"`
	FromMemberID string    `json:"from_member_id"`
	FromName     string    `json:"from_name"`
	ToMemberID   string    `json:"to_member_id"`
	ToName       string    `json:"to_name"`
	Amount       int64     `json:"amount"`
	Note         string    `json:"note"`
	OccurredAt   time.Time `json:"occurred_at"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Balance struct {
	MemberID        string `json:"member_id"`
	DisplayName     string `json:"display_name"`
	IsGuest         bool   `json:"is_guest"`
	Paid            int64  `json:"paid"`
	Share           int64  `json:"share"`
	SettledPaid     int64  `json:"settled_paid"`
	SettledReceived int64  `json:"settled_received"`
	Net             int64  `json:"net"`
}

type DebtSuggestion struct {
	FromMemberID string `json:"from_member_id"`
	FromName     string `json:"from_name"`
	ToMemberID   string `json:"to_member_id"`
	ToName       string `json:"to_name"`
	Amount       int64  `json:"amount"`
}

type Summary struct {
	GroupID      string           `json:"group_id"`
	TotalExpense int64            `json:"total_expense"`
	Balances     []Balance        `json:"balances"`
	Suggestions  []DebtSuggestion `json:"suggestions"`
}

const (
	SplitEqual   = "equal"
	SplitPercent = "percent"
	SplitNominal = "nominal"
)

type MemberInput struct {
	DisplayName  string  `json:"display_name"`
	LinkedUserID *string `json:"linked_user_id"`
	Email        string  `json:"email"`
}

type CreateGroupRequest struct {
	Name    string        `json:"name"`
	Note    string        `json:"note"`
	Members []MemberInput `json:"members"`
}

type UpdateGroupRequest struct {
	Name string `json:"name"`
	Note string `json:"note"`
}

type AddMemberRequest struct {
	DisplayName  string  `json:"display_name"`
	LinkedUserID *string `json:"linked_user_id"`
	Email        string  `json:"email"`
}

type LinkMemberRequest struct {
	Email        string  `json:"email"`
	LinkedUserID *string `json:"linked_user_id"`
}

type SplitInput struct {
	MemberID    string `json:"member_id"`
	ShareAmount int64  `json:"share_amount"`
	Percent     int    `json:"percent"`
}

type CreateExpenseRequest struct {
	PayerMemberID string       `json:"payer_member_id"`
	CategoryID    *string      `json:"category_id"`
	TotalAmount   int64        `json:"total_amount"`
	Note          string       `json:"note"`
	OccurredAt    time.Time    `json:"occurred_at"`
	SplitType     string       `json:"split_type"`
	Splits        []SplitInput `json:"splits"`
}

type CreateSettlementRequest struct {
	FromMemberID string    `json:"from_member_id"`
	ToMemberID   string    `json:"to_member_id"`
	Amount       int64     `json:"amount"`
	Note         string    `json:"note"`
	OccurredAt   time.Time `json:"occurred_at"`
}

type GroupResponse struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Note          string    `json:"note"`
	CreatorUserID string    `json:"creator_user_id"`
	MemberCount   int       `json:"member_count"`
	TotalExpense  int64     `json:"total_expense"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ParticipantResponse struct {
	ID           string    `json:"id"`
	GroupID      string    `json:"group_id"`
	DisplayName  string    `json:"display_name"`
	LinkedUserID *string   `json:"linked_user_id"`
	IsGuest      bool      `json:"is_guest"`
	CreatedAt    time.Time `json:"created_at"`
}

type SplitResponse struct {
	MemberID    string `json:"member_id"`
	MemberName  string `json:"member_name"`
	ShareAmount int64  `json:"share_amount"`
}

type ExpenseResponse struct {
	ID            string          `json:"id"`
	GroupID       string          `json:"group_id"`
	PayerMemberID string          `json:"payer_member_id"`
	PayerName     string          `json:"payer_name"`
	CategoryID    *string         `json:"category_id"`
	TotalAmount   int64           `json:"total_amount"`
	Note          string          `json:"note"`
	OccurredAt    time.Time       `json:"occurred_at"`
	CreatedAt     time.Time       `json:"created_at"`
	Splits        []SplitResponse `json:"splits"`
}

type SettlementResponse struct {
	ID           string    `json:"id"`
	GroupID      string    `json:"group_id"`
	FromMemberID string    `json:"from_member_id"`
	FromName     string    `json:"from_name"`
	ToMemberID   string    `json:"to_member_id"`
	ToName       string    `json:"to_name"`
	Amount       int64     `json:"amount"`
	Note         string    `json:"note"`
	OccurredAt   time.Time `json:"occurred_at"`
	CreatedAt    time.Time `json:"created_at"`
}

type BalanceResponse struct {
	MemberID        string `json:"member_id"`
	DisplayName     string `json:"display_name"`
	IsGuest         bool   `json:"is_guest"`
	Paid            int64  `json:"paid"`
	Share           int64  `json:"share"`
	SettledPaid     int64  `json:"settled_paid"`
	SettledReceived int64  `json:"settled_received"`
	Net             int64  `json:"net"`
}

type DebtSuggestionResponse struct {
	FromMemberID string `json:"from_member_id"`
	FromName     string `json:"from_name"`
	ToMemberID   string `json:"to_member_id"`
	ToName       string `json:"to_name"`
	Amount       int64  `json:"amount"`
}

type SummaryResponse struct {
	GroupID      string                   `json:"group_id"`
	TotalExpense int64                    `json:"total_expense"`
	Balances     []BalanceResponse        `json:"balances"`
	Suggestions  []DebtSuggestionResponse `json:"suggestions"`
}

func ToGroupResponse(g Group) GroupResponse {
	return GroupResponse{
		ID:            g.ID,
		Name:          g.Name,
		Note:          g.Note,
		CreatorUserID: g.CreatorUserID,
		MemberCount:   g.MemberCount,
		TotalExpense:  g.TotalExpense,
		CreatedAt:     g.CreatedAt,
		UpdatedAt:     g.UpdatedAt,
	}
}

func ToParticipantResponse(p Participant) ParticipantResponse {
	return ParticipantResponse{
		ID:           p.ID,
		GroupID:      p.GroupID,
		DisplayName:  p.DisplayName,
		LinkedUserID: p.LinkedUserID,
		IsGuest:      p.LinkedUserID == nil,
		CreatedAt:    p.CreatedAt,
	}
}

func ToExpenseResponse(e Expense) ExpenseResponse {
	splits := make([]SplitResponse, len(e.Splits))
	for i, s := range e.Splits {
		splits[i] = SplitResponse{
			MemberID:    s.MemberID,
			MemberName:  s.MemberName,
			ShareAmount: s.ShareAmount,
		}
	}
	return ExpenseResponse{
		ID:            e.ID,
		GroupID:       e.GroupID,
		PayerMemberID: e.PayerMemberID,
		PayerName:     e.PayerName,
		CategoryID:    e.CategoryID,
		TotalAmount:   e.TotalAmount,
		Note:          e.Note,
		OccurredAt:    e.OccurredAt,
		CreatedAt:     e.CreatedAt,
		Splits:        splits,
	}
}

func ToSettlementResponse(s Settlement) SettlementResponse {
	return SettlementResponse{
		ID:           s.ID,
		GroupID:      s.GroupID,
		FromMemberID: s.FromMemberID,
		FromName:     s.FromName,
		ToMemberID:   s.ToMemberID,
		ToName:       s.ToName,
		Amount:       s.Amount,
		Note:         s.Note,
		OccurredAt:   s.OccurredAt,
		CreatedAt:    s.CreatedAt,
	}
}

func ToSummaryResponse(sum Summary) SummaryResponse {
	balances := make([]BalanceResponse, len(sum.Balances))
	for i, b := range sum.Balances {
		balances[i] = BalanceResponse{
			MemberID:        b.MemberID,
			DisplayName:     b.DisplayName,
			IsGuest:         b.IsGuest,
			Paid:            b.Paid,
			Share:           b.Share,
			SettledPaid:     b.SettledPaid,
			SettledReceived: b.SettledReceived,
			Net:             b.Net,
		}
	}
	suggestions := make([]DebtSuggestionResponse, len(sum.Suggestions))
	for i, s := range sum.Suggestions {
		suggestions[i] = DebtSuggestionResponse{
			FromMemberID: s.FromMemberID,
			FromName:     s.FromName,
			ToMemberID:   s.ToMemberID,
			ToName:       s.ToName,
			Amount:       s.Amount,
		}
	}
	return SummaryResponse{
		GroupID:      sum.GroupID,
		TotalExpense: sum.TotalExpense,
		Balances:     balances,
		Suggestions:  suggestions,
	}
}
