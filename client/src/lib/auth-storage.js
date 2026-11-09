const STORAGE_KEYS = {
  accessToken: "alurkasku.access_token",
  refreshToken: "alurkasku.refresh_token",
  user: "alurkasku.user",
};

export const getAccessToken = () => localStorage.getItem(STORAGE_KEYS.accessToken);

export const getRefreshToken = () => localStorage.getItem(STORAGE_KEYS.refreshToken);

export const getStoredUser = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const updateTokens = (token) => {
  if (token?.access_token) {
    localStorage.setItem(STORAGE_KEYS.accessToken, token.access_token);
  }
  if (token?.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, token.refresh_token);
  }
};

export const saveSession = ({ user, token }) => {
  updateTokens(token);
  if (user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  }
};

export const clearSession = () => {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
};

export const USER_UPDATED_EVENT = "alurkasku:user-updated";

export const updateStoredUser = (patch) => {
  const user = getStoredUser();
  if (!user) return;
  localStorage.setItem(
    STORAGE_KEYS.user,
    JSON.stringify({ ...user, ...patch }),
  );
  window.dispatchEvent(new Event(USER_UPDATED_EVENT));
};
