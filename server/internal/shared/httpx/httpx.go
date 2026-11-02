package httpx

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"

	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
	"github.com/mufarasyid/alurkasku/server/internal/shared/response"
)

var uuidRegex = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)

func ErrHTTPStatus(err error) int {
	if appErr, ok := err.(*apperror.AppError); ok {
		return appErr.HTTPStatus
	}
	return http.StatusInternalServerError
}

func WriteJSON(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func WriteError(w http.ResponseWriter, err error, status int) {
	appErr, ok := err.(*apperror.AppError)
	if !ok {
		appErr = apperror.Internal("unexpected error", err)
	}
	WriteJSON(w, response.Err(appErr.Code, appErr.Message), status)
}

func ParseID(s string) (string, error) {
	if s == "" {
		return "", fmt.Errorf("empty id")
	}
	if !uuidRegex.MatchString(s) {
		return "", fmt.Errorf("invalid id format")
	}
	return s, nil
}
