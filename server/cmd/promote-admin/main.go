package main

import (
	"database/sql"
	"errors"
	"flag"
	"fmt"
	"os"

	"github.com/mufarasyid/alurkasku/server/internal/config"

	_ "github.com/lib/pq"
)

// promote-admin promotes an existing user to the admin role (or back to user).
//
// Usage:
//
//	go run ./cmd/promote-admin -email admin@example.com -role admin
//	go run ./cmd/promote-admin -email admin@example.com -role user
func main() {
	email := flag.String("email", "", "email of the user to promote/demote")
	role := flag.String("role", "admin", "target role: admin or user")
	flag.Parse()

	if err := run(*email, *role); err != nil {
		fmt.Fprintln(os.Stderr, "promote-admin:", err)
		os.Exit(1)
	}
}

func run(email, role string) error {
	if email == "" {
		return errors.New("-email is required")
	}
	if role != "admin" && role != "user" {
		return errors.New("-role must be admin or user")
	}

	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("failed to load config: %w", err)
	}

	db, err := sql.Open("postgres", cfg.DSN())
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	res, err := db.Exec(
		`UPDATE users SET role = $1, updated_at = NOW() WHERE email = $2 AND deleted_at IS NULL`,
		role, email,
	)
	if err != nil {
		return fmt.Errorf("failed to update role: %w", err)
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to read affected rows: %w", err)
	}
	if affected == 0 {
		return fmt.Errorf("no active user with email %q", email)
	}

	fmt.Printf("promoted %q to role %q\n", email, role)
	return nil
}
