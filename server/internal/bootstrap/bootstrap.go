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
	accountRepo "github.com/mufarasyid/alurkasku/server/internal/modules/account/repository"
	accountRoute "github.com/mufarasyid/alurkasku/server/internal/modules/account/route"
	accountService "github.com/mufarasyid/alurkasku/server/internal/modules/account/service"
	budgetRepo "github.com/mufarasyid/alurkasku/server/internal/modules/budget/repository"
	budgetRoute "github.com/mufarasyid/alurkasku/server/internal/modules/budget/route"
	budgetService "github.com/mufarasyid/alurkasku/server/internal/modules/budget/service"
	catDomain "github.com/mufarasyid/alurkasku/server/internal/modules/category/domain"
	catRepo "github.com/mufarasyid/alurkasku/server/internal/modules/category/repository"
	catRoute "github.com/mufarasyid/alurkasku/server/internal/modules/category/route"
	catService "github.com/mufarasyid/alurkasku/server/internal/modules/category/service"
	transactionRepo "github.com/mufarasyid/alurkasku/server/internal/modules/transaction/repository"
	transactionRoute "github.com/mufarasyid/alurkasku/server/internal/modules/transaction/route"
	transactionService "github.com/mufarasyid/alurkasku/server/internal/modules/transaction/service"
	transferRepo "github.com/mufarasyid/alurkasku/server/internal/modules/transfer/repository"
	transferRoute "github.com/mufarasyid/alurkasku/server/internal/modules/transfer/route"
	transferService "github.com/mufarasyid/alurkasku/server/internal/modules/transfer/service"
	userDomain "github.com/mufarasyid/alurkasku/server/internal/modules/user/domain"
	userRepo "github.com/mufarasyid/alurkasku/server/internal/modules/user/repository"
	userRoute "github.com/mufarasyid/alurkasku/server/internal/modules/user/route"
	userService "github.com/mufarasyid/alurkasku/server/internal/modules/user/service"
	"github.com/mufarasyid/alurkasku/server/internal/platform/database"
	"github.com/mufarasyid/alurkasku/server/internal/platform/logger"
	"github.com/mufarasyid/alurkasku/server/internal/platform/security"
	"github.com/mufarasyid/alurkasku/server/internal/router"
	"github.com/mufarasyid/alurkasku/server/internal/shared/middleware"
	subRepo "github.com/mufarasyid/alurkasku/server/internal/modules/subscription/repository"
	subService "github.com/mufarasyid/alurkasku/server/internal/modules/subscription/service"
	subRoute "github.com/mufarasyid/alurkasku/server/internal/modules/subscription/route"
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

	categoryRepository := catRepo.NewPostgresRepository(postgres.DB)
	categorySvc := catService.New(categoryRepository)

	authRepository := authRepo.NewPostgresRepository(postgres.DB)
	authSvc := authService.New(authRepository, userRepository, userSvc, categorySvc, jwtMgr, cfg.JWT.AccessTokenExpiry, cfg.JWT.RefreshTokenExpiry, log.Logger)

	accountRepository := accountRepo.NewPostgresRepository(postgres.DB)
	accountSvc := accountService.New(accountRepository)

	budgetRepository := budgetRepo.NewPostgresRepository(postgres.DB)
	budgetSvc := budgetService.New(budgetRepository, categoryRepository)

	transactionRepository := transactionRepo.NewPostgresRepository(postgres.DB)
	transactionSvc := transactionService.New(transactionRepository, accountRepository, categoryRepository)

	transferRepository := transferRepo.NewPostgresRepository(postgres.DB)
	transferSvc := transferService.New(transferRepository, accountRepository)

	r := router.New()

	logMiddleware := func(next http.Handler) http.Handler {
		return middleware.Logging(next, log.Logger)
	}

	userRoute.Setup(r, userSvc, logMiddleware, middleware.Auth(jwtMgr))
	authRoute.Setup(r, authSvc, logMiddleware)
	accountRoute.Setup(r, accountSvc, logMiddleware, middleware.Auth(jwtMgr))
	catRoute.Setup(r, categorySvc, logMiddleware, middleware.Auth(jwtMgr))
	budgetRoute.Setup(r, budgetSvc, logMiddleware, middleware.Auth(jwtMgr))
	transactionRoute.Setup(r, transactionSvc, logMiddleware, middleware.Auth(jwtMgr))
	transferRoute.Setup(r, transferSvc, logMiddleware, middleware.Auth(jwtMgr))

	subRepo := subRepo.NewPostgresRepository(postgres.DB)
	subSvc := subService.New(subRepo, userRepository)
	subRoute.Setup(r, subSvc, logMiddleware, middleware.Auth(jwtMgr))

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
	_ catDomain.CategorySeeder          = (*catService.Service)(nil)
)
