import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import {
  PanelRightOpen,
  PanelRightClose,
  ChevronDown,
  User,
  LogOut,
} from "lucide-react";
import Sidebar from "../templates/Sidebar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from "../ui/dropdown";
import {
  getStoredUser,
  getRefreshToken,
  clearSession,
  USER_UPDATED_EVENT,
} from "../../lib/auth-storage";
import { logout } from "../../services/auth";

const DESKTOP_QUERY = "(min-width: 768px)";

const isDesktopViewport = () =>
  typeof window !== "undefined" &&
  window.matchMedia(DESKTOP_QUERY).matches;

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(isDesktopViewport);
  const [isSidebarOpen, setIsSidebarOpen] = useState(isDesktopViewport);
  const [, setUserVersion] = useState(0);

  // Keep the header user info in sync after profile edits.
  useEffect(() => {
    const handleUserUpdated = () => setUserVersion((version) => version + 1);
    window.addEventListener(USER_UPDATED_EVENT, handleUserUpdated);
    return () => window.removeEventListener(USER_UPDATED_EVENT, handleUserUpdated);
  }, []);

  const user = getStoredUser() ?? {};
  const name = user.name || user.fullName || "Jhon Doe";
  const email = user.email || "jhondoe@example.com";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout(getRefreshToken());
    } catch {
      // Clear the local session even if the server call fails.
    }
    clearSession();
    navigate("/login");
  };

  // On mobile the sidebar is an overlay, so close it after navigating.
  const handleNavigate = () => {
    if (!isDesktop) {
      closeSidebar();
    }
  };

  // Follow the breakpoint: open by default on tablet and up, closed on mobile.
  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_QUERY);

    const handleChange = (event) => {
      setIsDesktop(event.matches);
      setIsSidebarOpen(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden">
      {/* Mobile backdrop */}
      <div
        role="presentation"
        onClick={closeSidebar}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 md:hidden ${
          isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-40 h-screen overflow-hidden transition-all duration-300 ease-in-out md:translate-none ${
          isSidebarOpen
            ? "w-64 translate-x-0"
            : "w-64 -translate-x-full"
        } ${isSidebarOpen ? "md:w-64" : "md:w-20"}`}
      >
        <Sidebar collapsed={!isSidebarOpen} onNavigate={handleNavigate} />
      </div>

      {/* Main Content */}
      <div
        className={`flex h-screen flex-col transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "pl-0 md:pl-64" : "pl-0 md:pl-20"
        }`}
      >
        {/* Header */}
        <div className="h-20 w-full shrink-0 border-b border-black/10 flex items-center justify-between px-6">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isSidebarOpen}
            className="w-9 h-9 bg-primary flex items-center justify-center rounded-lg text-white hover:bg-primary/90 transition-colors"
          >
            {isSidebarOpen ? (
              <PanelRightOpen size={19} strokeWidth={1.8} />
            ) : (
              <PanelRightClose size={19} strokeWidth={1.8} />
            )}
          </button>

          {/* Logged in user */}
          <Dropdown>
            <DropdownTrigger
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={`Account menu for ${name}`}
            >
              <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cyan-400 text-sm font-bold text-slate-950">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </span>
              <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
                <span className="max-w-40 truncate text-sm font-semibold text-foreground">
                  {name}
                </span>
                <span className="max-w-40 truncate text-xs text-muted-foreground">
                  {email}
                </span>
              </span>
              <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
            </DropdownTrigger>
            <DropdownContent align="end" className="w-56">
              <DropdownLabel>
                <span className="block truncate text-sm font-semibold text-foreground">
                  {name}
                </span>
                <span className="block truncate text-xs font-normal">{email}</span>
              </DropdownLabel>
              <DropdownSeparator />
              <DropdownItem className="gap-2" onClick={() => navigate("/dashboard/profile")}>
                <User className="size-4" />
                Profile
              </DropdownItem>
              <DropdownItem className="gap-2 text-destructive focus:text-destructive hover:text-destructive" onClick={handleLogout}>
                <LogOut className="size-4" />
                Logout
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex min-h-full flex-col p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
