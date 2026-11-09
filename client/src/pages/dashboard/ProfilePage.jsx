import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import CardDashboard from "../../components/templates/CardDashboard";
import { getStoredUser, updateStoredUser } from "../../lib/auth-storage";
import { getUser, updateUser } from "../../services/user";
import { formatShortDate } from "../../lib/format";

const ProfilePage = () => {
  // Snapshot the session user once so the fetch effect stays stable.
  const [initialUser] = useState(() => getStoredUser() ?? null);
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(() => Boolean(initialUser?.id));
  const [loadError, setLoadError] = useState(() =>
    initialUser?.id ? "" : "No signed-in user found. Please log in again.",
  );
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    if (!initialUser?.id) return;
    getUser(initialUser.id)
      .then((res) => {
        if (!active) return;
        setUser(res.data ?? initialUser);
        setName(res.data?.name ?? "");
      })
      .catch((err) => {
        if (!active) return;
        setUser(initialUser);
        setName(initialUser.name ?? "");
        setLoadError(err.message || "Failed to load profile.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialUser]);

  const initials = (name || user?.name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const handleSave = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setFormError("Name must be at least 2 characters.");
      return;
    }
    if (trimmed === (user?.name ?? "")) {
      setFormError("No changes to save.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    setSaved(false);
    try {
      const res = await updateUser(user.id, { name: trimmed });
      setUser(res.data);
      updateStoredUser({ name: res.data.name, email: res.data.email });
      setSaved(true);
    } catch (err) {
      setFormError(err.message || "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
          Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal information.
        </p>
      </div>

      {loadError && (
        <div
          role="alert"
          className="flex shrink-0 items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => setLoadError("")}
            aria-label="Dismiss error"
            className="rounded-md p-0.5 transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <CardDashboard
        title="Profile info"
        description="Your name and email. The name appears in the header and on your transactions."
      >
        {isLoading ? (
          <div className="flex flex-col gap-4 py-1" aria-busy="true">
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cyan-400 text-lg font-bold text-slate-950">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{user?.name}</p>
                <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
              </div>
              {user?.role && (
                <Badge variant={user.role === "admin" ? "default" : "secondary"} className="ml-auto">
                  {user.role}
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="profile-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="profile-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setSaved(false);
                }}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="profile-email" className="text-sm font-medium">
                Email
              </label>
              <Input id="profile-email" value={user?.email ?? ""} readOnly />
              <p className="text-xs text-muted-foreground">
                Contact an admin to change your email.
              </p>
            </div>

            {formError && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </p>
            )}

            {saved && (
              <p
                role="status"
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
              >
                Profile updated.
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        )}
      </CardDashboard>

      <CardDashboard
        title="Account details"
        description="Read-only details about your account."
        className={cn(
          {
            "opacity-60": isLoading,
          },
        )}
      >
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Member since
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {user?.created_at ? formatShortDate(user.created_at) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              User ID
            </dt>
            <dd className="mt-1 truncate font-mono text-xs">{user?.id ?? "—"}</dd>
          </div>
        </dl>
      </CardDashboard>
    </div>
  );
};

export default ProfilePage;
