// Map of route href -> dynamic import for that page's chunk.
// Used by the sidebar to start downloading a page's JS bundle on hover,
// so by the time the user actually clicks the link, the chunk is already
// cached by the browser/Vite. The lazy() import in App.tsx will then
// resolve instantly from cache instead of waiting for a network round-trip.

type Importer = () => Promise<unknown>;

const preloaders: Record<string, Importer> = {
  "/": () => import("@/pages/Dashboard"),
  "/employees": () => import("@/pages/Employees"),
  "/employees/new": () => import("@/pages/AddEmployee"),
  "/directory": () => import("@/pages/EmployeeDirectory"),
  "/documents": () => import("@/pages/DocumentManagement"),
  "/departments": () => import("@/pages/Departments"),
  "/org-tree": () => import("@/pages/OrgTree"),
  "/org-structure": () => import("@/pages/OrgStructure"),
  "/advance-loans": () => import("@/pages/AdvanceLoans"),
  "/salary-adjustments": () => import("@/pages/SalaryAdjustments"),
  "/statutory-compliance": () => import("@/pages/StatutoryCompliance"),
  "/analytics": () => import("@/pages/Analytics"),
  "/self-service": () => import("@/pages/EmployeeSelfService"),
  "/attendance": () => import("@/pages/Attendance"),
  "/leaves": () => import("@/pages/Leaves"),
  "/holidays": () => import("@/pages/Holidays"),
  "/payroll": () => import("@/pages/Payroll"),
  "/salary-structures": () => import("@/pages/SalaryStructures"),
  "/shift-management": () => import("@/pages/ShiftManagement"),
  "/tax-review": () => import("@/pages/TaxReview"),
  "/expenses": () => import("@/pages/Expenses"),
  "/assets": () => import("@/pages/Assets"),
  "/onboarding": () => import("@/pages/Onboarding"),
  "/exit": () => import("@/pages/ExitManagement"),
  "/announcements": () => import("@/pages/Announcements"),
  "/company-policies": () => import("@/pages/CompanyPolicies"),
  "/reports": () => import("@/pages/Reports"),
  "/integrations": () => import("@/pages/Integrations"),
  "/entity-management": () => import("@/pages/EntityManagement"),
  "/projects": () => import("@/pages/Projects"),
  "/team/assets": () => import("@/pages/TeamAssets"),
  "/team/payroll": () => import("@/pages/TeamPayroll"),
  "/team/projects": () => import("@/pages/TeamProjects"),
  "/team/onboarding": () => import("@/pages/TeamOnboarding"),
};

const triggered = new Set<string>();

export function preloadPage(href: string): void {
  if (triggered.has(href)) return;
  const fn = preloaders[href];
  if (!fn) return;
  triggered.add(href);
  // Fire-and-forget; swallow errors so a failed preload never breaks the UI.
  fn().catch(() => triggered.delete(href));
}
