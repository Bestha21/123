import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Search, UserCheck, Clock } from "lucide-react";
import type { Employee } from "@shared/schema";

type ProfileChangeRequest = {
  id: number;
  employeeId: number;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  status: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  remarks: string | null;
  createdAt: string | null;
};

function StatusBadge({ status }: { status: string | null }) {
  if (status === "approved")
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge>;
  if (status === "rejected")
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>;
}

export default function ProfileChangeRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pending");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");

  const { data: requests = [], isLoading } = useQuery<ProfileChangeRequest[]>({
    queryKey: ["/api/profile-change-requests"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees", "all"],
    queryFn: async () => {
      const res = await fetch("/api/employees", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const empMap = new Map<number, Employee>();
  employees.forEach((e) => empMap.set(e.id, e));

  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      remarks,
    }: {
      id: number;
      action: "approve" | "reject";
      remarks?: string;
    }) => {
      return apiRequest("PATCH", `/api/profile-change-requests/${id}`, {
        action,
        remarks: remarks || null,
        reviewedBy: user?.email || null,
      });
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile-change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title:
          vars.action === "approve"
            ? "Request approved & employee record updated"
            : "Request rejected",
      });
      setRejectingId(null);
      setRejectRemarks("");
    },
    onError: (err: any) => {
      toast({
        title: "Action failed",
        description: err?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const filterByTab = (list: ProfileChangeRequest[]) => {
    if (tab === "all") return list;
    return list.filter((r) => (r.status || "pending") === tab);
  };

  const filterBySearch = (list: ProfileChangeRequest[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((r) => {
      const emp = empMap.get(r.employeeId);
      const name = `${emp?.firstName || ""} ${emp?.lastName || ""}`.toLowerCase();
      const code = (emp?.employeeCode || "").toLowerCase();
      const field = (r.fieldName || "").toLowerCase();
      return name.includes(q) || code.includes(q) || field.includes(q);
    });
  };

  const visible = filterBySearch(filterByTab(requests)).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  const pendingCount = requests.filter((r) => (r.status || "pending") === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="space-y-6" data-testid="page-profile-change-requests">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profile Change Requests</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and approve personal-detail updates submitted by employees.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code or field"
            className="pl-9 w-64"
            data-testid="input-search-profile-changes"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600" data-testid="stat-pending">
                {pendingCount}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Approved</p>
              <p className="text-2xl font-bold text-green-600" data-testid="stat-approved">
                {approvedCount}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600" data-testid="stat-rejected">
                {rejectedCount}
              </p>
            </div>
            <X className="w-8 h-8 text-red-500" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="pending" data-testid="tab-pending">
                Pending ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="approved" data-testid="tab-approved">
                Approved ({approvedCount})
              </TabsTrigger>
              <TabsTrigger value="rejected" data-testid="tab-rejected">
                Rejected ({rejectedCount})
              </TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all">
                All ({requests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="mt-4">
              {isLoading ? (
                <p className="text-sm text-slate-500 text-center py-10">Loading…</p>
              ) : visible.length === 0 ? (
                <p
                  className="text-sm text-slate-500 text-center py-10"
                  data-testid="text-empty-state"
                >
                  No {tab !== "all" ? tab : ""} requests found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Old Value</TableHead>
                        <TableHead>New Value</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visible.map((r) => {
                        const emp = empMap.get(r.employeeId);
                        const isPending = (r.status || "pending") === "pending";
                        return (
                          <TableRow key={r.id} data-testid={`row-pcr-${r.id}`}>
                            <TableCell>
                              <div className="font-medium text-slate-900">
                                {emp ? `${emp.firstName} ${emp.lastName || ""}` : `#${r.employeeId}`}
                              </div>
                              <div className="text-xs text-slate-500">
                                {emp?.employeeCode || ""}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{r.fieldName}</TableCell>
                            <TableCell className="text-slate-500 max-w-[200px] truncate">
                              {r.oldValue || <span className="italic text-slate-400">empty</span>}
                            </TableCell>
                            <TableCell className="font-medium text-slate-900 max-w-[200px] truncate">
                              {r.newValue || <span className="italic text-slate-400">empty</span>}
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {r.createdAt
                                ? new Date(r.createdAt).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={r.status} />
                              {r.remarks && (
                                <div
                                  className="text-xs text-slate-500 mt-1 max-w-[180px] truncate"
                                  title={r.remarks}
                                >
                                  {r.remarks}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isPending ? (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      reviewMutation.mutate({ id: r.id, action: "approve" })
                                    }
                                    disabled={reviewMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                    data-testid={`button-approve-${r.id}`}
                                  >
                                    <Check className="w-4 h-4 mr-1" /> Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setRejectingId(r.id);
                                      setRejectRemarks("");
                                    }}
                                    disabled={reviewMutation.isPending}
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                    data-testid={`button-reject-${r.id}`}
                                  >
                                    <X className="w-4 h-4 mr-1" /> Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  {r.reviewedBy ? `by ${r.reviewedBy}` : ""}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={rejectingId !== null} onOpenChange={(o) => !o && setRejectingId(null)}>
        <DialogContent data-testid="dialog-reject">
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="reject-remarks">Reason (optional)</Label>
            <Textarea
              id="reject-remarks"
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              placeholder="Tell the employee why this change can't be approved…"
              rows={3}
              data-testid="textarea-reject-remarks"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                rejectingId &&
                reviewMutation.mutate({
                  id: rejectingId,
                  action: "reject",
                  remarks: rejectRemarks,
                })
              }
              disabled={reviewMutation.isPending}
              data-testid="button-confirm-reject"
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
