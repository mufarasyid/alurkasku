import api from "../lib/api";

export const login = (credentials) =>
  api.post("/auth/login", credentials);

export const register = (payload) =>
  api.post("/auth/register", payload);

export const refreshToken = (token) =>
  api.post("/auth/refresh", { refresh_token: token });

export const logout = (token) =>
  api.post("/auth/logout", { refresh_token: token });
