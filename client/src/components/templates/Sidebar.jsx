import { useState } from "react";
import { NavLink, useLocation } from "react-router";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  ChartNoAxesCombined,
  Tags,
  Repeat,
  Target,
  Settings,
  ChevronDown,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

import sidebarData from "../../assets/data/sidebar-data";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownLabel,
} from "../ui/dropdown";

const iconMap = {
  Dashboard: LayoutDashboard,
  Transactions: ArrowLeftRight,
  Accounts: Wallet,
  Budgets: ChartNoAxesCombined,
  Categories: Tags,
  Recurring: Repeat,
  "Financial Goals": Target,
  Portfolio: TrendingUp,
  Settings,
};

const Sidebar = ({ collapsed = false, onNavigate }) => {
  const location = useLocation();

  const [expandedMenus, setExpandedMenus] = useState({
    Portfolio: true,
  });

  const toggleMenu = (title) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Collapsed rail has no room for a submenu, so children open in a flyout.
  const [flyoutPosition, setFlyoutPosition] = useState({ top: 0, left: 0 });

  const measureFlyout = (childCount) => (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const estimatedHeight = childCount * 42 + 58;
    const maxTop = window.innerHeight - estimatedHeight - 12;

    setFlyoutPosition({
      top: Math.max(12, Math.min(rect.top, maxTop)),
      left: rect.right + 10,
    });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-primary text-white">
      {/* Logo */}
      <div
        className={`flex h-20 shrink-0 items-center gap-3 border-b border-white/10 ${
          collapsed ? "justify-center" : "px-6"
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-primary">
          <Wallet size={22} strokeWidth={2.5} />
        </div>

        {!collapsed && (
          <div className="whitespace-nowrap">
            <h1 className="text-lg font-bold tracking-wide">Alurkasku</h1>
            <p className="text-xs text-white/50">Money Management</p>
          </div>
        )}
      </div>
      {/* Menu */}
      <nav
        className={`flex-1 space-y-7 overflow-y-auto overflow-x-hidden py-6 ${
          collapsed ? "px-2" : "px-4"
        }`}
      >
        {sidebarData.map((section) => (
          <div key={section.title}>
            {/* Section title */}
            {!collapsed && (
              <h2 className="mb-3 px-3 text-[11px] font-bold tracking-[0.18em] text-white/40">
                {section.title}
              </h2>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon =
                  item.icon ?? iconMap[item.title] ?? LayoutDashboard;

                const hasChildren =
                  Array.isArray(item.children) && item.children.length > 0;

                const isChildActive = item.children?.some(
                  (child) => location.pathname === child.path,
                );

                const isActive =
                  location.pathname === item.path ||
                  (item.path !== "/" &&
                    location.pathname.startsWith(`${item.path}/`));

                const isExpanded = expandedMenus[item.title] ?? false;

                if (hasChildren) {
                  const parentActive = isChildActive || isActive;

                  if (collapsed) {
                    return (
                      <div
                        key={item.path}
                        className="flex w-full justify-center"
                        onClickCapture={measureFlyout(item.children.length)}
                      >
                        <Dropdown>
                          <DropdownTrigger
                            type="button"
                            title={item.title}
                            aria-label={item.title}
                            className={`group flex items-center justify-center rounded-xl px-2 py-2 text-sm font-medium transition-all duration-200 ${
                              parentActive
                                ? "bg-white/10 text-white"
                                : "text-white/65 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                parentActive
                                  ? "bg-cyan-400/15 text-cyan-300"
                                  : "bg-white/5 text-white/60 group-hover:text-white"
                              }`}
                            >
                              <Icon size={19} strokeWidth={1.8} />
                            </span>
                          </DropdownTrigger>

                          <DropdownContent
                            role="navigation"
                            aria-label={item.title}
                            className="min-w-48 border-white/10 bg-primary p-1.5 text-white shadow-xl shadow-black/40"
                            style={{
                              position: "fixed",
                              top: flyoutPosition.top,
                              left: flyoutPosition.left,
                            }}
                          >
                            <DropdownLabel className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                              {item.title}
                            </DropdownLabel>

                            <div className="space-y-1">
                              {item.children.map((child) => (
                                <NavLink
                                  key={child.path + child.title}
                                  to={child.path}
                                  end
                                  onClick={onNavigate}
                                  className={({ isActive: childActive }) =>
                                    `block whitespace-nowrap rounded-md px-3 py-2 text-[13px] transition-colors ${
                                      childActive
                                        ? "bg-cyan-400/10 font-semibold text-cyan-300"
                                        : "text-white/65 hover:bg-white/5 hover:text-white"
                                    }`
                                  }
                                >
                                  {child.title}
                                </NavLink>
                              ))}
                            </div>
                          </DropdownContent>
                        </Dropdown>
                      </div>
                    );
                  }

                  return (
                    <div key={item.title}>
                      <button
                        type="button"
                        onClick={() => toggleMenu(item.title)}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                          parentActive
                            ? "bg-white/10 text-white"
                            : "text-white/65 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            parentActive
                              ? "bg-cyan-400/15 text-cyan-300"
                              : "bg-white/5 text-white/60 group-hover:text-white"
                          }`}
                        >
                          <Icon size={19} strokeWidth={1.8} />
                        </span>

                        <span className="flex-1 text-left">{item.title}</span>

                        <ChevronDown
                          size={16}
                          className={`text-white/40 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Submenu */}
                      <div
                        className={`grid transition-[grid-template-rows] duration-200 ${
                          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="ml-7.25 mt-1 space-y-1 border-l border-white/10 py-1 pl-5">
                            {item.children.map((child) => {
                              const childActive =
                                location.pathname === child.path;

                              return (
                                <NavLink
                                  key={child.path + child.title}
                                  to={child.path}
                                  end
                                  onClick={onNavigate}
                                  className={() =>
                                    `relative block whitespace-nowrap rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                                      childActive
                                        ? "bg-cyan-400/10 font-semibold text-cyan-300"
                                        : "text-white/50 hover:bg-white/5 hover:text-white/90"
                                    }`
                                  }
                                >
                                  {childActive && (
                                    <span className="absolute -left-6.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-cyan-400 ring-4 ring-primary" />
                                  )}

                                  {child.title}
                                </NavLink>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    title={collapsed ? item.title : undefined}
                    aria-label={collapsed ? item.title : undefined}
                    onClick={onNavigate}
                    className={({ isActive: active }) =>
                      `group flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium transition-all duration-200 ${
                        collapsed ? "justify-center" : ""
                      } ${
                        active
                          ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/10"
                          : "text-white/65 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    {({ isActive: active }) => (
                      <>
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            active
                              ? "bg-black/5 text-slate-950"
                              : "bg-white/5 text-white/60 group-hover:text-white"
                          }`}
                        >
                          <Icon size={19} strokeWidth={1.8} />
                        </span>

                        {!collapsed && (
                          <span className="flex-1 whitespace-nowrap">
                            {item.title}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer - Logged In User */}
      <div
        className={`shrink-0 border-t border-white/10 ${
          collapsed ? "p-2" : "p-4"
        }`}
      >
        {(() => {
          const user = JSON.parse(localStorage.getItem("user") || "{}");

          const name = user.name || user.fullName || "Jhon Doe";
          const email = user.email || "jhondoe@example.com";
          const initials = name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0])
            .join("")
            .toUpperCase();

          return (
            <div
              className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10 ${
                collapsed ? "justify-center" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cyan-400 text-sm font-bold text-slate-950"
                title={collapsed ? name : undefined}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              {!collapsed && (
                <>
                  {/* User Information */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {name}
                    </p>
                    <p className="truncate text-xs text-white/50">{email}</p>
                  </div>

                  {/* Profile Menu */}
                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <ChevronRight size={17} strokeWidth={1.8} />
                  </button>
                </>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Sidebar;
