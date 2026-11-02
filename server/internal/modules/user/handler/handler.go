package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/mufarasyid/alurkasku/server/internal/modules/user/domain"
	"github.com/mufarasyid/alurkasku/server/internal/modules/user/service"
	"github.com/mufarasyid/alurkasku/server/internal/modules/user/validate"
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

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}

	if err := validate.CreateUser(req); err != nil {
		httpx.WriteError(w, err, http.StatusBadRequest)
		return
	}

	u, err := h.svc.CreateUser(req)
	if err != nil {
		httpx.WriteError(w, err, http.StatusBadRequest)
		return
	}

	httpx.WriteJSON(w, response.Created(domain.ToResponse(*u)), http.StatusCreated)
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	id, err := httpx.ParseID(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid user id"), http.StatusBadRequest)
		return
	}

	u, err := h.svc.GetUser(id)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}

	httpx.WriteJSON(w, response.OK(domain.ToResponse(*u)), http.StatusOK)
}

func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id, err := httpx.ParseID(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid user id"), http.StatusBadRequest)
		return
	}

	var req domain.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}

	if err := validate.UpdateUser(req); err != nil {
		httpx.WriteError(w, err, http.StatusBadRequest)
		return
	}

	u, err := h.svc.UpdateUser(id, req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}

	httpx.WriteJSON(w, response.OK(domain.ToResponse(*u)), http.StatusOK)
}

func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id, err := httpx.ParseID(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid user id"), http.StatusBadRequest)
		return
	}

	if err := h.svc.DeleteUser(id); err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
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

	offset := (page - 1) * pageSize
	users, total, err := h.svc.ListUsers(offset, pageSize)
	if err != nil {
		httpx.WriteError(w, apperror.Internal("failed to list users", err), http.StatusInternalServerError)
		return
	}

	resp := make([]domain.UserResponse, len(users))
	for i, u := range users {
		resp[i] = domain.ToResponse(u)
	}

	httpx.WriteJSON(w, response.WithMeta(resp, page, pageSize, total), http.StatusOK)
}
