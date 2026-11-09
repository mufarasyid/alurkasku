package handler

import (
	"encoding/json"
	"net/http"

	"github.com/mufarasyid/alurkasku/server/internal/modules/account/domain"
	"github.com/mufarasyid/alurkasku/server/internal/modules/account/service"
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

func (h *Handler) CreateAccount(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}
	userID := userIDFrom(r)
	if userID == "" {
		httpx.WriteError(w, apperror.Unauthorized("authentication required"), http.StatusUnauthorized)
		return
	}
	a, err := h.svc.CreateAccount(userID, req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.Created(domain.ToResponse(*a)), http.StatusCreated)
}

func (h *Handler) GetAccount(w http.ResponseWriter, r *http.Request) {
	id, err := httpx.ParseID(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid account id"), http.StatusBadRequest)
		return
	}
	a, err := h.svc.GetAccount(userIDFrom(r), id)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.OK(domain.ToResponse(*a)), http.StatusOK)
}

func (h *Handler) UpdateAccount(w http.ResponseWriter, r *http.Request) {
	id, err := httpx.ParseID(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid account id"), http.StatusBadRequest)
		return
	}
	var req domain.UpdateAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}
	a, err := h.svc.UpdateAccount(userIDFrom(r), id, req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.OK(domain.ToResponse(*a)), http.StatusOK)
}

func (h *Handler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	id, err := httpx.ParseID(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid account id"), http.StatusBadRequest)
		return
	}
	if err := h.svc.DeleteAccount(userIDFrom(r), id); err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) BulkDeleteAccounts(w http.ResponseWriter, r *http.Request) {
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
	if _, err := h.svc.BulkDeleteAccounts(userID, req.IDs); err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ListAccounts(w http.ResponseWriter, r *http.Request) {
	page, pageSize, err := httpx.ParsePagination(r)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	filters := domain.ListFilters{
		Type:     r.URL.Query().Get("type"),
		Query:    r.URL.Query().Get("q"),
		Page:     page,
		PageSize: pageSize,
	}
	accounts, total, err := h.svc.ListAccounts(userIDFrom(r), filters)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := make([]domain.AccountResponse, len(accounts))
	for i, a := range accounts {
		resp[i] = domain.ToResponse(a)
	}
	httpx.WriteJSON(w, response.WithMeta(resp, page, pageSize, total), http.StatusOK)
}
