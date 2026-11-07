package route

import (
	"net/http"

	transferHandler "github.com/mufarasyid/alurkasku/server/internal/modules/transfer/handler"
	transferService "github.com/mufarasyid/alurkasku/server/internal/modules/transfer/service"
	"github.com/mufarasyid/alurkasku/server/internal/router"
)

func Setup(r *router.Router, svc *transferService.Service, logMiddleware func(http.Handler) http.Handler, authMiddleware func(http.Handler) http.Handler) {
	h := transferHandler.New(svc)

	m := func(next http.Handler) http.Handler {
		return logMiddleware(authMiddleware(next))
	}

	r.Handle("POST /api/v1/transfers", m(http.HandlerFunc(h.CreateTransfer)))
	r.Handle("GET /api/v1/transfers", m(http.HandlerFunc(h.ListTransfers)))
	r.Handle("POST /api/v1/withdrawals", m(http.HandlerFunc(h.CreateWithdrawal)))
	r.Handle("GET /api/v1/withdrawals", m(http.HandlerFunc(h.ListWithdrawals)))
}
