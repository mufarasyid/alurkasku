package handler

import (
	"encoding/json"
	"net/http"

	"github.com/mufarasyid/alurkasku/server/internal/modules/category/domain"
	"github.com/mufarasyid/alurkasku/server/internal/modules/category/service"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
	"github.com/mufarasyid/alurkasku/server/internal/shared/httpx"
	"github.com/mufarasyid/alurkasku/server/internal/shared/middleware"
	"github.com/mufarasyid/alurkasku/server/internal/shared/response"
)

type Handler struct {
	svc *service.Service
}

func New(svc *service.Service) *Handler {
	return &Handler{svc: svc}
}

func userIDFrom(r *http.Request) string {
	c, ok := middleware.ClaimsFrom(r.Context())
	if !ok || c == nil {
		return ""
	}
	return c.UserID
}

func parseUUIDs(ids []string) error {
	for _, id := range ids {
		if _, err := httpx.ParseID(id); err != nil {
			return err
		}
	}
	return nil
}

func (h *Handler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}
	userID := userIDFrom(r)
	if userID == "" {
		httpx.WriteError(w, apperror.Unauthorized("authentication required"), http.StatusUnauthorized)
		return
	}
	c, err := h.svc.CreateCategory(userID, req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.Created(domain.ToResponse(*c)), http.StatusCreated)
}

func (h *Handler) GetCategory(w http.ResponseWriter, r *http.Request) {
	id, err := httpx.ParseID(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid category id"), http.StatusBadRequest)
		return
	}
	c, err := h.svc.GetCategory(userIDFrom(r), id)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.OK(domain.ToResponse(*c)), http.StatusOK)
}

func (h *Handler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	id, err := httpx.ParseID(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid category id"), http.StatusBadRequest)
		return
	}
	var req domain.UpdateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}
	c, err := h.svc.UpdateCategory(userIDFrom(r), id, req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.OK(domain.ToResponse(*c)), http.StatusOK)
}

func (h *Handler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	id, err := httpx.ParseID(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid category id"), http.StatusBadRequest)
		return
	}
	if err := h.svc.DeleteCategory(userIDFrom(r), id); err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) BulkDeleteCategories(w http.ResponseWriter, r *http.Request) {
	var req domain.BulkDeleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}
	if len(req.IDs) == 0 {
		httpx.WriteError(w, apperror.BadRequest("ids must not be empty"), http.StatusBadRequest)
		return
	}
	if len(req.IDs) > 100 {
		httpx.WriteError(w, apperror.BadRequest("ids must not exceed 100 items"), http.StatusBadRequest)
		return
	}
	if err := parseUUIDs(req.IDs); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid id in ids"), http.StatusBadRequest)
		return
	}
	userID := userIDFrom(r)
	if userID == "" {
		httpx.WriteError(w, apperror.Unauthorized("authentication required"), http.StatusUnauthorized)
		return
	}
	if _, err := h.svc.BulkDeleteCategories(userID, req.IDs); err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	filters := domain.ListFilters{
		Type:  r.URL.Query().Get("type"),
		Query: r.URL.Query().Get("q"),
	}
	categories, err := h.svc.ListCategories(userIDFrom(r), filters)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := make([]domain.CategoryResponse, len(categories))
	for i, c := range categories {
		resp[i] = domain.ToResponse(c)
	}
	httpx.WriteJSON(w, response.OK(resp), http.StatusOK)
}
