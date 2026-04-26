import { useQuery, useMutation } from "@tanstack/react-query";
import { useEntity } from "@/lib/entityContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Building2, Users, ChevronRight } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Department, Employee } from "@shared/schema";
import { useState } from "react";

const departmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

export default function Departments() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { entityFilterParam, selectedEntityIds } = useEntity();

  const { data: departments, isLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments", selectedEntityIds],
    queryFn: async () => {
      const res = await fetch(`/api/departments${entityFilterParam ? `?${entityFilterParam}` : ''}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees", selectedEntityIds],
    queryFn: async () => {
      const res = await fetch(`/api/employees${entityFilterParam ? `?${entityFilterParam}` : ''}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: DepartmentFormData) => 
      apiRequest("POST", "/api/departments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Department created successfully" });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create department", variant: "destructive" });
    },
  });

    const getEmployeeCount = (deptId: number) => {
    return employees?.filter(e => e.departmentId === deptId).length || 0;
  };

  // Designation seniority ranking — lower number = more senior.
    const designationRank = (designation?: string | null): number => {
    const d = (designation || "").toLowerCase();
    if (!d) return 99;
    // Demote "Assistant to the …" / "EA" / "Secretary to" first so they
    // never get mistaken for the senior role they support.
    if (/(assistant to|asst\.?\s*to|secretary to|^ea\b|^ea\/|executive assistant)/.test(d)) return 10;
    // Tier 1: MD / CEO / Chairman / Founder — the very top
    if (/(md\s*&|\bmd\b|managing director|\bceo\b|chief executive|chief operating|chief financial|chairman|founder|president(?!.*vice))/.test(d)) return 1;
    // Tier 2: VP / Director / Head / AVP / Senior Management / other Chiefs
    if (/(vice president|^vp\b|\bvp\b|avp|director|^head\b|head[-\s]|chief|senior management)/.test(d)) return 2;
    if (/(deputy general manager|dgm|general manager|\bgm\b|agm)/.test(d)) return 3;
    if (/(senior manager|sr\.?\s*manager|sr manager)/.test(d)) return 4;
    if (/(assistant manager|asst\.?\s*manager|deputy manager)/.test(d)) return 6;
    if (/manager/.test(d)) return 5;
    if (/(tech lead|team lead|\blead\b)/.test(d)) return 7;
    if (/(senior|sr\.?\s)/.test(d)) return 8;
    if (/(engineer|analyst|developer|coordinator|administrator|architect|specialist)/.test(d)) return 9;
    if (/(executive|associate|officer|recruiter)/.test(d)) return 10;
    if (/(trainee|intern|apprentice)/.test(d)) return 11;
    return 12;
  };
    const topExecOrder = (designation?: string | null): number => {
    const d = (designation || "").toLowerCase();
    if (/md\s*&\s*ceo/.test(d)) return 0;
    if (/managing director.*ceo|ceo.*managing director/.test(d)) return 0;
    if (/\bceo\b|chief executive/.test(d)) return 1;
    if (/managing director|\bmd\b/.test(d)) return 2;
    if (/chairman/.test(d)) return 3;
    if (/founder/.test(d)) return 4;
    if (/president/.test(d)) return 5;
    if (/chief operating|\bcoo\b/.test(d)) return 6;
    if (/chief financial|\bcfo\b/.test(d)) return 7;
    return 99;
  };

    const sortByDesignation = (list: Employee[]) => {
    return [...list].sort((a, b) => {
      const ra = designationRank(a.designation);
      const rb = designationRank(b.designation);
      if (ra !== rb) return ra - rb;
      // Tier 1 (top execs): MD & CEO first, then CEO, MD, Chairman, …
      if (ra === 1) {
        const oa = topExecOrder(a.designation);
        const ob = topExecOrder(b.designation);
        if (oa !== ob) return oa - ob;
      }
      const da = (a.designation || "").localeCompare(b.designation || "");
      if (da !== 0) return da;
      const na = `${a.firstName || ''} ${a.lastName || ''}`.trim();
      const nb = `${b.firstName || ''} ${b.lastName || ''}`.trim();
      return na.localeCompare(nb);
    });
  };

  const getDeptEmployees = (deptId: number) => {
    const list = employees?.filter(e => e.departmentId === deptId) || [];
    return sortByDesignation(list);
  };

  const leadershipEmployees = sortByDesignation(
    (employees || []).filter(e => designationRank(e.designation) <= 2)
  );

  const colors = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-emerald-500 to-emerald-600",
    "from-orange-500 to-orange-600",
    "from-pink-500 to-pink-600",
    "from-cyan-500 to-cyan-600",
    "from-amber-500 to-amber-600",
    "from-indigo-500 to-indigo-600",
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="text-slate-500">Manage organizational structure</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-department">
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Department</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Engineering" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description of the department..." {...field} data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-department">
                  {createMutation.isPending ? "Creating..." : "Create Department"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Departments</p>
                <p className="text-2xl font-bold text-slate-800">{departments?.length || 0}</p>
              </div>
              <Building2 className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Employees</p>
                <p className="text-2xl font-bold text-slate-800">{employees?.length || 0}</p>
              </div>
              <Users className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>
		      {leadershipEmployees.length > 0 && (
        <Card data-testid="department-card-leadership" className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-600" />
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Leadership</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Senior management & decision makers
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-600">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{leadershipEmployees.length} members</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {leadershipEmployees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 py-2 px-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                    {emp.firstName?.[0]}{(emp.lastName || emp.firstName)?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {emp.firstName} {emp.lastName || ''}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{emp.designation}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments?.map((dept, index) => {
          const deptEmployees = getDeptEmployees(dept.id);
          const colorClass = colors[index % colors.length];
          return (
            <Card key={dept.id} data-testid={`department-card-${dept.id}`} className="overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${colorClass}`} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                    {dept.description && (
                      <p className="text-sm text-slate-500 mt-1">{dept.description}</p>
                    )}
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center text-white`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">{getEmployeeCount(dept.id)} employees</span>
                  </div>
                </div>
                
                {deptEmployees.length > 0 ? (
                  <div className="space-y-2">
                    {deptEmployees.slice(0, 4).map((emp) => (
                      <div key={emp.id} className="flex items-center gap-3 py-2 px-3 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {emp.firstName?.[0]}{(emp.lastName || emp.firstName)?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {emp.firstName} {emp.lastName || ''}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{emp.designation}</p>
                        </div>
                      </div>
                    ))}
                    {deptEmployees.length > 4 && (
                      <button className="w-full flex items-center justify-center gap-1 py-2 text-sm text-primary hover:underline">
                        View all {deptEmployees.length} members
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">No employees in this department</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!departments?.length && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No departments yet</p>
              <p className="text-sm">Create your first department to get started</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
