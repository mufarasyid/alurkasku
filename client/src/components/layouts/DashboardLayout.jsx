import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { PanelRightOpen, PanelRightClose } from "lucide-react";
import Sidebar from "../templates/Sidebar";

const DESKTOP_QUERY = "(min-width: 768px)";

const isDesktopViewport = () =>
  typeof window !== "undefined" &&
  window.matchMedia(DESKTOP_QUERY).matches;

const DashboardLayout = () => {
  const [isDesktop, setIsDesktop] = useState(isDesktopViewport);
  const [isSidebarOpen, setIsSidebarOpen] = useState(isDesktopViewport);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
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
