package handler

import (
	"encoding/json"
	"net/http"

	"github.com/mufarasyid/alurkasku/server/internal/modules/account/domain"
	"github.com/mufarasyid/alurkasku/server/internal/modules/admin/service"
	budgetdomain "github.com/mufarasyid/alurkasku/server/internal/modules/budget/domain"
	catdomain "github.com/mufarasyid/alurkasku/server/internal/modules/category/domain"
	subdomain "github.com/mufarasyid/alurkasku/server/internal/modules/subscription/domain"
	transactiondomain "github.com/mufarasyid/alurkasku/server/internal/modules/transaction/domain"
	userdomain "github.com/mufarasyid/alurkasku/server/internal/modules/user/domain"
	"github.com/mufarasyid/alurkasku/server/internal/modules/user/validate"
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

func actorFrom(r *http.Request) (id string) {
	claims, ok := middleware.ClaimsFrom(r.Context())
	if !ok || claims == nil {
		return ""
	}
	return claims.UserID
}

func (h *Handler) requireTarget(w http.ResponseWriter, r *http.Request) (string, bool) {
	id, err := httpx.ParseID(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid user id"), http.StatusBadRequest)
		return "", false
	}
	if _, err := h.svc.GetUser(id); err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return "", false
	}
	return id, true
}

func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	page, pageSize, err := httpx.ParsePagination(r)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	filters := userdomain.ListFilters{
		Query: r.URL.Query().Get("q"),
		Role:  r.URL.Query().Get("role"),
	}

	offset := (page - 1) * pageSize
	users, total, err := h.svc.ListUsers(offset, pageSize, filters)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}

	resp := make([]userdomain.UserResponse, len(users))
	for i, u := range users {
		resp[i] = userdomain.ToResponse(u)
	}
	httpx.WriteJSON(w, response.WithMeta(resp, page, pageSize, total), http.StatusOK)
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	id, ok := h.requireTarget(w, r)
	if !ok {
		return
	}

	u, err := h.svc.GetUser(id)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.OK(userdomain.ToResponse(*u)), http.StatusOK)
}

func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id, ok := h.requireTarget(w, r)
	if !ok {
		return
	}

	var req userdomain.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return
	}
	if err := validate.UpdateUser(req); err != nil {
		httpx.WriteError(w, err, http.StatusBadRequest)
		return
	}

	if req.Role != "" && id == actorFrom(r) {
		httpx.WriteError(w, apperror.BadRequest("cannot change your own role from the admin console"), http.StatusBadRequest)
		return
	}

	u, err := h.svc.UpdateUser(id, req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.OK(userdomain.ToResponse(*u)), http.StatusOK)
}

func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id, ok := h.requireTarget(w, r)
	if !ok {
		return
	}
	if id == actorFrom(r) {
		httpx.WriteError(w, apperror.BadRequest("cannot delete your own account from the admin console"), http.StatusBadRequest)
		return
	}

	if err := h.svc.DeleteUser(id); err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ListUserAccounts(w http.ResponseWriter, r *http.Request) {
	id, ok := h.requireTarget(w, r)
	if !ok {
		return
	}
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

	accounts, total, err := h.svc.ListUserAccounts(id, filters)
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

func (h *Handler) ListUserTransactions(w http.ResponseWriter, r *http.Request) {
	id, ok := h.requireTarget(w, r)
	if !ok {
		return
	}
	page, pageSize, err := httpx.ParsePagination(r)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	filters := transactiondomain.ListFilters{
		Type:     r.URL.Query().Get("type"),
		Query:    r.URL.Query().Get("q"),
		Page:     page,
		PageSize: pageSize,
	}
	if v := r.URL.Query().Get("period"); v != "" {
		from, to, err := h.svc.PeriodWindowFor(id, v)
		if err != nil {
			httpx.WriteError(w, err, http.StatusBadRequest)
			return
		}
		filters.From = &from
		filters.To = &to
	}

	transactions, total, err := h.svc.ListUserTransactions(id, filters)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := make([]transactiondomain.TransactionResponse, len(transactions))
	for i, t := range transactions {
		resp[i] = transactiondomain.ToResponse(t)
	}
	httpx.WriteJSON(w, response.WithMeta(resp, page, pageSize, total), http.StatusOK)
}

func (h *Handler) GetUserOverview(w http.ResponseWriter, r *http.Request) {
	id, ok := h.requireTarget(w, r)
	if !ok {
		return
	}
	period := r.URL.Query().Get("period")
	if period == "" {
		period = "this-month"
	}

	overview, err := h.svc.GetUserOverview(id, period)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.OK(overview), http.StatusOK)
}

func (h *Handler) GetUserBreakdown(w http.ResponseWriter, r *http.Request) {
	id, ok := h.requireTarget(w, r)
	if !ok {
		return
	}
	period := r.URL.Query().Get("period")
	if period == "" {
		period = "this-month"
	}

	breakdown, err := h.svc.GetUserBreakdown(id, period)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.OK(breakdown), http.StatusOK)
}

func (h *Handler) ListUserBudgets(w http.ResponseWriter, r *http.Request) {
	id, ok := h.requireTarget(w, r)
	if !ok {
		return
	}
	page, pageSize, err := httpx.ParsePagination(r)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	filters := budgetdomain.ListFilters{
		Period:   r.URL.Query().Get("period"),
		Query:    r.URL.Query().Get("q"),
		Page:     page,
		PageSize: pageSize,
	}

	budgets, total, err := h.svc.ListUserBudgets(id, filters)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := make([]budgetdomain.BudgetResponse, len(budgets))
	for i, b := range budgets {
		resp[i] = budgetdomain.ToResponse(b)
	}
	httpx.WriteJSON(w, response.WithMeta(resp, page, pageSize, total), http.StatusOK)
}

func (h *Handler) ListUserCategories(w http.ResponseWriter, r *http.Request) {
	id, ok := h.requireTarget(w, r)
	if !ok {
		return
	}
	page, pageSize, err := httpx.ParsePagination(r)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	filters := catdomain.ListFilters{
		Type:     r.URL.Query().Get("type"),
		Query:    r.URL.Query().Get("q"),
		Page:     page,
		PageSize: pageSize,
	}

	categories, total, err := h.svc.ListUserCategories(id, filters)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := make([]catdomain.CategoryResponse, len(categories))
	for i, c := range categories {
		resp[i] = catdomain.ToResponse(c)
	}
	httpx.WriteJSON(w, response.WithMeta(resp, page, pageSize, total), http.StatusOK)
}

func (h *Handler) ListUserSubscriptions(w http.ResponseWriter, r *http.Request) {
	id, ok := h.requireTarget(w, r)
	if !ok {
		return
	}

	subs, err := h.svc.ListUserSubscriptions(id)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := make([]subdomain.SubscriptionResponse, len(subs))
	for i, s := range subs {
		resp[i] = subdomain.ToResponse(s)
	}
	httpx.WriteJSON(w, response.OK(resp), http.StatusOK)
}
