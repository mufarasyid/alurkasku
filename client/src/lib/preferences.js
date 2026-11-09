const STORAGE_KEY = "alurkasku.preferences";

export const PREFERENCES_CHANGED_EVENT = "alurkasku:preferences-changed";

export const DEFAULT_PREFERENCES = {
  defaultPeriod: "this-month",
  budgetAlerts: true,
  weeklySummary: false,
};

export const getPreferences = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
};

export const updatePreferences = (patch) => {
  const next = { ...getPreferences(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(PREFERENCES_CHANGED_EVENT));
  return next;
};
