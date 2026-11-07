package domain

type CategorySeeder interface {
	SeedDefaults(userID string) error
}
