package router

import "net/http"

type Router struct {
	handler http.Handler
	mux     *http.ServeMux
}

func New() *Router {
	return &Router{mux: http.NewServeMux()}
}

func (r *Router) Handle(pattern string, handler http.Handler) {
	r.mux.Handle(pattern, handler)
}

func (r *Router) Wrap(middleware func(http.Handler) http.Handler) {
	r.handler = middleware(r.mux)
}

func (r *Router) Handler() http.Handler {
	if r.handler != nil {
		return r.handler
	}
	return r.mux
}
