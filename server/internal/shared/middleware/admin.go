package middleware

import (
	"net/http"

	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
	"github.com/mufarasyid/alurkasku/server/internal/shared/httpx"
)

// RequireAdmin allows only admin-role claims through. Must run after Auth.
func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := ClaimsFrom(r.Context())
		if !ok || claims == nil {
			httpx.WriteError(w, apperror.Unauthorized("authentication required"), http.StatusUnauthorized)
			return
		}
		if claims.Role != "admin" {
			httpx.WriteError(w, apperror.Forbidden("admin access required"), http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}
