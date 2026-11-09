import api from "../lib/api";

export const getUser = (id) => api.get(`/users/${id}`);

export const updateUser = (id, payload) => api.put(`/users/${id}`, payload);
