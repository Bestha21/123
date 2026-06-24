import { useParams, Link, useLocation } from "wouter";
import { useDepartments, useEmployees, useAllEmployees } from "@/hooks/use-employees";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, Building2, MapPin, Calendar, User, Briefcase, GraduationCap, CreditCard, Shield, FileText, Clock, Hash, Users, UserCheck, Edit, LogIn } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

function formatCurrency(val) {
  const num = Number(val) || 0;
  return num.toLocaleString("en-IN");
}

export default function EmployeeDetails() {
  const params = useParams();
  const employeeId = Number(params.id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees, isLoading: employeesLoading } = useEmployees();
  const { data: allEmployees } = useAllEmployees();
  const { data: departments } = useDepartments();
  const { data: shiftsData } = useQuery({ queryKey: ["/api/shifts"] });

  const anyUser = user;
  const userRoles = (anyUser?.accessRole || "employee").split(",").map((r) => r.trim().toLowerCase());
  const isAdmin = userRoles.includes("admin");

  const impersonateMutation = useMutation({
    mutationFn: async (empId) => {
      const res = await fetch("/api/admin/impersonate/" + empId, { method: "POST", credentials: "include" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to impersonate"); }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Viewing as employee", description: data.message });
      setTimeout(() => { window.location.href = "/self-service"; }, 500);
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const employee = employees?.find(e => e.id === employeeId);
  const getShiftName = (shiftId) => {
    if (!shiftId || !shiftsData) return null;
    const shift = shiftsData.find(s => s.id === shiftId);
    return shift ? shift.name + " (" + shift.startTime + " - " + shift.endTime + ")" : null;
  };

  if (employeesLoading) return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground">Loading employee details...</div></div>;
  if (!employee) return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Employee not found</div></div>;

  const getDepartmentName = (departmentId) => {
    if (!departmentId || !departments) return "—";
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || "—";
  };

  const getReportingManagerName = (managerId) => {
    if (!managerId || !allEmployees) return null;
    const manager = allEmployees.find(e => e.id === managerId);
    return manager ? (manager.firstName + " " + (manager.lastName || "")).trim() : null;
  };

  const formatDate = (date) => {
    if (!date) return null;
    try { return format(new Date(date), "dd MMM yyyy"); } catch { return date; }
  };

  const getEmployeeDisplayName = () => {
    const parts = [employee.firstName];
    if (employee.middleName) parts.push(employee.middleName);
    if (employee.lastName) parts.push(employee.lastName);
    return parts.join(" ");
  };

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="w-40 shrink-0"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p></div>
      <div className="flex items-center gap-1.5 flex-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
        <p className="font-medium text-foreground">{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees"><Button variant="ghost" size="sm" data-testid="button-back"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
        <div className="flex-1" />
        {isAdmin && employee && (
          <Button variant="outline" size="sm" onClick={() => impersonateMutation.mutate(employeeId)} disabled={impersonateMutation.isPending} className="border-orange-300 text-orange-600 hover:bg-orange-50">
            <LogIn className="w-4 h-4 mr-2" />
            {impersonateMutation.isPending ? "Switching..." : "Login as User"}
          </Button>
        )}
        <Button onClick={() => setLocation("/employees/" + employeeId + "/edit")} data-testid="button-edit-employee"><Edit className="w-4 h-4 mr-2" />Edit Employee</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start gap-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                {employee.firstName[0]}{(employee.lastName || employee.firstName)[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{getEmployeeDisplayName()}</h1>
                <Badge variant={employee.status === "active" ? "default" : "secondary"}>{employee.status}</Badge>
                {employee.employmentStatus && (
                  <Badge variant="outline" className={employee.employmentStatus === "confirmed" ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400" : employee.employmentStatus === "probation" ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400" : ""}>
                    {employee.employmentStatus}
                  </Badge>
                )}
              </div>
              <p className="text-lg text-muted-foreground mb-3">{employee.designation || "Employee"}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {employee.employeeCode && <div className="flex items-center gap-1.5"><Hash className="w-4 h-4" /><span className="font-medium">{employee.employeeCode}</span></div>}
                <div className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /><span>{getDepartmentName(employee.departmentId)}</span></div>
                {employee.location && <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /><span>{employee.location}</span></div>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {employee.email && <Button variant="outline" size="sm" asChild><a href={"mailto:" + employee.email}><Mail className="w-4 h-4 mr-2" />Email</a></Button>}
              {employee.phone && <Button variant="outline" size="sm" asChild><a href={"tel:" + employee.phone}><Phone className="w-4 h-4 mr-2" />Call</a></Button>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal" data-testid="tab-personal">Personal</TabsTrigger>
          <TabsTrigger value="employment" data-testid="tab-employment">Employment</TabsTrigger>
          <TabsTrigger value="education" data-testid="tab-education">Education</TabsTrigger>
          <TabsTrigger value="bank" data-testid="tab-bank">Bank & IDs</TabsTrigger>
          <TabsTrigger value="emergency" data-testid="tab-emergency">Emergency</TabsTrigger>
        </TabsList>
        <TabsContent value="personal">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" />Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="First Name" value={employee.firstName} /><InfoRow label="Middle Name" value={employee.middleName} /><InfoRow label="Last Name" value={employee.lastName} />
                <InfoRow label="Email" value={employee.email} icon={Mail} /><InfoRow label="Personal Email" value={employee.personalEmail} icon={Mail} />
                <InfoRow label="Phone" value={employee.phone} icon={Phone} /><InfoRow label="Alternate Contact" value={employee.alternateContactNumber} icon={Phone} />
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" />Personal Details</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Date of Birth" value={formatDate(employee.dateOfBirth)} icon={Calendar} /><InfoRow label="Actual Date of Birth" value={formatDate(employee.actualDateOfBirth)} icon={Calendar} />
                <InfoRow label="Gender" value={employee.gender} /><InfoRow label="Blood Group" value={employee.bloodGroup} /><InfoRow label="Marital Status" value={employee.maritalStatus} />
                <InfoRow label="Spouse Name" value={employee.spouseName} /><InfoRow label="Father Name" value={employee.fatherName} /><InfoRow label="Mother Name" value={employee.motherName} />
              </CardContent>
            </Card>
            <Card className="md:col-span-2"><CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" />Address Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1"><h4 className="font-medium text-sm text-muted-foreground mb-2">Current Address</h4>
                    <InfoRow label="Address" value={employee.address} /><InfoRow label="City" value={employee.city} /><InfoRow label="State" value={employee.state} /><InfoRow label="Country" value={employee.country} /><InfoRow label="Pincode" value={employee.pincode} />
                  </div>
                  <div className="space-y-1"><h4 className="font-medium text-sm text-muted-foreground mb-2">Permanent Address</h4><InfoRow label="Permanent Address" value={employee.permanentAddress} /></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="employment">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Briefcase className="w-4 h-4" />Position Details</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Employee Code" value={employee.employeeCode} icon={Hash} /><InfoRow label="Designation" value={employee.designation} icon={Briefcase} />
                <InfoRow label="Department" value={getDepartmentName(employee.departmentId)} icon={Building2} /><InfoRow label="Location" value={employee.location} icon={MapPin} />
                <InfoRow label="Employment Type" value={employee.employmentType} /><InfoRow label="Shift" value={getShiftName(employee.shiftId)} icon={Clock} />
                <InfoRow label="Location Permission" value={employee.locationPermission ? employee.locationPermission.charAt(0).toUpperCase() + employee.locationPermission.slice(1) : "Office"} icon={MapPin} />
                <InfoRow label="Attendance Exempt" value={employee.attendanceExempt ? "Yes" : "No"} icon={Shield} /><InfoRow label="Position Type" value={employee.positionType} />
                <InfoRow label="Replaced Employee" value={employee.replacedEmployeeName} /><InfoRow label="Access Role" value={employee.accessRole?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Employee"} />
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" />Reporting Structure</CardTitle></CardHeader>
              <CardContent className="space-y-1"><InfoRow label="Reporting Manager" value={getReportingManagerName(employee.reportingManagerId)} icon={User} /><InfoRow label="HOD" value={getReportingManagerName(employee.hodId)} icon={UserCheck} /></CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" />Employment Dates</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Join Date" value={formatDate(employee.joinDate)} icon={Calendar} /><InfoRow label="Confirmation Date" value={formatDate(employee.confirmationDate)} icon={Calendar} />
                <InfoRow label="Probation End Date" value={formatDate(employee.probationEndDate)} icon={Calendar} /><InfoRow label="Employment Status" value={employee.employmentStatus} icon={Clock} />
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" />Verification & Source</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="BGV Status" value={employee.bgvStatus} /><InfoRow label="Sourcing Channel" value={employee.sourcingChannel} /><InfoRow label="Sourcing Name" value={employee.sourcingName} />
                <InfoRow label="CTC" value={employee.ctc ? "Rs. " + formatCurrency(employee.ctc) : undefined} /><InfoRow label="Birthday Allowance" value={employee.birthdayAllowance ? "Rs. " + formatCurrency(employee.birthdayAllowance) : undefined} />
                <InfoRow label="Variable Pay (Monthly)" value={employee.variablePay ? "Rs. " + formatCurrency(employee.variablePay) : undefined} /><InfoRow label="Retention Bonus" value={employee.retentionBonus ? "Rs. " + formatCurrency(employee.retentionBonus) : undefined} />
                <InfoRow label="Retention Bonus Duration" value={employee.retentionBonusDuration} /><InfoRow label="Retention Bonus Start" value={employee.retentionBonusStartDate} />
                <InfoRow label="Notice Buyout" value={employee.noticeBuyout ? "Rs. " + formatCurrency(employee.noticeBuyout) : undefined} /><InfoRow label="Notice Buyout Type" value={employee.noticeBuyoutDuration} />
                <InfoRow label="No. of Payments" value={employee.noticeBuyoutPayments?.toString()} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="education">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><GraduationCap className="w-4 h-4" />Highest Qualification</CardTitle></CardHeader>
              <CardContent className="space-y-1"><InfoRow label="Qualification" value={employee.highestQualification} /><InfoRow label="Specialization" value={employee.specialization} /><InfoRow label="Institute Name" value={employee.instituteName} /></CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><GraduationCap className="w-4 h-4" />Second Qualification</CardTitle></CardHeader>
              <CardContent className="space-y-1"><InfoRow label="Qualification" value={employee.secondHighestQualification} /><InfoRow label="Specialization" value={employee.secondSpecialization} /><InfoRow label="Institute Name" value={employee.secondInstituteName} /></CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="bank">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-4 h-4" />Bank Details</CardTitle></CardHeader>
              <CardContent className="space-y-1"><InfoRow label="Bank Name" value={employee.bankName} /><InfoRow label="Branch Name" value={employee.branchName} /><InfoRow label="Account Number" value={employee.bankAccountNumber} /><InfoRow label="IFSC Code" value={employee.ifscCode} /></CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" />Identity Documents</CardTitle></CardHeader>
              <CardContent className="space-y-1"><InfoRow label="PAN Number" value={employee.panNumber} /><InfoRow label="Aadhar Number" value={employee.aadharNumber} /></CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" />Statutory Details</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="PF Status" value={employee.pfStatus} /><InfoRow label="PF Number" value={employee.pfNumber} /><InfoRow label="UAN Number" value={employee.uanNumber} /><InfoRow label="ESI Number" value={employee.esiNumber} />
                <InfoRow label="Tax Regime" value={employee.taxRegime === "old_regime" ? "Old Regime" : employee.taxRegime === "new_regime" ? "New Regime" : null} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="emergency">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Phone className="w-4 h-4" />Emergency Contact 1</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Name" value={employee.emergencyContact1Name || employee.emergencyContactName} />
                <InfoRow label="Phone" value={employee.emergencyContact1Phone || employee.emergencyContactPhone} icon={Phone} />
                <InfoRow label="Relation" value={employee.emergencyContact1Relation || employee.emergencyContactRelation} />
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Phone className="w-4 h-4" />Emergency Contact 2</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Name" value={employee.emergencyContact2Name} /><InfoRow label="Phone" value={employee.emergencyContact2Phone} icon={Phone} /><InfoRow label="Relation" value={employee.emergencyContact2Relation} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
