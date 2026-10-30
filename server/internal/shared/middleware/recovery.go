package middleware

import (
	"fmt"
	"net/http"

	"github.com/rs/zerolog"
)

func Recovery(next http.Handler, log zerolog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Error().Interface("panic", rec).Str("path", r.URL.Path).Msg("panic recovered")
				http.Error(w, fmt.Sprintf(`{"success":false,"error":{"code":"INTERNAL","message":"internal server error"}}`), http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}
