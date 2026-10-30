package bootstrap

import (
	"context"
	"fmt"
	"net/http"

	"github.com/mufarasyid/alurkasku/server/internal/config"
	authDomain "github.com/mufarasyid/alurkasku/server/internal/modules/auth/domain"
	authRepo "github.com/mufarasyid/alurkasku/server/internal/modules/auth/repository"
	authRoute "github.com/mufarasyid/alurkasku/server/internal/modules/auth/route"
	authService "github.com/mufarasyid/alurkasku/server/internal/modules/auth/service"
	userDomain "github.com/mufarasyid/alurkasku/server/internal/modules/user/domain"
	userRepo "github.com/mufarasyid/alurkasku/server/internal/modules/user/repository"
	userRoute "github.com/mufarasyid/alurkasku/server/internal/modules/user/route"
	userService "github.com/mufarasyid/alurkasku/server/internal/modules/user/service"
	"github.com/mufarasyid/alurkasku/server/internal/platform/database"
	"github.com/mufarasyid/alurkasku/server/internal/platform/logger"
	"github.com/mufarasyid/alurkasku/server/internal/platform/security"
	"github.com/mufarasyid/alurkasku/server/internal/router"
	"github.com/mufarasyid/alurkasku/server/internal/shared/middleware"
)

type App struct {
	Handler  http.Handler
	Postgres *database.Postgres
	Logger   *logger.Logger
	Config   *config.Config
}

func LoadConfig() (*config.Config, error) {
	return config.Load()
}

func NewApp(cfg *config.Config) (*App, error) {
	log, err := logger.New(cfg.Logger.Level, cfg.Logger.Pretty)
	if err != nil {
		return nil, fmt.Errorf("failed to init logger: %w", err)
	}

	dbCfg := database.DatabaseConfig{
		Host:            cfg.DB.Host,
		Port:            cfg.DB.Port,
		User:            cfg.DB.User,
		Password:        cfg.DB.Password,
		Name:            cfg.DB.Name,
		SSLMode:         cfg.DB.SSLMode,
		MaxOpenConns:    cfg.DB.MaxOpenConns,
		MaxIdleConns:    cfg.DB.MaxIdleConns,
		ConnMaxLifetime: cfg.DB.ConnMaxLifetime,
	}

	postgres, err := database.New(context.Background(), dbCfg, log.Logger)
	if err != nil {
		return nil, err
	}

	jwtMgr := security.NewManager(cfg.JWT.Secret, cfg.JWT.AccessTokenExpiry, cfg.JWT.RefreshTokenExpiry)

	userRepository := userRepo.NewPostgresRepository(postgres.DB)
	userSvc := userService.New(userRepository)

	authRepository := authRepo.NewPostgresRepository(postgres.DB)
	authSvc := authService.New(authRepository, userRepository, userSvc, jwtMgr, cfg.JWT.AccessTokenExpiry, cfg.JWT.RefreshTokenExpiry)

	r := router.New()

	logMiddleware := func(next http.Handler) http.Handler {
		return middleware.Logging(next, log.Logger)
	}

	userRoute.Setup(r, userSvc, logMiddleware)
	authRoute.Setup(r, authSvc, logMiddleware)

	// Global middleware stack (outermost applied last)
	handler := middleware.JSON(r.Handler())
	handler = middleware.Recovery(handler, log.Logger)
	handler = middleware.Logging(handler, log.Logger)
	r.Wrap(func(h http.Handler) http.Handler { return handler })

	return &App{
		Handler:  r.Handler(),
		Postgres: postgres,
		Logger:   log,
		Config:   cfg,
	}, nil
}

func (a *App) Close() error {
	return a.Postgres.Close()
}

// Compile-time interface checks
var (
	_ userDomain.UserRepository         = (*userRepo.PostgresRepository)(nil)
	_ authDomain.RefreshTokenRepository = (*authRepo.PostgresRepository)(nil)
)
