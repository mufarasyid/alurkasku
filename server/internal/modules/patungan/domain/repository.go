package domain

type Repository interface {
	CreateGroup(g *Group, members []Participant) error
	ListGroups(userID string, limit, offset int) ([]Group, int64, error)
	GetGroup(userID, groupID string) (*Group, error)
	UpdateGroup(userID, groupID, name, note string) (*Group, error)
	DeleteGroup(userID, groupID string) error
	ListParticipants(groupID string) ([]Participant, error)
	GetParticipant(groupID, memberID string) (*Participant, error)
	AddParticipant(p *Participant) error
	DeleteParticipant(groupID, memberID string) error
	LinkParticipant(groupID, memberID, linkedUserID string) (*Participant, error)
	CreateExpense(e *Expense, splits []Split) error
	ListExpenses(groupID string, limit, offset int) ([]Expense, int64, error)
	GetExpense(groupID, expenseID string) (*Expense, error)
	DeleteExpense(groupID, expenseID string) error
	CreateSettlement(s *Settlement) error
	ListSettlements(groupID string, limit, offset int) ([]Settlement, int64, error)
	DeleteSettlement(groupID, settlementID string) error
	HasParticipantHistory(groupID, memberID string) (bool, error)
	GetSummary(groupID string) (*Summary, error)
}
