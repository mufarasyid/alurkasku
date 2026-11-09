import { useState } from "react";
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
} from "../../lib/auth-storage";
import {
  getPreferences,
  updatePreferences,
} from "../../lib/preferences";
import { logout } from "../../services/auth";

const PERIOD_OPTIONS = [
  { key: "this-month", label: "This Month" },
  { key: "last-month", label: "Last Month" },
  { key: "last-3-months", label: "Last 3 Months" },
  { key: "this-year", label: "This Year" },
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
