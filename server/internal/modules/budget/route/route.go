package route

import (
	"net/http"

	budgetHandler "github.com/mufarasyid/alurkasku/server/internal/modules/budget/handler"
	budgetService "github.com/mufarasyid/alurkasku/server/internal/modules/budget/service"
	"github.com/mufarasyid/alurkasku/server/internal/router"
)

func Setup(r *router.Router, svc *budgetService.Service, logMiddleware func(http.Handler) http.Handler, authMiddleware func(http.Handler) http.Handler) {
	h := budgetHandler.New(svc)

	m := func(next http.Handler) http.Handler {
		return logMiddleware(authMiddleware(next))
	}

	r.Handle("POST /api/v1/budgets", m(http.HandlerFunc(h.CreateBudget)))
	r.Handle("GET /api/v1/budgets", m(http.HandlerFunc(h.ListBudgets)))
	r.Handle("POST /api/v1/budgets/bulk-delete", m(http.HandlerFunc(h.BulkDeleteBudgets)))
	r.Handle("GET /api/v1/budgets/{id}", m(http.HandlerFunc(h.GetBudget)))
	r.Handle("PUT /api/v1/budgets/{id}", m(http.HandlerFunc(h.UpdateBudget)))
	r.Handle("DELETE /api/v1/budgets/{id}", m(http.HandlerFunc(h.DeleteBudget)))
}
