import api from "../lib/api";

export const getBudgets = (params) =>
  api.get("/budgets", { params });

export const createBudget = (payload) =>
  api.post("/budgets", payload);

export const updateBudget = (id, payload) =>
  api.put(`/budgets/${id}`, payload);

export const deleteBudget = (id) =>
  api.delete(`/budgets/${id}`);

export const bulkDeleteBudgets = (ids) =>
  api.post("/budgets/bulk-delete", { ids });
