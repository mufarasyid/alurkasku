import api from "../lib/api";

export const getAccounts = (params) =>
  api.get("/accounts", { params });

export const createAccount = (payload) =>
  api.post("/accounts", payload);

export const updateAccount = (id, payload) =>
  api.put(`/accounts/${id}`, payload);

export const deleteAccount = (id) =>
  api.delete(`/accounts/${id}`);

export const bulkDeleteAccounts = (ids) =>
  api.post("/accounts/bulk-delete", { ids });
