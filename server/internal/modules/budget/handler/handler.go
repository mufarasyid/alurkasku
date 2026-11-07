package handler

import (
	"encoding/json"
	"net/http"

	"github.com/mufarasyid/alurkasku/server/internal/modules/budget/domain"
	"github.com/mufarasyid/alurkasku/server/internal/modules/budget/service"
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

func (h *Handler) CreateBudget(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateBudgetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}
	userID := userIDFrom(r)
	if userID == "" {
		httpx.WriteError(w, apperror.Unauthorized("authentication required"), http.StatusUnauthorized)
		return
	}
	b, err := h.svc.CreateBudget(userID, req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.Created(domain.ToResponse(*b)), http.StatusCreated)
}

func (h *Handler) GetBudget(w http.ResponseWriter, r *http.Request) {
	id, err := httpx.ParseID(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid budget id"), http.StatusBadRequest)
		return
	}
	b, err := h.svc.GetBudget(userIDFrom(r), id)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.OK(domain.ToResponse(*b)), http.StatusOK)
}

func (h *Handler) UpdateBudget(w http.ResponseWriter, r *http.Request) {
	id, err := httpx.ParseID(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid budget id"), http.StatusBadRequest)
		return
	}
	var req domain.UpdateBudgetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}
	b, err := h.svc.UpdateBudget(userIDFrom(r), id, req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.OK(domain.ToResponse(*b)), http.StatusOK)
}

func (h *Handler) DeleteBudget(w http.ResponseWriter, r *http.Request) {
	id, err := httpx.ParseID(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid budget id"), http.StatusBadRequest)
		return
	}
	if err := h.svc.DeleteBudget(userIDFrom(r), id); err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) BulkDeleteBudgets(w http.ResponseWriter, r *http.Request) {
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
	if _, err := h.svc.BulkDeleteBudgets(userID, req.IDs); err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ListBudgets(w http.ResponseWriter, r *http.Request) {
	filters := domain.ListFilters{
		Period: r.URL.Query().Get("period"),
		Query:  r.URL.Query().Get("q"),
	}
	budgets, err := h.svc.ListBudgets(userIDFrom(r), filters)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := make([]domain.BudgetResponse, len(budgets))
	for i, b := range budgets {
		resp[i] = domain.ToResponse(b)
	}
	httpx.WriteJSON(w, response.OK(resp), http.StatusOK)
}
