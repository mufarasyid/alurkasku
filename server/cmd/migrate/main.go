package main

import (
	"database/sql"
	"fmt"
	"log/slog"
	"os"

	_ "github.com/lib/pq"

	"github.com/mufarasyid/alurkasku/server/internal/config"
	"github.com/mufarasyid/alurkasku/server/internal/platform/database"
)

func main() {
	if err := run(); err != nil {
		slog.Error("migration failed", "error", err)
		os.Exit(1)
	}
}

func run() error {
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

	dir := os.Getenv("MIGRATIONS_DIR")
	if dir == "" {
		dir = "db/migrations"
	}

	if err := database.RunMigrations(db, dir); err != nil {
		return err
	}

	slog.Info("migrations applied successfully", "dir", dir)
	return nil
}
