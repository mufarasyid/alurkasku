package route

import (
	"net/http"

	transactionHandler "github.com/mufarasyid/alurkasku/server/internal/modules/transaction/handler"
	transactionService "github.com/mufarasyid/alurkasku/server/internal/modules/transaction/service"
	"github.com/mufarasyid/alurkasku/server/internal/router"
)

func Setup(r *router.Router, svc *transactionService.Service, logMiddleware func(http.Handler) http.Handler, authMiddleware func(http.Handler) http.Handler) {
	h := transactionHandler.New(svc)

	m := func(next http.Handler) http.Handler {
		return logMiddleware(authMiddleware(next))
	}

	r.Handle("POST /api/v1/transactions", m(http.HandlerFunc(h.CreateTransaction)))
	r.Handle("GET /api/v1/transactions", m(http.HandlerFunc(h.ListTransactions)))
	r.Handle("GET /api/v1/transactions/overview", m(http.HandlerFunc(h.GetOverview)))
	r.Handle("GET /api/v1/transactions/breakdown", m(http.HandlerFunc(h.GetBreakdown)))
}
