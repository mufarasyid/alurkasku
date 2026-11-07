import api from "../lib/api";

export const getTransactions = (params) =>
  api.get("/transactions", { params });

export const getTransactionOverview = (params) =>
  api.get("/transactions/overview", { params });

export const getTransactionBreakdown = (params) =>
  api.get("/transactions/breakdown", { params });

export const createTransaction = (payload) =>
  api.post("/transactions", payload);
