package route

import (
	"net/http"

	subHandler "github.com/mufarasyid/alurkasku/server/internal/modules/subscription/handler"
	subService "github.com/mufarasyid/alurkasku/server/internal/modules/subscription/service"
	"github.com/mufarasyid/alurkasku/server/internal/router"
)

func Setup(r *router.Router, svc *subService.Service, logMiddleware func(http.Handler) http.Handler, authMiddleware func(http.Handler) http.Handler) {
	h := subHandler.New(svc)

	r.Handle("POST /api/v1/subscriptions", logMiddleware(authMiddleware(http.HandlerFunc(h.CreateSubscription))))
	r.Handle("GET /api/v1/subscriptions/me", logMiddleware(authMiddleware(http.HandlerFunc(h.ListMySubscriptions))))
	r.Handle("GET /api/v1/subscriptions/{id}", logMiddleware(authMiddleware(http.HandlerFunc(h.GetSubscription))))
	r.Handle("PUT /api/v1/subscriptions/{id}", logMiddleware(authMiddleware(http.HandlerFunc(h.UpdateSubscription))))
	r.Handle("DELETE /api/v1/subscriptions/{id}", logMiddleware(authMiddleware(http.HandlerFunc(h.DeleteSubscription))))
	r.Handle("GET /api/v1/subscriptions", logMiddleware(authMiddleware(http.HandlerFunc(h.ListSubscriptions))))
}
