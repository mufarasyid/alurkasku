package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/mufarasyid/alurkasku/server/internal/modules/user/domain"
	"github.com/mufarasyid/alurkasku/server/internal/modules/user/service"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
	"github.com/mufarasyid/alurkasku/server/internal/shared/response"
)

type Handler struct {
	svc *service.Service
}

func New(svc *service.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}

	u, err := h.svc.CreateUser(req)
	if err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}

	writeJSON(w, response.Created(domain.ToResponse(*u)), http.StatusCreated)
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r.PathValue("id"))
	if err != nil {
		writeError(w, apperror.BadRequest("invalid user id"), http.StatusBadRequest)
		return
	}

	u, err := h.svc.GetUser(id)
	if err != nil {
		writeError(w, err, errHTTPStatus(err))
		return
	}

	writeJSON(w, response.OK(domain.ToResponse(*u)), http.StatusOK)
}

func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r.PathValue("id"))
	if err != nil {
		writeError(w, apperror.BadRequest("invalid user id"), http.StatusBadRequest)
		return
	}

	var req domain.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}

	u, err := h.svc.UpdateUser(id, req)
	if err != nil {
		writeError(w, err, errHTTPStatus(err))
		return
	}

	writeJSON(w, response.OK(domain.ToResponse(*u)), http.StatusOK)
}

func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r.PathValue("id"))
	if err != nil {
		writeError(w, apperror.BadRequest("invalid user id"), http.StatusBadRequest)
		return
	}

	if err := h.svc.DeleteUser(id); err != nil {
		writeError(w, err, errHTTPStatus(err))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	page := 1
	pageSize := 10
	if v := r.URL.Query().Get("page"); v != "" {
		if n, e := strconv.Atoi(v); e == nil && n > 0 {
			page = n
		}
	}
	if v := r.URL.Query().Get("page_size"); v != "" {
		if n, e := strconv.Atoi(v); e == nil && n > 0 {
			pageSize = n
		}
	}

	offset := (page - 1) * pageSize
	users, total, err := h.svc.ListUsers(offset, pageSize)
	if err != nil {
		writeError(w, apperror.Internal("failed to list users", err), http.StatusInternalServerError)
		return
	}

	resp := make([]domain.UserResponse, len(users))
	for i, u := range users {
		resp[i] = domain.ToResponse(u)
	}

	writeJSON(w, response.WithMeta(resp, page, pageSize, total), http.StatusOK)
}

func parseID(s string) (uint64, error) {
	return strconv.ParseUint(s, 10, 64)
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
