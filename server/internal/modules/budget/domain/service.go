package domain

type BudgetSeeder interface {
	SeedDefaults(userID string) error
}
