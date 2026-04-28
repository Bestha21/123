import { useEffect, useState, useRef, createContext, useContext } from "react";
import { Link, useLocation } from "wouter";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { preloadPage } from "@/lib/pagePreload";
import { 
  LayoutDashboard, Users, UserPlus, ClipboardCheck, CalendarRange, DollarSign, 
  LogOut, Receipt, Laptop, UserX, Bell, Building2, CalendarDays, FileText, 
  Network, GitBranch, Contact, BarChart3, UserCheck,UserCircle, FileSpreadsheet, Plug, 
  Target, GraduationCap, Heart, Plane, FolderKanban, Package, Briefcase, 
  FileCheck, Banknote, Scale, BookOpen, Clock, Layers, ChevronDown, Menu, X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Employee } from "@shared/schema";
import { useEntity } from "@/lib/entityContext";

const SidebarContext = createContext<{ isOpen: boolean; setIsOpen: (v: boolean) => void }>({ isOpen: false, setIsOpen: () => {} });
export function useSidebar() { return useContext(SidebarContext); }
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return <SidebarContext.Provider value={{ isOpen, setIsOpen }}>{children}</SidebarContext.Provider>;
}

export function MobileHeader() {
  const { setIsOpen } = useSidebar();
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
      <button onClick={() => setIsOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-100" data-testid="button-mobile-menu">
        <Menu className="w-5 h-5 text-slate-700" />
      </button>
      <span className="font-bold text-sm text-orange-600">Kadenc</span>
      <span className="font-bold text-sm text-slate-800">People Management</span>
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { entities, selectedEntityId, selectedEntityIds, setSelectedEntityId, setSelectedEntityIds } = useEntity();
  const [entityDropdownOpen, setEntityDropdownOpen] = useState(false);
  const entityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (entityDropdownRef.current && !entityDropdownRef.current.contains(e.target as Node)) {
        setEntityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees", "all"],
    queryFn: async () => {
      const res = await fetch("/api/employees", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const currentEmployee = employees.find(e => e.email?.toLowerCase() === user?.email?.toLowerCase());
  const accessRoleString = currentEmployee?.accessRole || "employee";
  const userAccessRoles = accessRoleString.split(",").map(role => role.trim().toLowerCase());

  const hasRole = (role: string) => userAccessRoles.includes(role);
  const isAdmin = hasRole("admin");
  const isHrManager = hasRole("hr_manager");
  const isLeadership = hasRole("leadership");
  const isManager = hasRole("manager");
  const isAssetTeam = hasRole("asset_team");
  const isPayrollTeam = hasRole("payroll_team");
  const isProjectTeam = hasRole("project_team");
  const isOnboardingTeam = hasRole("onboarding_team");
  const isPmsTeam = hasRole("pms_team");
  const isLmsTeam = hasRole("lms_team");
  const canSwitchEntity = isAdmin || isHrManager || isPayrollTeam || isProjectTeam || isOnboardingTeam || isManager || isLeadership || hasRole("hr") || hasRole("finance");

  useEffect(() => {
    if (currentEmployee && !canSwitchEntity && currentEmployee.entityId) {
      if (selectedEntityId !== currentEmployee.entityId) {
        setSelectedEntityId(currentEmployee.entityId);
      }
    }
  }, [currentEmployee, canSwitchEntity, selectedEntityId, setSelectedEntityId]);

  const hasHrAccess = isAdmin || isHrManager;

  const mainLinks = hasHrAccess ? [{ href: "/", label: "Dashboard", icon: LayoutDashboard }] : [];

  const hrDatabaseLinks = hasHrAccess ? [
    { href: "/employees", label: "Employee Records", icon: Users },
    { href: "/documents", label: "Document Management", icon: FileText },
    { href: "/departments", label: "Position & Org Mgmt", icon: Building2 },
    { href: "/org-tree", label: "Org Tree", icon: Network },
    { href: "/org-structure", label: "Org Structure", icon: GitBranch },
    { href: "/directory", label: "Employee Directory", icon: Contact },
    { href: "/analytics", label: "Analytics & Diversity", icon: BarChart3 },
    { href: "/self-service", label: "Employee Self Service", icon: UserCircle },
  ] : isLeadership ? [
    { href: "/self-service", label: "Employee Self Service", icon: UserCircle },
    { href: "/org-tree", label: "Org Tree", icon: Network },
    { href: "/org-structure", label: "Org Structure", icon: GitBranch },
    { href: "/directory", label: "Employee Directory", icon: Contact },
    { href: "/departments", label: "Position & Org Mgmt", icon: Building2 },
  ] : isManager ? [
    { href: "/self-service", label: "Employee Self Service", icon: UserCircle },
    { href: "/directory", label: "Employee Directory", icon: Contact },
    { href: "/org-tree", label: "Org Tree", icon: Network },
  ] : [
    { href: "/self-service", label: "Employee Self Service", icon: UserCircle },
    { href: "/directory", label: "Employee Directory", icon: Contact },
  ];

  const timeLinks = [
    { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
    { href: "/leaves", label: "Leaves", icon: CalendarRange },
    ...(hasHrAccess ? [{ href: "/holidays", label: "Holidays", icon: CalendarDays }] : []),
    ...(hasHrAccess ? [{ href: "/shift-management", label: "Shift Management", icon: Clock }] : []),
  ];

  const financeLinks = [
    ...(hasHrAccess || isPayrollTeam ? [{ href: "/payroll", label: "Payroll", icon: DollarSign }] : []),
    ...(hasHrAccess || isPayrollTeam ? [{ href: "/salary-structures", label: "Salary Structures", icon: DollarSign }] : []),
    ...(hasHrAccess || isPayrollTeam ? [{ href: "/tax-review", label: "Tax Review", icon: FileCheck }] : []),
    ...(hasHrAccess || isPayrollTeam ? [{ href: "/expenses", label: "Expenses", icon: Receipt }] : []),
    ...(hasHrAccess || isProjectTeam ? [{ href: "/projects", label: "Projects", icon: FolderKanban }] : []),
    ...(hasHrAccess || isPayrollTeam ? [{ href: "/advance-loans", label: "Loans", icon: Banknote }] : []),
    ...(isAdmin ? [{ href: "/salary-adjustments", label: "Arrears & Adjustments", icon: FileCheck }] : []),
    ...(hasHrAccess || isPayrollTeam ? [{ href: "/statutory-compliance", label: "Statutory Compliance", icon: Scale }] : []),
  ];

  const assetLinks = (isAssetTeam && !isAdmin && !isHrManager) ? [{ href: "/assets", label: "Asset Administration", icon: Laptop }] : [];

  const adminLinks = [
    ...(hasHrAccess ? [{ href: "/assets", label: "Assets", icon: Laptop }] : []),
    ...(hasHrAccess || isOnboardingTeam ? [{ href: "/onboarding", label: "Onboarding", icon: UserPlus }] : []),
    ...(hasHrAccess ? [{ href: "/exit", label: "Exit Management", icon: UserX }] : []),
	...(hasHrAccess ? [{ href: "/profile-change-requests", label: "Profile Change Requests", icon: UserCheck }] : []),
    ...(hasHrAccess ? [{ href: "/announcements", label: "Announcements", icon: Bell }] : []),
    ...(hasHrAccess ? [{ href: "/company-policies", label: "Company Policies", icon: BookOpen }] : []),
    ...(isAdmin ? [{ href: "/entity-management", label: "Entity Management", icon: Layers }] : []),
  ];

  const reportsLinks = hasHrAccess ? [
    { href: "/reports", label: "Reports & Analytics", icon: FileSpreadsheet },
    ...(isAdmin ? [{ href: "/integrations", label: "Integrations", icon: Plug }] : []),
  ] : [];

  const allTeamDashboardLinks = [
    { href: "/team/assets", label: "Asset Team", icon: Package, role: "asset_team" },
    { href: "/team/payroll", label: "Payroll Team", icon: DollarSign, role: "payroll_team" },
    { href: "/team/projects", label: "Project Team", icon: Briefcase, role: "project_team" },
    { href: "/team/onboarding", label: "Onboarding Team", icon: UserPlus, role: "onboarding_team" },
  ];

  const teamDashboardLinks = isAdmin 
    ? allTeamDashboardLinks 
    : allTeamDashboardLinks.filter(link => userAccessRoles.includes(link.role));

  const renderLinks = (links: typeof mainLinks, title: string) => (
    <div className="mb-4">
      <p className="px-3 text-xs font-semibold uppercase tracking-wider mb-2 text-[hsl(var(--sidebar-section))]">{title}</p>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = location === link.href;
        return (
           <Link 
            key={link.href} 
            href={link.href} 
            data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
            onMouseEnter={() => preloadPage(link.href)}
            onFocus={() => preloadPage(link.href)}
            onTouchStart={() => preloadPage(link.href)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive 
                ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-fg))]' 
                : 'text-[hsl(var(--sidebar-fg-muted))] hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-[hsl(var(--sidebar-fg))]'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-[hsl(var(--sidebar-active-fg))]' : 'text-[hsl(var(--sidebar-icon))]'}`} />
            {link.label}
          </Link>
        );
      })}
    </div>
  );

  const { isOpen, setIsOpen } = useSidebar();

  useEffect(() => { setIsOpen(false); }, [location]);

  return (
    <>
      {isOpen && (<div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />)}
      <aside className={`w-64 h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out border-r bg-[hsl(var(--sidebar-bg))] border-[hsl(var(--sidebar-border))] ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:z-30`}>
        <div className="p-4 border-b border-[hsl(var(--sidebar-border))] flex items-center gap-3">
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-[hsl(var(--sidebar-hover-bg))] mr-1" data-testid="button-close-sidebar">
            <X className="w-5 h-5 text-[hsl(var(--sidebar-fg-muted))]" />
          </button>
          {(() => {
            const selectedEntity = entities.find(e => e.id === selectedEntityId);
            if (selectedEntity?.logoUrl) {
              return <img src={selectedEntity.logoUrl} alt={selectedEntity.name} className="h-10 w-auto" />;
            }
            return <span className="font-bold text-xl text-[hsl(var(--sidebar-active-fg))]">Kadenc</span>;
          })()}
          <div>
            <span className="font-bold text-lg tracking-tight block text-[hsl(var(--sidebar-fg))]">People Management</span>
            <span className="text-xs text-[hsl(var(--sidebar-fg-muted))]">HR Portal</span>
          </div>
        </div>

        {entities.length > 0 && (
          <div className="px-3 py-2 border-b border-[hsl(var(--sidebar-border))]">
            <div className="relative" ref={entityDropdownRef}>
              <button
                type="button"
                onClick={() => canSwitchEntity && setEntityDropdownOpen(!entityDropdownOpen)}
                disabled={!canSwitchEntity}
                className={`w-full flex items-center justify-between bg-[hsl(var(--sidebar-hover-bg))] border border-[hsl(var(--sidebar-border))] rounded-lg px-3 py-2 text-sm font-medium text-[hsl(var(--sidebar-fg))] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${canSwitchEntity ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                data-testid="select-entity-filter"
              >
                <span className="truncate">
                  {selectedEntityIds.length === 0 ? 'All Entities' :
                   selectedEntityIds.length === 1 ? entities.find(e => e.id === selectedEntityIds[0])?.name || 'Entity' :
                   `${selectedEntityIds.length} Entities`}
                </span>
                <ChevronDown className={`w-4 h-4 text-[hsl(var(--sidebar-fg-muted))] transition-transform ${entityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {entityDropdownOpen && canSwitchEntity && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
                  <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-700 border-b border-slate-100">
                    <input
                      type="checkbox"
                      checked={selectedEntityIds.length === 0}
                      onChange={() => setSelectedEntityIds([])}
                      className="rounded border-slate-300 text-primary focus:ring-primary/30"
                    />
                    All Entities
                  </label>
                  {entities.map(entity => (
                    <label key={entity.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedEntityIds.includes(entity.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEntityIds([...selectedEntityIds, entity.id]);
                          } else {
                            const next = selectedEntityIds.filter(id => id !== entity.id);
                            setSelectedEntityIds(next);
                          }
                        }}
                        className="rounded border-slate-300 text-primary focus:ring-primary/30"
                      />
                      {entity.name} ({entity.code})
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 py-3 px-3 overflow-y-auto">
          {mainLinks.length > 0 && renderLinks(mainLinks, "Main")}
          {hrDatabaseLinks.length > 0 && renderLinks(hrDatabaseLinks, "Employee Self Service")}
          {timeLinks.length > 0 && renderLinks(timeLinks, "Time & Attendance")}
          {financeLinks.length > 0 && renderLinks(financeLinks, "Finance")}
          {assetLinks.length > 0 && renderLinks(assetLinks, "Asset Management")}
          {adminLinks.length > 0 && renderLinks(adminLinks, "Administration")}
          {teamDashboardLinks.length > 0 && renderLinks(teamDashboardLinks, "Team Dashboards")}
          {reportsLinks.length > 0 && renderLinks(reportsLinks, "Reports")}
        </div>

        <div className="p-3 border-t border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-footer-bg))]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 overflow-hidden flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-[hsl(var(--sidebar-fg))]">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs truncate text-[hsl(var(--sidebar-fg-muted))]">{user?.email}</p>
              {currentEmployee && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {userAccessRoles.map((role, idx) => (
                    <span key={idx} className="inline-block px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full capitalize">
                      {role.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => logout()}
              data-testid="button-logout"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
            <ThemeSwitcher />
          </div>
        </div>
      </aside>
    </>
  );
}