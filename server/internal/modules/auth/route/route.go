package route

import (
	"net/http"

	"github.com/mufarasyid/alurkasku/server/internal/modules/auth/handler"
	"github.com/mufarasyid/alurkasku/server/internal/modules/auth/service"
	"github.com/mufarasyid/alurkasku/server/internal/router"
)

func Setup(r *router.Router, svc *service.Service, logMiddleware func(http.Handler) http.Handler) {
	h := handler.New(svc)

	r.Handle("POST /api/v1/auth/register", logMiddleware(http.HandlerFunc(h.Register)))
	r.Handle("POST /api/v1/auth/login", logMiddleware(http.HandlerFunc(h.Login)))
	r.Handle("POST /api/v1/auth/refresh", logMiddleware(http.HandlerFunc(h.Refresh)))
	r.Handle("POST /api/v1/auth/logout", logMiddleware(http.HandlerFunc(h.Logout)))
}
