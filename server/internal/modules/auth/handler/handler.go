package handler

import (
	"encoding/json"
	"net/http"

	"github.com/mufarasyid/alurkasku/server/internal/modules/auth/domain"
	"github.com/mufarasyid/alurkasku/server/internal/modules/auth/service"
	"github.com/mufarasyid/alurkasku/server/internal/modules/auth/validate"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
	"github.com/mufarasyid/alurkasku/server/internal/shared/httpx"
	"github.com/mufarasyid/alurkasku/server/internal/shared/response"
)

type Handler struct {
	svc *service.Service
}

func New(svc *service.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req domain.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}

	if err := validate.Register(req); err != nil {
		httpx.WriteError(w, err, http.StatusBadRequest)
		return
	}

	auth, err := h.svc.Register(req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}

	httpx.WriteJSON(w, response.Created(auth), http.StatusCreated)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req domain.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}

	if err := validate.Login(req); err != nil {
		httpx.WriteError(w, err, http.StatusBadRequest)
		return
	}

	auth, err := h.svc.Login(req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}

	httpx.WriteJSON(w, response.OK(auth), http.StatusOK)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req domain.RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}

	if err := validate.Refresh(req); err != nil {
		httpx.WriteError(w, err, http.StatusBadRequest)
		return
	}

	tokens, err := h.svc.Refresh(req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}

	httpx.WriteJSON(w, response.OK(tokens), http.StatusOK)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	var req domain.LogoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}

	if err := validate.Logout(req); err != nil {
		httpx.WriteError(w, err, http.StatusBadRequest)
		return
	}

	if err := h.svc.Logout(req.RefreshToken); err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
