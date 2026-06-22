import { NavLink, useLocation, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, LogOut, Settings } from "lucide-react";
import { navigation, type NavItem, type NavChild } from "@/config/navigation";
import { useUIStore } from "@/store/ui";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

// ─── Root sidebar ─────────────────────────────────────────────────────────────

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-light-gray flex flex-col z-40",
        "transition-[width] duration-300 ease-in-out",
        sidebarCollapsed ? "w-[72px]" : "w-60",
      )}
    >
      <SidebarHeader collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-0.5">
        {navigation.map((item) =>
          item.children ? (
            <SectionGroup
              key={item.id}
              item={item}
              collapsed={sidebarCollapsed}
              onExpand={() => useUIStore.getState().setSidebarCollapsed(false)}
            />
          ) : (
            <StandaloneLink
              key={item.id}
              item={item}
              collapsed={sidebarCollapsed}
            />
          ),
        )}
      </nav>

      <SidebarFooter collapsed={sidebarCollapsed} />
    </aside>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function SidebarHeader({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center h-16 border-b border-light-gray shrink-0 px-3 gap-2",
        collapsed
          ? "justify-center flex-col gap-1 py-2 h-auto pt-4 pb-2"
          : "justify-between",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-2.5",
          collapsed && "justify-center",
        )}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white overflow-hidden ring-1 ring-light-gray shrink-0">
          <img
            src="/scalystic_logo_only.png"
            alt="Scalystic logo"
            className="w-full h-full object-contain"
          />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-foreground tracking-tight whitespace-nowrap leading-tight">
              Scalystic AIOS
            </span>
            <span className="text-muted-foreground text-[10px] font-semibold">
              Ved Sanjeevani
            </span>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md shrink-0",
          "text-gray hover:text-slate hover:bg-light-gray cursor-pointer transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-green",
          collapsed && "mt-1",
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

// ─── Standalone link (items without children) ─────────────────────────────────

function StandaloneLink({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  if (!item.path) return null;

  return (
    <Tooltip label={item.label} collapsed={collapsed}>
      <NavLink
        to={item.path}
        end={item.path === "/"}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 cursor-pointer group w-full",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-green",
            collapsed && "justify-center px-0",
            isActive
              ? "bg-mint text-deep-green font-medium"
              : "text-slate hover:bg-light-gray hover:text-foreground",
          )
        }
      >
        <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
      </NavLink>
    </Tooltip>
  );
}

// ─── Section group (items with children → section header + child links) ───────

function SectionGroup({
  item,
  collapsed,
  onExpand,
}: {
  item: NavItem;
  collapsed: boolean;
  onExpand: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const isAnyChildActive = item.children?.some((c) =>
    location.pathname.startsWith(c.path),
  );

  // In collapsed mode: single icon for the whole section
  if (collapsed) {
    const firstPath = item.children?.[0]?.path ?? "/";

    return (
      <Tooltip label={item.label} collapsed>
        <button
          type="button"
          onClick={() => {
            onExpand();
            navigate(firstPath);
          }}
          className={cn(
            "flex w-full justify-center items-center py-2 px-0 rounded-lg transition-colors duration-150 cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-green",
            isAnyChildActive
              ? "bg-mint text-deep-green"
              : "text-slate hover:bg-light-gray hover:text-foreground",
          )}
          aria-label={item.label}
        >
          <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        </button>
      </Tooltip>
    );
  }

  // Expanded mode: section header + child links
  return (
    <div className="pt-3 first:pt-0">
      {/* Section header */}
      <div className="flex items-center gap-2 px-3 mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray">
          {item.label}
        </span>
      </div>

      {/* Children */}
      <div className="space-y-0.5">
        {item.children?.map((child) => (
          <ChildLink key={child.id} child={child} />
        ))}
      </div>
    </div>
  );
}

// ─── Child link ───────────────────────────────────────────────────────────────

function ChildLink({ child }: { child: NavChild }) {
  return (
    <NavLink
      to={child.path}
      end={child.end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-green",
          isActive
            ? "bg-mint text-deep-green font-medium"
            : "text-slate hover:bg-light-gray hover:text-foreground",
        )
      }
    >
      {child.icon ? (
        <child.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <span className="h-4 w-4 shrink-0 flex items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
        </span>
      )}
      <span className="whitespace-nowrap">{child.label}</span>
    </NavLink>
  );
}

// ─── Footer (user profile + log out) ─────────────────────────────────────────

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const { logout } = useAuth();
  return (
    <div className="border-t border-light-gray shrink-0 p-3 space-y-1">
      {/* User row */}
      <div
        className={cn(
          "flex items-center gap-2.5 px-2 py-2 rounded-lg",
          collapsed && "justify-center",
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-deep-green text-off-white text-xs font-semibold shrink-0 select-none">
          A
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate leading-tight">
              Admin User
            </p>
            <p className="text-[10px] text-gray truncate leading-tight">
              Admin Manager
            </p>
          </div>
        )}
      </div>

      {/* Settings */}
      <Tooltip label="Settings" collapsed={collapsed}>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 cursor-pointer group w-full",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-green",
              collapsed && "justify-center px-0",
              isActive
                ? "bg-mint text-deep-green font-medium"
                : "text-slate hover:bg-light-gray hover:text-foreground",
            )
          }
        >
          <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed && <span className="whitespace-nowrap">Settings</span>}
        </NavLink>
      </Tooltip>

      {/* Log out */}
      <Tooltip label="Log out" collapsed={collapsed}>
        <button
          type="button"
          onClick={logout}
          className={cn(
            "flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray",
            "hover:bg-light-gray hover:text-foreground cursor-pointer transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-green",
            collapsed && "justify-center px-0",
          )}
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed && <span className="whitespace-nowrap">Log out</span>}
        </button>
      </Tooltip>
    </div>
  );
}

// ─── Tooltip (shown only when sidebar is collapsed) ───────────────────────────

function Tooltip({
  children,
  label,
  collapsed,
}: {
  children: React.ReactNode;
  label: string;
  collapsed: boolean;
}) {
  if (!collapsed) return <>{children}</>;

  return (
    <div className="relative group">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50",
          "px-2.5 py-1.5 rounded-md bg-charcoal text-off-white text-xs font-medium whitespace-nowrap",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
          "shadow-lg",
        )}
      >
        {label}
        {/* Arrow */}
        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-charcoal" />
      </span>
    </div>
  );
}
