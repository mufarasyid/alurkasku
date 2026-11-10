package route

import (
	"net/http"

	"github.com/mufarasyid/alurkasku/server/internal/modules/admin/handler"
	"github.com/mufarasyid/alurkasku/server/internal/modules/admin/service"
	"github.com/mufarasyid/alurkasku/server/internal/router"
	"github.com/mufarasyid/alurkasku/server/internal/shared/middleware"
)

// Setup wires admin-only routes. Callers are expected to pass the shared log
// and auth middleware; admin enforcement is layered on here explicitly.
func Setup(r *router.Router, svc *service.Service, logMiddleware, authMiddleware func(http.Handler) http.Handler) {
	h := handler.New(svc)

	adminMiddleware := func(next http.Handler) http.Handler {
		return authMiddleware(middleware.RequireAdmin(next))
	}

	wrap := func(h http.Handler) http.Handler {
		return logMiddleware(adminMiddleware(h))
	}

	r.Handle("GET /api/v1/admin/users", wrap(http.HandlerFunc(h.ListUsers)))
	r.Handle("GET /api/v1/admin/users/{id}", wrap(http.HandlerFunc(h.GetUser)))
	r.Handle("PUT /api/v1/admin/users/{id}", wrap(http.HandlerFunc(h.UpdateUser)))
	r.Handle("DELETE /api/v1/admin/users/{id}", wrap(http.HandlerFunc(h.DeleteUser)))

	r.Handle("GET /api/v1/admin/users/{id}/accounts", wrap(http.HandlerFunc(h.ListUserAccounts)))
	r.Handle("GET /api/v1/admin/users/{id}/transactions", wrap(http.HandlerFunc(h.ListUserTransactions)))
	r.Handle("GET /api/v1/admin/users/{id}/transactions/overview", wrap(http.HandlerFunc(h.GetUserOverview)))
	r.Handle("GET /api/v1/admin/users/{id}/transactions/breakdown", wrap(http.HandlerFunc(h.GetUserBreakdown)))
	r.Handle("GET /api/v1/admin/users/{id}/budgets", wrap(http.HandlerFunc(h.ListUserBudgets)))
	r.Handle("GET /api/v1/admin/users/{id}/categories", wrap(http.HandlerFunc(h.ListUserCategories)))
	r.Handle("GET /api/v1/admin/users/{id}/subscriptions", wrap(http.HandlerFunc(h.ListUserSubscriptions)))
}
