package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/mufarasyid/alurkasku/server/internal/modules/transaction/domain"
	"github.com/mufarasyid/alurkasku/server/internal/modules/transaction/service"
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

func (h *Handler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}
	userID := userIDFrom(r)
	if userID == "" {
		httpx.WriteError(w, apperror.Unauthorized("authentication required"), http.StatusUnauthorized)
		return
	}
	t, err := h.svc.CreateTransaction(userID, req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.Created(domain.ToResponse(*t)), http.StatusCreated)
}

func (h *Handler) ListTransactions(w http.ResponseWriter, r *http.Request) {
	filters := domain.ListFilters{
		Type:  r.URL.Query().Get("type"),
		Query: r.URL.Query().Get("q"),
	}
	if v := r.URL.Query().Get("period"); v != "" {
		from, to, err := service.PeriodWindow(v)
		if err != nil {
			httpx.WriteError(w, err, http.StatusBadRequest)
			return
		}
		filters.From = &from
		filters.To = &to
	}
	if v := r.URL.Query().Get("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 || n > 100 {
			httpx.WriteError(w, apperror.BadRequest("invalid limit"), http.StatusBadRequest)
			return
		}
		filters.Limit = n
	}
	transactions, err := h.svc.ListTransactions(userIDFrom(r), filters)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := make([]domain.TransactionResponse, len(transactions))
	for i, t := range transactions {
		resp[i] = domain.ToResponse(t)
	}
	httpx.WriteJSON(w, response.OK(resp), http.StatusOK)
}

func (h *Handler) GetOverview(w http.ResponseWriter, r *http.Request) {
	period := r.URL.Query().Get("period")
	if period == "" {
		period = "this-month"
	}
	overview, err := h.svc.GetOverview(userIDFrom(r), period)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.OK(overview), http.StatusOK)
}

func (h *Handler) GetBreakdown(w http.ResponseWriter, r *http.Request) {
	period := r.URL.Query().Get("period")
	if period == "" {
		period = "this-month"
	}
	breakdown, err := h.svc.GetBreakdown(userIDFrom(r), period)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.OK(breakdown), http.StatusOK)
}
