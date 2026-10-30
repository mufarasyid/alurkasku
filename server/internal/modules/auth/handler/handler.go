package handler

import (
	"encoding/json"
	"net/http"

	"github.com/mufarasyid/alurkasku/server/internal/modules/auth/domain"
	"github.com/mufarasyid/alurkasku/server/internal/modules/auth/service"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
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
		writeError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}

	auth, err := h.svc.Register(req)
	if err != nil {
		writeError(w, err, errHTTPStatus(err))
		return
	}

	writeJSON(w, response.Created(auth), http.StatusCreated)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req domain.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}

	auth, err := h.svc.Login(req)
	if err != nil {
		writeError(w, err, errHTTPStatus(err))
		return
	}

	writeJSON(w, response.OK(auth), http.StatusOK)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req domain.RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}

	tokens, err := h.svc.Refresh(req)
	if err != nil {
		writeError(w, err, errHTTPStatus(err))
		return
	}

	writeJSON(w, response.OK(tokens), http.StatusOK)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	var req domain.RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}

	if err := h.svc.Logout(req.RefreshToken); err != nil {
		writeError(w, err, errHTTPStatus(err))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func errHTTPStatus(err error) int {
	if appErr, ok := err.(*apperror.AppError); ok {
		return appErr.HTTPStatus
	}
	return http.StatusInternalServerError
}

func writeJSON(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, err error, status int) {
	appErr, ok := err.(*apperror.AppError)
	if !ok {
		appErr = apperror.Internal("unexpected error", err)
	}
	writeJSON(w, response.Err(appErr.Code, appErr.Message), status)
}
