package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/mufarasyid/alurkasku/server/internal/platform/security"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
	"github.com/mufarasyid/alurkasku/server/internal/shared/httpx"
)

type contextKey string

const claimsKey contextKey = "auth.claims"

func Auth(jwtMgr *security.Manager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" {
				httpx.WriteError(w, apperror.Unauthorized("missing authorization header"), http.StatusUnauthorized)
				return
			}

			parts := strings.Fields(header)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				httpx.WriteError(w, apperror.Unauthorized("invalid authorization header"), http.StatusUnauthorized)
				return
			}

			claims, err := jwtMgr.ValidateToken(parts[1])
			if err != nil {
				httpx.WriteError(w, apperror.Unauthorized("invalid or expired token"), http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), claimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func ClaimsFrom(ctx context.Context) (*security.Claims, bool) {
	claims, ok := ctx.Value(claimsKey).(*security.Claims)
	return claims, ok
}
