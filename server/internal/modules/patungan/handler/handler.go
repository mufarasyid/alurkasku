package handler

import (
	"encoding/json"
	"net/http"

	"github.com/mufarasyid/alurkasku/server/internal/modules/patungan/domain"
	"github.com/mufarasyid/alurkasku/server/internal/modules/patungan/service"
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

func groupIDFrom(w http.ResponseWriter, r *http.Request) (string, bool) {
	id, err := httpx.ParseID(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid group id"), http.StatusBadRequest)
		return "", false
	}
	return id, true
}

func decodeBody(w http.ResponseWriter, r *http.Request, out interface{}) bool {
	if err := json.NewDecoder(r.Body).Decode(out); err != nil {
		httpx.WriteError(w, apperror.BadRequest("invalid request body"), http.StatusBadRequest)
		return false
	}
	return true
}

func requireAuth(w http.ResponseWriter, r *http.Request) (string, bool) {
	userID := userIDFrom(r)
	if userID == "" {
		httpx.WriteError(w, apperror.Unauthorized("authentication required"), http.StatusUnauthorized)
		return "", false
	}
	return userID, true
}

func (h *Handler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	userID, ok := requireAuth(w, r)
	if !ok {
		return
	}
	var req domain.CreateGroupRequest
	if !decodeBody(w, r, &req) {
		return
	}
	g, participants, err := h.svc.CreateGroup(userID, req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := domain.ToGroupResponse(*g)
	resp.MemberCount = len(participants)
	httpx.WriteJSON(w, response.Created(resp), http.StatusCreated)
}

func (h *Handler) ListGroups(w http.ResponseWriter, r *http.Request) {
	page, pageSize, err := httpx.ParsePagination(r)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	groups, total, err := h.svc.ListGroups(userIDFrom(r), pageSize, httpx.Offset(page, pageSize))
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := make([]domain.GroupResponse, len(groups))
	for i, g := range groups {
		resp[i] = domain.ToGroupResponse(g)
	}
	httpx.WriteJSON(w, response.WithMeta(resp, page, pageSize, total), http.StatusOK)
}

func (h *Handler) GetGroup(w http.ResponseWriter, r *http.Request) {
	gid, ok := groupIDFrom(w, r)
	if !ok {
		return
	}
	g, participants, err := h.svc.GetGroup(userIDFrom(r), gid)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	presp := make([]domain.ParticipantResponse, len(participants))
	for i, p := range participants {
		presp[i] = domain.ToParticipantResponse(p)
	}
	httpx.WriteJSON(w, response.OK(map[string]interface{}{
		"group":        domain.ToGroupResponse(*g),
		"participants": presp,
	}), http.StatusOK)
}

func (h *Handler) UpdateGroup(w http.ResponseWriter, r *http.Request) {
	gid, ok := groupIDFrom(w, r)
	if !ok {
		return
	}
	var req domain.UpdateGroupRequest
	if !decodeBody(w, r, &req) {
		return
	}
	g, err := h.svc.UpdateGroup(userIDFrom(r), gid, req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.OK(domain.ToGroupResponse(*g)), http.StatusOK)
}

func (h *Handler) DeleteGroup(w http.ResponseWriter, r *http.Request) {
	gid, ok := groupIDFrom(w, r)
	if !ok {
		return
	}
	if err := h.svc.DeleteGroup(userIDFrom(r), gid); err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ListMembers(w http.ResponseWriter, r *http.Request) {
	gid, ok := groupIDFrom(w, r)
	if !ok {
		return
	}
	_, participants, err := h.svc.GetGroup(userIDFrom(r), gid)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := make([]domain.ParticipantResponse, len(participants))
	for i, p := range participants {
		resp[i] = domain.ToParticipantResponse(p)
	}
	httpx.WriteJSON(w, response.OK(resp), http.StatusOK)
}

func (h *Handler) AddMember(w http.ResponseWriter, r *http.Request) {
	gid, ok := groupIDFrom(w, r)
	if !ok {
		return
	}
	var req domain.AddMemberRequest
	if !decodeBody(w, r, &req) {
		return
	}
	p, err := h.svc.AddMember(userIDFrom(r), gid, req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.Created(domain.ToParticipantResponse(*p)), http.StatusCreated)
}

func (h *Handler) DeleteMember(w http.ResponseWriter, r *http.Request) {
	gid, ok := groupIDFrom(w, r)
	if !ok {
		return
	}
	if err := h.svc.DeleteMember(userIDFrom(r), gid, r.PathValue("memberId")); err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) LinkMember(w http.ResponseWriter, r *http.Request) {
	gid, ok := groupIDFrom(w, r)
	if !ok {
		return
	}
	var req domain.LinkMemberRequest
	if !decodeBody(w, r, &req) {
		return
	}
	p, err := h.svc.LinkMember(userIDFrom(r), gid, r.PathValue("memberId"), req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.OK(domain.ToParticipantResponse(*p)), http.StatusOK)
}

func (h *Handler) GetSummary(w http.ResponseWriter, r *http.Request) {
	gid, ok := groupIDFrom(w, r)
	if !ok {
		return
	}
	sum, err := h.svc.GetSummary(userIDFrom(r), gid)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.OK(domain.ToSummaryResponse(*sum)), http.StatusOK)
}

func (h *Handler) CreateExpense(w http.ResponseWriter, r *http.Request) {
	gid, ok := groupIDFrom(w, r)
	if !ok {
		return
	}
	var req domain.CreateExpenseRequest
	if !decodeBody(w, r, &req) {
		return
	}
	e, err := h.svc.CreateExpense(userIDFrom(r), gid, req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.Created(domain.ToExpenseResponse(*e)), http.StatusCreated)
}

func (h *Handler) ListExpenses(w http.ResponseWriter, r *http.Request) {
	gid, ok := groupIDFrom(w, r)
	if !ok {
		return
	}
	page, pageSize, err := httpx.ParsePagination(r)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	expenses, total, err := h.svc.ListExpenses(userIDFrom(r), gid, pageSize, httpx.Offset(page, pageSize))
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := make([]domain.ExpenseResponse, len(expenses))
	for i, e := range expenses {
		resp[i] = domain.ToExpenseResponse(e)
	}
	httpx.WriteJSON(w, response.WithMeta(resp, page, pageSize, total), http.StatusOK)
}

func (h *Handler) DeleteExpense(w http.ResponseWriter, r *http.Request) {
	gid, ok := groupIDFrom(w, r)
	if !ok {
		return
	}
	if err := h.svc.DeleteExpense(userIDFrom(r), gid, r.PathValue("expenseId")); err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) CreateSettlement(w http.ResponseWriter, r *http.Request) {
	gid, ok := groupIDFrom(w, r)
	if !ok {
		return
	}
	var req domain.CreateSettlementRequest
	if !decodeBody(w, r, &req) {
		return
	}
	s, err := h.svc.CreateSettlement(userIDFrom(r), gid, req)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	httpx.WriteJSON(w, response.Created(domain.ToSettlementResponse(*s)), http.StatusCreated)
}

func (h *Handler) ListSettlements(w http.ResponseWriter, r *http.Request) {
	gid, ok := groupIDFrom(w, r)
	if !ok {
		return
	}
	page, pageSize, err := httpx.ParsePagination(r)
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	settlements, total, err := h.svc.ListSettlements(userIDFrom(r), gid, pageSize, httpx.Offset(page, pageSize))
	if err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	resp := make([]domain.SettlementResponse, len(settlements))
	for i, s := range settlements {
		resp[i] = domain.ToSettlementResponse(s)
	}
	httpx.WriteJSON(w, response.WithMeta(resp, page, pageSize, total), http.StatusOK)
}

func (h *Handler) DeleteSettlement(w http.ResponseWriter, r *http.Request) {
	gid, ok := groupIDFrom(w, r)
	if !ok {
		return
	}
	if err := h.svc.DeleteSettlement(userIDFrom(r), gid, r.PathValue("settlementId")); err != nil {
		httpx.WriteError(w, err, httpx.ErrHTTPStatus(err))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
