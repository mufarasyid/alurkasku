import axios from "axios";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  updateTokens,
} from "./auth-storage";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export class ApiError extends Error {
  constructor(message, { code, status } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const refreshClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const toApiError = (error) => {
  if (error instanceof ApiError) return error;

  const response = error.response;
  const payload = response?.data?.error;

  return new ApiError(
    payload?.message || error.message || "Something went wrong. Please try again.",
    {
      code: payload?.code,
      status: response?.status,
    },
  );
};

let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return Promise.reject(
        new ApiError("Your session has expired. Please sign in again.", {
          code: "session_expired",
          status: 401,
        }),
      );
    }

    refreshPromise = refreshClient
      .post("/auth/refresh", { refresh_token: refreshToken })
      .then(({ data }) => {
        updateTokens(data.data);
        return data.data.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const { response, config } = error;
    const isAuthRequest = config?.url?.startsWith("/auth/");

    if (response?.status === 401 && !config?._retry && !isAuthRequest) {
      config._retry = true;

      try {
        const accessToken = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${accessToken}`;
        return api(config);
      } catch (refreshError) {
        clearSession();
        return Promise.reject(toApiError(refreshError));
      }
    }

    return Promise.reject(toApiError(error));
  },
);

export default api;
