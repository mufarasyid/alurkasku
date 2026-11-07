package route

import (
	"net/http"

	catHandler "github.com/mufarasyid/alurkasku/server/internal/modules/category/handler"
	catService "github.com/mufarasyid/alurkasku/server/internal/modules/category/service"
	"github.com/mufarasyid/alurkasku/server/internal/router"
)

func Setup(r *router.Router, svc *catService.Service, logMiddleware func(http.Handler) http.Handler, authMiddleware func(http.Handler) http.Handler) {
	h := catHandler.New(svc)

	m := func(next http.Handler) http.Handler {
		return logMiddleware(authMiddleware(next))
	}

	r.Handle("POST /api/v1/categories", m(http.HandlerFunc(h.CreateCategory)))
	r.Handle("GET /api/v1/categories", m(http.HandlerFunc(h.ListCategories)))
	r.Handle("POST /api/v1/categories/bulk-delete", m(http.HandlerFunc(h.BulkDeleteCategories)))
	r.Handle("GET /api/v1/categories/{id}", m(http.HandlerFunc(h.GetCategory)))
	r.Handle("PUT /api/v1/categories/{id}", m(http.HandlerFunc(h.UpdateCategory)))
	r.Handle("DELETE /api/v1/categories/{id}", m(http.HandlerFunc(h.DeleteCategory)))
}
