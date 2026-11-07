package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/mufarasyid/alurkasku/server/internal/modules/transfer/domain"
	"github.com/mufarasyid/alurkasku/server/internal/modules/transfer/service"
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

func decodeRequest(w http.ResponseWriter, r *http.Request) (domain.CreateTransferRequest, bool) {
	var req domain.CreateTransferRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return domain.CreateTransferRequest{}, false
	}
	return req, true
}

func writeTransfer(w http.ResponseWriter, t *domain.Transfer, err error) {
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.Created(domain.ToResponse(*t)), http.StatusCreated)
}

func listLimit(r *http.Request) (int, bool) {
	limit := 50
	if v := r.URL.Query().Get("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 || n > 100 {
			return 0, false
		}
		limit = n
	}
	return limit, true
}

func (h *Handler) CreateTransfer(w http.ResponseWriter, r *http.Request) {
	req, ok := decodeRequest(w, r)
	if !ok {
		return
	}
	userID := userIDFrom(r)
	if userID == "" {
		httpx.WriteError(w, apperror.Unauthorized("authentication required"), http.StatusUnauthorized)
		return
	}
	t, err := h.svc.Transfer(userID, req)
	writeTransfer(w, t, err)
}

func (h *Handler) CreateWithdrawal(w http.ResponseWriter, r *http.Request) {
	req, ok := decodeRequest(w, r)
	if !ok {
		return
	}
	userID := userIDFrom(r)
	if userID == "" {
		httpx.WriteError(w, apperror.Unauthorized("authentication required"), http.StatusUnauthorized)
		return
	}
	t, err := h.svc.Withdraw(userID, req)
	writeTransfer(w, t, err)
}

func (h *Handler) ListTransfers(w http.ResponseWriter, r *http.Request) {
	limit, ok := listLimit(r)
	if !ok {
		httpx.WriteError(w, apperror.BadRequest("invalid limit"), http.StatusBadRequest)
		return
	}
	transfers, err := h.svc.ListTransfers(userIDFrom(r), limit)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := make([]domain.TransferResponse, len(transfers))
	for i, t := range transfers {
		resp[i] = domain.ToResponse(t)
	}
	httpx.WriteJSON(w, response.OK(resp), http.StatusOK)
}

func (h *Handler) ListWithdrawals(w http.ResponseWriter, r *http.Request) {
	limit, ok := listLimit(r)
	if !ok {
		httpx.WriteError(w, apperror.BadRequest("invalid limit"), http.StatusBadRequest)
		return
	}
	withdrawals, err := h.svc.ListWithdrawals(userIDFrom(r), limit)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := make([]domain.TransferResponse, len(withdrawals))
	for i, t := range withdrawals {
		resp[i] = domain.ToResponse(t)
	}
	httpx.WriteJSON(w, response.OK(resp), http.StatusOK)
}
