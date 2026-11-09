import api from "../lib/api";

export const getPatunganGroups = (params) => api.get("/patungan/groups", { params });

export const createPatunganGroup = (payload) => api.post("/patungan/groups", payload);

export const getPatunganGroup = (id) => api.get(`/patungan/groups/${id}`);

export const updatePatunganGroup = (id, payload) => api.patch(`/patungan/groups/${id}`, payload);

export const deletePatunganGroup = (id) => api.delete(`/patungan/groups/${id}`);

export const getPatunganMembers = (groupId) => api.get(`/patungan/groups/${groupId}/members`);

export const addPatunganMember = (groupId, payload) => api.post(`/patungan/groups/${groupId}/members`, payload);

export const deletePatunganMember = (groupId, memberId) => api.delete(`/patungan/groups/${groupId}/members/${memberId}`);

export const linkPatunganMember = (groupId, memberId, payload) => api.patch(`/patungan/groups/${groupId}/members/${memberId}/link`, payload);

export const getPatunganSummary = (groupId) => api.get(`/patungan/groups/${groupId}/summary`);

export const getPatunganExpenses = (groupId, params) => api.get(`/patungan/groups/${groupId}/expenses`, { params });

export const createPatunganExpense = (groupId, payload) => api.post(`/patungan/groups/${groupId}/expenses`, payload);

export const deletePatunganExpense = (groupId, expenseId) => api.delete(`/patungan/groups/${groupId}/expenses/${expenseId}`);

export const getPatunganSettlements = (groupId, params) => api.get(`/patungan/groups/${groupId}/settlements`, { params });

export const createPatunganSettlement = (groupId, payload) => api.post(`/patungan/groups/${groupId}/settlements`, payload);

export const deletePatunganSettlement = (groupId, settlementId) => api.delete(`/patungan/groups/${groupId}/settlements/${settlementId}`);
