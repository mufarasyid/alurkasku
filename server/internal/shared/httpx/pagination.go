package httpx

import (
	"net/http"
	"strconv"

	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
)

const (
	DefaultPageSize = 10
	MaxPageSize     = 100
)

// ParsePagination reads page and page_size query params (defaults 1 and
// DefaultPageSize). A legacy "limit" param is accepted as page_size when
// page_size is absent.
func ParsePagination(r *http.Request) (page, pageSize int, err error) {
	page = 1
	pageSize = DefaultPageSize
	q := r.URL.Query()
	if v := q.Get("page"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 {
			return 0, 0, apperror.BadRequest("invalid page")
		}
		page = n
	}
	if v := q.Get("page_size"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 || n > MaxPageSize {
			return 0, 0, apperror.BadRequest("invalid page_size")
		}
		pageSize = n
	} else if v := q.Get("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 || n > MaxPageSize {
			return 0, 0, apperror.BadRequest("invalid limit")
		}
		pageSize = n
	}
	return page, pageSize, nil
}

// Offset returns the row offset for a page.
func Offset(page, pageSize int) int {
	return (page - 1) * pageSize
}
