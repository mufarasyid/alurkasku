import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { LogOut } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import CardDashboard from "../../components/templates/CardDashboard";
import {
  getStoredUser,
  getRefreshToken,
  clearSession,
  updateStoredUser,
} from "../../lib/auth-storage";
import {
  getPreferences,
  updatePreferences,
} from "../../lib/preferences";
import { getUser, updateUser } from "../../services/user";
import { logout } from "../../services/auth";

const PERIOD_OPTIONS = [
  { key: "this-month", label: "This Month" },
  { key: "last-month", label: "Last Month" },
  { key: "last-3-months", label: "Last 3 Months" },
  { key: "this-year", label: "This Year" },
];

const PAYDAY_OPTIONS = [
  { value: "0", label: "Not set (calendar months)" },
  ...Array.from({ length: 31 }, (_, index) => ({
    value: String(index + 1),
    label: `Day ${index + 1} of each month`,
  })),
];

const Toggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
          checked ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  </div>
);

const SettingsPage = () => {
  const navigate = useNavigate();
  const user = getStoredUser() ?? {};
  const [preferences, setPreferences] = useState(getPreferences);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [payday, setPayday] = useState("0");
  const [paydayLoading, setPaydayLoading] = useState(() => Boolean(getStoredUser()?.id));
  const [paydaySaving, setPaydaySaving] = useState(false);
  const [paydayError, setPaydayError] = useState("");
  const [paydaySaved, setPaydaySaved] = useState(false);

  useEffect(() => {
    let active = true;
    const stored = getStoredUser();
    if (!stored?.id) return undefined;
    getUser(stored.id)
      .then((res) => {
        if (!active) return;
        setPayday(res?.data?.payday_day ? String(res.data.payday_day) : "0");
      })
      .catch(() => {
        if (active) setPaydayError("Failed to load your payday setting.");
      })
      .finally(() => {
        if (active) setPaydayLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handlePaydayChange = async (value) => {
    setPayday(value);
    setPaydaySaved(false);
    setPaydayError("");
    setPaydaySaving(true);
    try {
      const stored = getStoredUser();
      const payload =
        value === "0"
          ? { clear_payday_day: true }
          : { payday_day: Number(value) };
      await updateUser(stored.id, payload);
      updateStoredUser({
        payday_day: value === "0" ? null : Number(value),
      });
      setPaydaySaved(true);
    } catch (err) {
      setPaydayError(err.message || "Failed to save payday setting.");
    } finally {
      setPaydaySaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout(getRefreshToken());
    } catch {
      // Clear the local session even if the server call fails.
    }
    clearSession();
    navigate("/login");
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Customize how Alurkasku looks and behaves for you.
        </p>
      </div>

      <CardDashboard
        title="Payday cycle"
        description="Monthly reports follow your pay cycle instead of calendar months."
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-payday" className="text-sm font-medium">
            Payday
          </label>
          {paydayLoading ? (
            <div className="h-9 w-full animate-pulse rounded-md bg-muted sm:max-w-xs" aria-busy="true" />
          ) : (
            <Select value={payday} onValueChange={handlePaydayChange} disabled={paydaySaving}>
              <SelectTrigger id="settings-payday" className="w-full sm:max-w-xs">
                <SelectValue placeholder="Select payday" />
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={6}>
                {PAYDAY_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground">
            Affects &quot;This month&quot;, &quot;Last month&quot; and &quot;Last 3 months&quot; on
            Transactions and reports: from the previous payday until the day before the next.
            &quot;This year&quot; stays calendar. Budgets are not affected yet.
          </p>
          {paydayError && (
            <p role="alert" className="text-xs text-destructive">
              {paydayError}
            </p>
          )}
          {paydaySaved && !paydayError && (
            <p role="status" className="text-xs text-emerald-600 dark:text-emerald-400">
              Saved. This month now starts from your payday.
            </p>
          )}
        </div>
      </CardDashboard>

      <CardDashboard
        title="Preferences"
        description="Stored on this device."
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="settings-period" className="text-sm font-medium">
              Default transaction period
            </label>
            <Select
              value={preferences.defaultPeriod}
              onValueChange={(value) =>
                setPreferences(updatePreferences({ defaultPeriod: value }))
              }
            >
              <SelectTrigger id="settings-period" className="w-full sm:max-w-xs">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={6}>
                {PERIOD_OPTIONS.map(({ key, label }) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The period filter used on the Transactions page.
            </p>
          </div>

          <Toggle
            label="Budget alerts"
            description="Warn when a budget usage passes 90%."
            checked={preferences.budgetAlerts}
            onChange={(checked) =>
              setPreferences(updatePreferences({ budgetAlerts: checked }))
            }
          />

          <Toggle
            label="Weekly summary"
            description="Get a weekly recap of your money flow."
            checked={preferences.weeklySummary}
            onChange={(checked) =>
              setPreferences(updatePreferences({ weeklySummary: checked }))
            }
          />
        </div>
      </CardDashboard>

      <CardDashboard
        title="Session"
        description="Manage your current signed-in session."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="shrink-0"
          >
            <LogOut className="size-4" />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </Button>
        </div>
      </CardDashboard>
    </div>
  );
};

export default SettingsPage;
