package route

import (
	"net/http"

	accountHandler "github.com/mufarasyid/alurkasku/server/internal/modules/account/handler"
	accountService "github.com/mufarasyid/alurkasku/server/internal/modules/account/service"
	"github.com/mufarasyid/alurkasku/server/internal/router"
)

func Setup(r *router.Router, svc *accountService.Service, logMiddleware func(http.Handler) http.Handler, authMiddleware func(http.Handler) http.Handler) {
	h := accountHandler.New(svc)

	m := func(next http.Handler) http.Handler {
		return logMiddleware(authMiddleware(next))
	}

	r.Handle("POST /api/v1/accounts", m(http.HandlerFunc(h.CreateAccount)))
	r.Handle("GET /api/v1/accounts", m(http.HandlerFunc(h.ListAccounts)))
	r.Handle("POST /api/v1/accounts/bulk-delete", m(http.HandlerFunc(h.BulkDeleteAccounts)))
	r.Handle("GET /api/v1/accounts/{id}", m(http.HandlerFunc(h.GetAccount)))
	r.Handle("PUT /api/v1/accounts/{id}", m(http.HandlerFunc(h.UpdateAccount)))
	r.Handle("DELETE /api/v1/accounts/{id}", m(http.HandlerFunc(h.DeleteAccount)))
}
