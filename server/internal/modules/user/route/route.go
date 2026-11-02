package route

import (
	"net/http"

	"github.com/mufarasyid/alurkasku/server/internal/modules/user/handler"
	"github.com/mufarasyid/alurkasku/server/internal/modules/user/service"
	"github.com/mufarasyid/alurkasku/server/internal/router"
)

func Setup(r *router.Router, svc *service.Service, logMiddleware, authMiddleware func(http.Handler) http.Handler) {
	h := handler.New(svc)

	r.Handle("POST /api/v1/users", logMiddleware(authMiddleware(http.HandlerFunc(h.CreateUser))))
	r.Handle("GET /api/v1/users/{id}", logMiddleware(authMiddleware(http.HandlerFunc(h.GetUser))))
	r.Handle("PUT /api/v1/users/{id}", logMiddleware(authMiddleware(http.HandlerFunc(h.UpdateUser))))
	r.Handle("DELETE /api/v1/users/{id}", logMiddleware(authMiddleware(http.HandlerFunc(h.DeleteUser))))
	r.Handle("GET /api/v1/users", logMiddleware(authMiddleware(http.HandlerFunc(h.ListUsers))))
}
