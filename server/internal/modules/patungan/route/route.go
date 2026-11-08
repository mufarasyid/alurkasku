package route

import (
	"net/http"

	patunganHandler "github.com/mufarasyid/alurkasku/server/internal/modules/patungan/handler"
	patunganService "github.com/mufarasyid/alurkasku/server/internal/modules/patungan/service"
	"github.com/mufarasyid/alurkasku/server/internal/router"
)

func Setup(r *router.Router, svc *patunganService.Service, logMiddleware func(http.Handler) http.Handler, authMiddleware func(http.Handler) http.Handler) {
	h := patunganHandler.New(svc)

	m := func(next http.Handler) http.Handler {
		return logMiddleware(authMiddleware(next))
	}

	r.Handle("POST /api/v1/patungan/groups", m(http.HandlerFunc(h.CreateGroup)))
	r.Handle("GET /api/v1/patungan/groups", m(http.HandlerFunc(h.ListGroups)))
	r.Handle("GET /api/v1/patungan/groups/{id}", m(http.HandlerFunc(h.GetGroup)))
	r.Handle("PATCH /api/v1/patungan/groups/{id}", m(http.HandlerFunc(h.UpdateGroup)))
	r.Handle("DELETE /api/v1/patungan/groups/{id}", m(http.HandlerFunc(h.DeleteGroup)))
	r.Handle("GET /api/v1/patungan/groups/{id}/members", m(http.HandlerFunc(h.ListMembers)))
	r.Handle("POST /api/v1/patungan/groups/{id}/members", m(http.HandlerFunc(h.AddMember)))
	r.Handle("DELETE /api/v1/patungan/groups/{id}/members/{memberId}", m(http.HandlerFunc(h.DeleteMember)))
	r.Handle("PATCH /api/v1/patungan/groups/{id}/members/{memberId}/link", m(http.HandlerFunc(h.LinkMember)))
	r.Handle("GET /api/v1/patungan/groups/{id}/summary", m(http.HandlerFunc(h.GetSummary)))
	r.Handle("GET /api/v1/patungan/groups/{id}/expenses", m(http.HandlerFunc(h.ListExpenses)))
	r.Handle("POST /api/v1/patungan/groups/{id}/expenses", m(http.HandlerFunc(h.CreateExpense)))
	r.Handle("DELETE /api/v1/patungan/groups/{id}/expenses/{expenseId}", m(http.HandlerFunc(h.DeleteExpense)))
	r.Handle("GET /api/v1/patungan/groups/{id}/settlements", m(http.HandlerFunc(h.ListSettlements)))
	r.Handle("POST /api/v1/patungan/groups/{id}/settlements", m(http.HandlerFunc(h.CreateSettlement)))
	r.Handle("DELETE /api/v1/patungan/groups/{id}/settlements/{settlementId}", m(http.HandlerFunc(h.DeleteSettlement)))
}
