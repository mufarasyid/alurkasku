import api from "../lib/api";

export const getCategories = (params) =>
  api.get("/categories", { params });

export const createCategory = (payload) =>
  api.post("/categories", payload);

export const updateCategory = (id, payload) =>
  api.put(`/categories/${id}`, payload);

export const deleteCategory = (id) =>
  api.delete(`/categories/${id}`);

export const bulkDeleteCategories = (ids) =>
  api.post("/categories/bulk-delete", { ids });
