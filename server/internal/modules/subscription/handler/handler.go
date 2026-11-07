package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/mufarasyid/alurkasku/server/internal/modules/subscription/domain"
	"github.com/mufarasyid/alurkasku/server/internal/modules/subscription/service"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
	"github.com/mufarasyid/alurkasku/server/internal/shared/httpx"
	"github.com/mufarasyid/alurkasku/server/internal/shared/response"
	"github.com/mufarasyid/alurkasku/server/internal/shared/middleware"
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

func (h *Handler) CreateSubscription(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}
	userID := userIDFrom(r)
	if userID == "" {
		httpx.WriteError(w, apperror.Unauthorized("authentication required"), http.StatusUnauthorized)
		return
	}
	sub, err := h.svc.CreateSubscription(userID, req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.Created(domain.ToResponse(*sub)), http.StatusCreated)
}

func (h *Handler) GetSubscription(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	sub, err := h.svc.GetSubscription(id)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	if sub == nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	httpx.WriteJSON(w, response.OK(domain.ToResponse(*sub)), http.StatusOK)
}

func (h *Handler) UpdateSubscription(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req domain.UpdateSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}
	sub, err := h.svc.UpdateSubscription(id, req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.OK(domain.ToResponse(*sub)), http.StatusOK)
}

func (h *Handler) DeleteSubscription(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	err := h.svc.DeleteSubscription(id)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ListMySubscriptions(w http.ResponseWriter, r *http.Request) {
	userID := userIDFrom(r)
	if userID == "" {
		httpx.WriteError(w, apperror.Unauthorized("authentication required"), http.StatusUnauthorized)
		return
	}
	subs, err := h.svc.ListByUser(userID)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := make([]domain.SubscriptionResponse, len(subs))
	for i, s := range subs {
		resp[i] = domain.ToResponse(s)
	}
	httpx.WriteJSON(w, response.OK(resp), http.StatusOK)
}

func (h *Handler) ListSubscriptions(w http.ResponseWriter, r *http.Request) {
	page := 1
	pageSize := 10
	if v := r.URL.Query().Get("page"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 {
			httpx.WriteError(w, apperror.BadRequest("invalid page"), http.StatusBadRequest)
			return
		}
		page = n
	}
	if v := r.URL.Query().Get("page_size"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 || n > 100 {
			httpx.WriteError(w, apperror.BadRequest("invalid page_size"), http.StatusBadRequest)
			return
		}
		pageSize = n
	}
	subs, total, err := h.svc.ListSubscriptions(page, pageSize)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := make([]domain.SubscriptionResponse, len(subs))
	for i, s := range subs {
		resp[i] = domain.ToResponse(s)
	}
	httpx.WriteJSON(w, response.WithMeta(resp, page, pageSize, int64(total)), http.StatusOK)
}
