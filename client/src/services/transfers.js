import api from "../lib/api";

export const getTransfers = (params) =>
  api.get("/transfers", { params });

export const createTransfer = (payload) =>
  api.post("/transfers", payload);

export const getWithdrawals = (params) =>
  api.get("/withdrawals", { params });

export const createWithdrawal = (payload) =>
  api.post("/withdrawals", payload);
