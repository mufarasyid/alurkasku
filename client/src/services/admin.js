import api from "../lib/api";

export const listAdminUsers = ({ page = 1, pageSize = 10, q, role } = {}) => {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (q) params.set("q", q);
  if (role && role !== "all") params.set("role", role);
  return api.get(`/admin/users?${params.toString()}`);
};

export const getAdminUser = (id) => api.get(`/admin/users/${id}`);

export const updateAdminUser = (id, payload) => api.put(`/admin/users/${id}`, payload);

export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`);

export const getUserAccounts = (id, { page = 1, pageSize = 10, q } = {}) => {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (q) params.set("q", q);
  return api.get(`/admin/users/${id}/accounts?${params.toString()}`);
};

export const getUserTransactions = (id, { page = 1, pageSize = 10, q, type, period } = {}) => {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (q) params.set("q", q);
  if (type && type !== "all") params.set("type", type);
  if (period && period !== "all") params.set("period", period);
  return api.get(`/admin/users/${id}/transactions?${params.toString()}`);
};

export const getUserOverview = (id, period = "this-month") =>
  api.get(`/admin/users/${id}/transactions/overview?period=${encodeURIComponent(period)}`);

export const getUserBudgets = (id, { page = 1, pageSize = 10, q, period } = {}) => {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (q) params.set("q", q);
  if (period && period !== "all") params.set("period", period);
  return api.get(`/admin/users/${id}/budgets?${params.toString()}`);
};

export const getUserCategories = (id, { page = 1, pageSize = 10, q, type } = {}) => {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (q) params.set("q", q);
  if (type && type !== "all") params.set("type", type);
  return api.get(`/admin/users/${id}/categories?${params.toString()}`);
};

export const getUserSubscriptions = (id) => api.get(`/admin/users/${id}/subscriptions`);
