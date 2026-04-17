import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useEntity } from "@/lib/entityContext";
import { setEssLayoutStored, getEssLayoutOptions } from "@/lib/themeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format, parseISO, differenceInMinutes } from "date-fns";
import {
  Calendar, Clock, FileText, TrendingUp, Wallet, Plane, Gift, ChevronRight,
  Bell, Search, CheckCircle2, AlertCircle, Award, Users,
  LogIn, LogOut, Coffee, LayoutGrid, List,
} from "lucide-react";
import type {
  Employee, Payroll, LeaveBalance, LeaveType, Holiday, LeaveRequest,
} from "@shared/schema";

interface AttendanceRow {
  id: number;
  employeeId: number;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status?: string | null;
}

function safeParse(d: string) {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    return dt;
  } catch {
    return null;
  }
}

export default function EmployeeSelfServiceBento() {
  const { user } = useAuth();
  const { entities } = useEntity();
  const layoutOptions = getEssLayoutOptions();

  const { data: employees } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const me = employees?.find(e => e.email?.toLowerCase() === user?.email?.toLowerCase());
  const entity = me?.entityId ? entities.find(e => e.id === me.entityId) : null;

  const { data: attendance } = useQuery<AttendanceRow[]>({ queryKey: ["/api/attendance"] });
  const { data: payrolls } = useQuery<Payroll[]>({
    queryKey: ["/api/payroll", "employee", me?.id],
    enabled: !!me?.id,
  });
  const { data: leaveBalances } = useQuery<LeaveBalance[]>({
    queryKey: ["/api/leave-balances", me?.id],
    enabled: !!me?.id,
  });
  const { data: leaveTypes } = useQuery<LeaveType[]>({ queryKey: ["/api/leave-types"] });
  const { data: leaveRequests } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leaves", "employee", me?.id],
    enabled: !!me?.id,
  });
  const { data: holidays } = useQuery<Holiday[]>({ queryKey: ["/api/holidays"] });

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const myMonthAtt = useMemo(() => {
    if (!attendance || !me) return [];
    const cutoff = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
    return attendance.filter(a => a.employeeId === me.id && a.date >= cutoff);
  }, [attendance, me]);

  const todayAtt = myMonthAtt.find(a => a.date === todayStr);

  const checkInDate = todayAtt?.checkIn ? safeParse(todayAtt.checkIn) : null;
  const checkOutDate = todayAtt?.checkOut ? safeParse(todayAtt.checkOut) : null;
  const checkInLabel = checkInDate ? format(checkInDate, "HH:mm") : "--:--";
  const checkOutLabel = checkOutDate ? format(checkOutDate, "HH:mm") : null;

  const workedMins = (() => {
    if (!checkInDate) return 0;
    const end = checkOutDate ?? new Date();
    return Math.max(0, differenceInMinutes(end, checkInDate));
  })();
  const workedH = Math.floor(workedMins / 60);
  const workedM = workedMins % 60;

  const monthStats = useMemo(() => {
    let present = 0, late = 0, wfh = 0;
    for (const a of myMonthAtt) {
      const s = (a.status || "").toLowerCase();
      if (s.includes("present") || s === "p") present++;
      if (s.includes("late")) late++;
      if (s.includes("wfh") || s.includes("remote")) wfh++;
    }
    return { present, late, wfh };
  }, [myMonthAtt]);

  const leaveSummary = useMemo(() => {
    if (!leaveBalances || !leaveTypes) return { used: 0, total: 0, remaining: 0 };
    let used = 0, total = 0;
    for (const b of leaveBalances) {
      total += Number(b.totalDays || 0);
      used += Number(b.usedDays || 0);
    }
    return { used, total, remaining: total - used };
  }, [leaveBalances, leaveTypes]);

  const latestPayslip = payrolls && payrolls.length > 0
    ? [...payrolls].sort((a, b) => (b.month || "").localeCompare(a.month || ""))[0]
    : null;

  const nextHoliday = useMemo(() => {
    if (!holidays) return null;
    return [...holidays]
      .filter(h => h.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  }, [holidays, todayStr]);

  const pendingApprovals = useMemo(() => {
    const items: { icon: "alert" | "check"; text: string }[] = [];
    const pl = (leaveRequests || []).filter(l => (l.status || "").toLowerCase() === "pending");
    if (pl.length > 0) items.push({ icon: "alert", text: `${pl.length} leave request${pl.length > 1 ? "s" : ""} pending approval` });
    if (!checkInDate) items.push({ icon: "alert", text: "You haven't clocked in today" });
    if (checkInDate && !checkOutDate) items.push({ icon: "check", text: "Clocked in — remember to clock out" });
    return items.slice(0, 3);
  }, [leaveRequests, checkInDate, checkOutDate]);

  const firstName = me?.name?.split(" ")[0] || (user?.firstName ?? "there");
  const orgName = entity?.name || "FCT Energy";

  const heatMap = new Map<string, string>();
  for (const a of myMonthAtt) {
    const s = (a.status || "").toLowerCase();
    const cls =
      s.includes("present") || s === "p" ? "bg-emerald-500" :
      s.includes("late") ? "bg-amber-400" :
      s.includes("leave") || s.includes("absent") ? "bg-rose-400" :
      "bg-slate-200";
    heatMap.set(a.date, cls);
  }
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const heatCells = Array.from({ length: daysInMonth }, (_, i) => {
    const dStr = format(new Date(new Date().getFullYear(), new Date().getMonth(), i + 1), "yyyy-MM-dd");
    return { date: dStr, cls: heatMap.get(dStr) ?? "bg-slate-100" };
  });

  const switchTo = (id: "classic" | "bento") => setEssLayoutStored(id);

  return (
    <div className="bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 p-3 sm:p-6 rounded-2xl font-sans" data-testid="page-ess-bento">
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/25">
            {orgName.slice(0, 3).toUpperCase()}
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Good day,</div>
            <div className="text-base sm:text-lg font-bold text-slate-900" data-testid="text-greeting-name">{firstName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Search policies, docs..."
              className="pl-9 pr-4 py-2 w-56 lg:w-72 rounded-xl bg-white border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              data-testid="input-ess-search"
            />
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl bg-white border border-slate-200" data-testid="button-bell">
            <Bell className="w-4 h-4" />
          </Button>
          {layoutOptions.length > 1 && (
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              <button
                onClick={() => switchTo("classic")}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-600 hover:bg-slate-50"
                data-testid="button-layout-classic"
              >
                <List className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Classic</span>
              </button>
              <button
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-emerald-50 text-emerald-700 font-semibold"
                data-testid="button-layout-bento"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Bento</span>
              </button>
            </div>
          )}
          <Avatar className="w-9 h-9 ring-2 ring-white shadow-md">
            <AvatarImage src={me?.profileImage || undefined} />
            <AvatarFallback>{firstName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="sm:col-span-2 lg:col-span-3 lg:row-span-2 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-5 sm:p-6 text-white relative overflow-hidden shadow-xl shadow-emerald-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-10 -mb-10" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${checkInDate && !checkOutDate ? "bg-emerald-300 animate-pulse" : "bg-emerald-200/60"}`} />
              <span className="text-xs font-medium text-emerald-100">
                {checkInDate
                  ? (checkOutDate ? "Clocked out" : `Checked in · ${me?.locationPermission || "office"}`)
                  : "Not clocked in"}
              </span>
            </div>
            <div className="text-5xl sm:text-6xl font-bold tracking-tight mb-1" data-testid="text-clock">{format(new Date(), "HH:mm")}</div>
            <div className="text-sm text-emerald-100 mb-5 sm:mb-6">{format(new Date(), "EEEE, d LLLL yyyy")}</div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 sm:p-3 border border-white/10">
                <LogIn className="w-4 h-4 text-emerald-200 mb-1" />
                <div className="text-xs text-emerald-100">In</div>
                <div className="text-sm font-bold" data-testid="text-checkin">{checkInLabel}</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 sm:p-3 border border-white/10">
                <LogOut className="w-4 h-4 text-emerald-200 mb-1" />
                <div className="text-xs text-emerald-100">Out</div>
                <div className="text-sm font-bold" data-testid="text-checkout">{checkOutLabel ?? "—"}</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 sm:p-3 border border-white/10">
                <Clock className="w-4 h-4 text-emerald-200 mb-1" />
                <div className="text-xs text-emerald-100">Worked</div>
                <div className="text-sm font-bold" data-testid="text-worked">{workedH}h {workedM}m</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-semibold" onClick={() => switchTo("classic")}>
                <LogIn className="w-4 h-4 mr-1.5" /> Attendance
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl" onClick={() => switchTo("classic")}>
                <Coffee className="w-4 h-4 mr-1.5" /> Full ESS
              </Button>
            </div>
          </div>
        </div>

        <div className="sm:col-span-1 lg:col-span-2 rounded-3xl bg-white p-5 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <Plane className="w-4 h-4 text-violet-600" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Leave balance</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-end gap-1 mb-2">
            <span className="text-3xl font-bold text-slate-900" data-testid="text-leave-remaining">
              {(leaveSummary.remaining ?? 0).toFixed(1)}
            </span>
            <span className="text-sm text-slate-500 mb-1">/ {leaveSummary.total.toFixed(0)} days</span>
          </div>
          <Progress value={leaveSummary.total > 0 ? ((leaveSummary.remaining ?? 0) / leaveSummary.total) * 100 : 0} className="h-1.5" />
        </div>

        <div className="sm:col-span-1 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-sm flex flex-col justify-between min-h-[120px]">
          <Wallet className="w-5 h-5 text-amber-400" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              {latestPayslip?.month ? format(parseISO(latestPayslip.month + "-01"), "MMM") : "Last"} payslip
            </div>
            <div className="text-xl font-bold" data-testid="text-last-payslip">
              {latestPayslip?.netSalary ? `₹${(Number(latestPayslip.netSalary) / 1000).toFixed(1)}K` : "—"}
            </div>
          </div>
        </div>

        <div className="sm:col-span-1 rounded-3xl bg-gradient-to-br from-orange-400 to-pink-500 p-4 text-white shadow-sm relative overflow-hidden min-h-[120px] flex flex-col justify-between">
          <Award className="w-5 h-5" />
          <div>
            <div className="text-2xl font-bold leading-none">{monthStats.present}</div>
            <div className="text-[10px] font-medium opacity-90 mt-0.5">present this mo</div>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-3 rounded-3xl bg-white p-4 border border-slate-200/60 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick actions</div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Plane, label: "Apply leave", bg: "bg-violet-50", fg: "text-violet-600" },
              { icon: Clock, label: "Regularize", bg: "bg-blue-50", fg: "text-blue-600" },
              { icon: FileText, label: "Payslip", bg: "bg-amber-50", fg: "text-amber-600" },
              { icon: Wallet, label: "Expense", bg: "bg-rose-50", fg: "text-rose-600" },
            ].map((a) => (
              <button key={a.label} onClick={() => switchTo("classic")} className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-slate-50 transition">
                <div className={`w-9 h-9 rounded-xl ${a.bg} flex items-center justify-center`}>
                  <a.icon className={`w-4 h-4 ${a.fg}`} />
                </div>
                <span className="text-[11px] font-medium text-slate-700">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-3 lg:row-span-2 rounded-3xl bg-white p-5 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">This month</div>
              <div className="text-xs text-slate-500">{format(new Date(), "LLLL yyyy")} · {myMonthAtt.length} days tracked</div>
            </div>
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-0">
              <TrendingUp className="w-3 h-3 mr-1" />
              {myMonthAtt.length > 0 ? `${Math.round((monthStats.present / Math.max(1, myMonthAtt.length)) * 100)}%` : "—"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1 mb-5">
            {heatCells.map((c, i) => (
              <div
                key={i}
                className={`aspect-square rounded ${c.cls}`}
                style={{ flex: "0 0 calc((100% - 30 * 0.25rem) / 31)", minWidth: 8 }}
                title={c.date}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Present</div>
              <div className="text-xl font-bold text-slate-900">{monthStats.present}</div>
              <div className="text-[10px] text-emerald-600">days</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Late</div>
              <div className="text-xl font-bold text-slate-900">{monthStats.late}</div>
              <div className="text-[10px] text-amber-600">days</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">WFH</div>
              <div className="text-xl font-bold text-slate-900">{monthStats.wfh}</div>
              <div className="text-[10px] text-blue-600">days</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Leaves used</div>
              <div className="text-xl font-bold text-slate-900">{leaveSummary.used.toFixed(1)}</div>
              <div className="text-[10px] text-violet-600">days YTD</div>
            </div>
          </div>
        </div>

        <div className="sm:col-span-1 lg:col-span-2 rounded-3xl bg-white p-4 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting you</span>
            {pendingApprovals.length > 0 && <Badge className="bg-rose-100 text-rose-700 border-0 text-[10px]">{pendingApprovals.length}</Badge>}
          </div>
          <div className="space-y-2">
            {pendingApprovals.length === 0 ? (
              <div className="text-xs text-slate-400">All caught up ✓</div>
            ) : pendingApprovals.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                {p.icon === "alert"
                  ? <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                <span className="text-xs text-slate-700 truncate">{p.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sm:col-span-1 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-4 text-white shadow-sm min-h-[120px] flex flex-col justify-between">
          <Calendar className="w-5 h-5" />
          <div>
            <div className="text-[10px] uppercase tracking-wider opacity-90 font-semibold">Next holiday</div>
            <div className="text-sm font-bold leading-tight mt-0.5" data-testid="text-next-holiday">{nextHoliday?.name ?? "—"}</div>
            <div className="text-[10px] opacity-90 mt-0.5">{nextHoliday ? format(parseISO(nextHoliday.date), "d MMM") : ""}</div>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-3 rounded-3xl bg-white p-4 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">Team</span>
            </div>
            <button className="text-xs text-emerald-600 font-semibold" onClick={() => switchTo("classic")}>See team →</button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {(employees || [])
                .filter(e => e.departmentId === me?.departmentId && e.id !== me?.id)
                .slice(0, 5)
                .map((e) => (
                  <Avatar key={e.id} className="w-8 h-8 ring-2 ring-white">
                    <AvatarImage src={e.profileImage || undefined} />
                    <AvatarFallback>{e.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ))}
            </div>
            <div className="ml-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {(employees || []).filter(e => e.departmentId === me?.departmentId).length} teammates
              </span>{" "}
              in {me?.departmentId ? "your department" : "your org"}
            </div>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-3 rounded-3xl bg-gradient-to-br from-pink-100 to-rose-100 p-4 border border-pink-200/50 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
            <Gift className="w-5 h-5 text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-rose-700 font-semibold">Birthdays & anniversaries</div>
            <div className="text-sm font-bold text-slate-900 truncate">Open the chatter to send a wish</div>
          </div>
          <Button size="sm" variant="ghost" className="text-rose-700 text-xs" onClick={() => switchTo("classic")}>Open</Button>
        </div>
      </div>

      <div className="text-center mt-6 text-xs text-slate-400">
        {orgName} HRMS · Employee Self Service · Bento view
      </div>
    </div>
  );
}