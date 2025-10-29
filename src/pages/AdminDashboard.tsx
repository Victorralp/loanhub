import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../hooks/use-toast";
import SearchFilter from "../components/SearchFilter";
import LoanDetailsDialog from "../components/LoanDetailsDialog";
import EmployeeLoanHistory from "../components/EmployeeLoanHistory";
import GlobalInterestRateSettings from "../components/GlobalInterestRateSettings";
import { Admin, Company, Employee, Loan } from "../types";
import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  Landmark,
  CheckCircle,
  XCircle,
  Settings,
  Edit3,
  Save,
  X,
  RefreshCw,
} from "lucide-react";
import { generateCompanyCode } from "../utils/company-utils";
import { generateEmployeeId } from "../utils/employee-utils";

const AdminDashboard = () => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState<Employee | null>(null);
  const [globalRateSettingsOpen, setGlobalRateSettingsOpen] = useState(false);
  const [editingBalance, setEditingBalance] = useState<string | null>(null);
  const [tempBalance, setTempBalance] = useState<string>("");

  const [companySearch, setCompanySearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [loanSearch, setLoanSearch] = useState("");
  const [loanStatusFilter, setLoanStatusFilter] = useState("all");
  const [generatingCompanyCodeId, setGeneratingCompanyCodeId] = useState<string | null>(null);
  const [generatingEmployeeId, setGeneratingEmployeeId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Track component lifecycle
  useEffect(() => {
    console.log("AdminDashboard: Component mounted");
    return () => {
      console.log("AdminDashboard: Component unmounting");
    };
  }, []);

  // Monitor auth state changes to detect unexpected logouts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log("AdminDashboard: Auth state changed - user logged out");
        // Don't navigate here, let ProtectedRoute handle it
      } else {
        console.log("AdminDashboard: Auth state changed - user still logged in:", user.uid);
        
        // Try to refresh the token to prevent expiration
        try {
          await user.getIdToken(true); // Force refresh
          console.log("AdminDashboard: Token refreshed successfully");
        } catch (error) {
          console.error("AdminDashboard: Token refresh failed:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Since ProtectedRoute already handles auth and admin verification,
    // we just need to load the admin data and dashboard content
    const loadDashboard = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.log("AdminDashboard: No current user, redirecting to login");
          navigate("/admin/login");
          return;
        }

        console.log("AdminDashboard: Loading admin data for user:", user.uid);
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        
        if (!adminDoc.exists()) {
          console.log("AdminDashboard: Admin document not found");
          navigate("/admin/login");
          return;
        }

        console.log("AdminDashboard: Setting admin data and loading all data");
        setAdmin({ id: adminDoc.id, ...(adminDoc.data() as Admin) });
        await loadAllData();
        console.log("AdminDashboard: All data loaded successfully");
      } catch (error: any) {
        console.error("AdminDashboard: Failed to load admin dashboard:", error);
        console.error("AdminDashboard: Error details:", error.message, error.code);
        toast({
          title: "Error",
          description: "Unable to load admin dashboard. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    console.log("AdminDashboard: useEffect triggered - loading dashboard");
    loadDashboard();
  }, [navigate, toast]);

  const loadCompanies = async () => {
    const snapshot = await getDocs(collection(db, "companies"));
    const companyList = snapshot.docs.map((companyDoc) => {
      const data = companyDoc.data() as Company;
      const { id: _, ...dataWithoutId } = data;
      return {
        id: companyDoc.id,
        ...dataWithoutId,
      };
    });
    console.log("Loaded companies:", companyList);
    setCompanies(companyList);
    return companyList;
  };

  // Migration function to set status for existing companies
  const migrateCompanyStatus = async () => {
    try {
      console.log("AdminDashboard: Starting company migration");
      const snapshot = await getDocs(collection(db, "companies"));
      console.log("AdminDashboard: Found", snapshot.docs.length, "companies");
      
      const migrationPromises = snapshot.docs.map(async (companyDoc) => {
        const data = companyDoc.data();
        // If company doesn't have status field, set it to "pending"
        if (!data.status) {
          console.log("AdminDashboard: Migrating company:", companyDoc.id, "to pending status");
          await updateDoc(doc(db, "companies", companyDoc.id), {
            status: "pending",
          });
        }
      });
      await Promise.all(migrationPromises);
      console.log("AdminDashboard: Company status migration completed");
    } catch (error) {
      console.error("AdminDashboard: Error migrating company status:", error);
      throw error; // Re-throw to be caught by loadAllData
    }
  };

  const loadEmployees = async () => {
    const snapshot = await getDocs(collection(db, "employees"));
    const employeeList = snapshot.docs.map((employeeDoc) => {
      const data = employeeDoc.data() as Employee;
      const { id: _, ...dataWithoutId } = data;
      return {
        id: employeeDoc.id,
        ...dataWithoutId,
      };
    });
    setEmployees(employeeList);
    return employeeList;
  };

  const loadLoans = async (companyList?: Company[], employeeList?: Employee[]) => {
    console.log("AdminDashboard: Loading loans from database");
    const snapshot = await getDocs(collection(db, "loans"));
    console.log("AdminDashboard: Found", snapshot.docs.length, "total loans in database");
    
    const companiesSource = companyList ?? companies;
    const employeesSource = employeeList ?? employees;

    const companyMap = new Map(companiesSource.map((company) => [company.id, company]));
    const employeeMap = new Map(employeesSource.map((employee) => [employee.id, employee]));

    const loanList = snapshot.docs
      .map((loanDoc) => {
        const data = loanDoc.data() as Loan;
        const { id: _, ...dataWithoutId } = data;
        const employee = employeeMap.get(data.employeeId);
        const company = companyMap.get(data.companyId);
        console.log("AdminDashboard: Processing loan", loanDoc.id, "for employee", data.employeeId);
        return {
          id: loanDoc.id,
          ...dataWithoutId,
          employeeName: data.employeeName ?? employee?.name ?? "Unknown",
          companyName: data.companyName ?? company?.name ?? "Unknown",
        };
      })
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

    console.log("AdminDashboard: Processed", loanList.length, "loans");
    setLoans(loanList);
    return loanList;
  };

  const loadAllData = async () => {
    console.log("AdminDashboard: Starting loadAllData");
    setLoading(true);
    try {
      // First migrate company statuses for existing companies
      console.log("AdminDashboard: Running company migration");
      await migrateCompanyStatus();
      
      console.log("AdminDashboard: Loading companies and employees");
      const [companyList, employeeList] = await Promise.all([loadCompanies(), loadEmployees()]);
      
      console.log("AdminDashboard: Loading loans");
      await loadLoans(companyList, employeeList);
      
      console.log("AdminDashboard: All data loaded successfully");
    } catch (error: any) {
      console.error("AdminDashboard: Failed to refresh admin data:", error);
      toast({
        title: "Error",
        description: "Unable to refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshLoans = async () => {
    try {
      await loadLoans();
    } catch (error: any) {
      console.error("Failed to refresh loans:", error);
      toast({
        title: "Error",
        description: "Unable to refresh loans. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLoanApprove = async (loanId: string, notes?: string) => {
    try {
      await updateDoc(doc(db, "loans", loanId), {
        status: "approved",
        notes: notes || "",
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Loan approved",
        description: "The loan has been approved successfully.",
      });
      await refreshLoans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLoanReject = async (loanId: string, reason: string) => {
    try {
      await updateDoc(doc(db, "loans", loanId), {
        status: "rejected",
        rejectionReason: reason,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Loan rejected",
        description: "The loan has been rejected with the provided reason.",
      });
      await refreshLoans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCompanyApprove = async (companyId: string) => {
    try {
      console.log("Approving company:", companyId);
      await updateDoc(doc(db, "companies", companyId), {
        status: "approved",
        approvedAt: new Date().toISOString(),
      });

      toast({
        title: "Company approved",
        description: "The company has been approved successfully.",
      });
      await loadCompanies();
    } catch (error: any) {
      console.error("Error approving company:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCompanyReject = async (companyId: string, reason: string) => {
    try {
      console.log("Rejecting company:", companyId, "Reason:", reason);
      await updateDoc(doc(db, "companies", companyId), {
        status: "rejected",
        rejectionReason: reason,
        rejectedAt: new Date().toISOString(),
      });

      toast({
        title: "Company rejected",
        description: "The company has been rejected with the provided reason.",
      });
      await loadCompanies();
    } catch (error: any) {
      console.error("Error rejecting company:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditBalance = (companyId: string, currentBalance: number) => {
    setEditingBalance(companyId);
    setTempBalance(currentBalance.toString());
  };

  const handleSaveBalance = async (companyId: string) => {
    try {
      const newBalance = parseFloat(tempBalance);
      if (isNaN(newBalance) || newBalance < 0) {
        toast({
          title: "Invalid Balance",
          description: "Please enter a valid positive number.",
          variant: "destructive",
        });
        return;
      }

      await updateDoc(doc(db, "companies", companyId), {
        balance: newBalance,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Balance Updated",
        description: "Company balance has been updated successfully.",
      });
      
      setEditingBalance(null);
      setTempBalance("");
      await loadCompanies();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingBalance(null);
    setTempBalance("");
  };

  const handleGenerateCompanyCode = async (companyId: string, existingCode?: string | null) => {
    setGeneratingCompanyCodeId(companyId);
    try {
      const newCompanyCode = await generateCompanyCode();
      await updateDoc(doc(db, "companies", companyId), {
        companyCode: newCompanyCode,
        updatedAt: new Date().toISOString(),
      });

      setCompanies((prev) =>
        prev.map((company) =>
          company.id === companyId ? { ...company, companyCode: newCompanyCode } : company
        )
      );

      toast({
        title: existingCode ? "Company ID regenerated" : "Company ID generated",
        description: `New Company ID: ${newCompanyCode}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingCompanyCodeId(null);
    }
  };

  const handleViewLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setDialogOpen(true);
  };

  const handleGenerateEmployeeId = async (employee: Employee) => {
    setGeneratingEmployeeId(employee.id);
    try {
      const newEmployeeId = await generateEmployeeId();
      await updateDoc(doc(db, "employees", employee.id), {
        employeeId: newEmployeeId,
        updatedAt: new Date().toISOString(),
      });

      setEmployees((prev) =>
        prev.map((item) =>
          item.id === employee.id ? { ...item, employeeId: newEmployeeId } : item
        )
      );

      toast({
        title: employee.employeeId ? "Employee ID regenerated" : "Employee ID generated",
        description: `New Employee ID: ${newEmployeeId}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingEmployeeId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/admin/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredCompanies = useMemo(() => {
    if (!companySearch) return companies;
    return companies.filter((company) => {
      const haystack = `${company.name} ${company.email} ${company.companyCode || ""}`.toLowerCase();
      return haystack.includes(companySearch.toLowerCase());
    });
  }, [companies, companySearch]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch) return employees;
    return employees.filter((employee) => {
      const haystack = `${employee.name} ${employee.email} ${employee.employeeId || ""}`.toLowerCase();
      return haystack.includes(employeeSearch.toLowerCase());
    });
  }, [employees, employeeSearch]);

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchesStatus = loanStatusFilter === "all" || loan.status === loanStatusFilter;
      if (!loanSearch) return matchesStatus;
      const haystack = `${loan.employeeName ?? ""} ${loan.companyName ?? ""} ${loan.purpose ?? ""}`.toLowerCase();
      return matchesStatus && haystack.includes(loanSearch.toLowerCase());
    });
  }, [loans, loanSearch, loanStatusFilter]);

  const pendingLoans = loans.filter((loan) => loan.status === "pending");
  const approvedLoans = loans.filter((loan) => loan.status === "approved");
  const rejectedLoans = loans.filter((loan) => loan.status === "rejected");

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--gradient-primary)" }}>
        <div className="container py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <div className="grid gap-6 md:grid-cols-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-primary)" }}>
      <div className="container py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-500">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {admin?.name ? `Welcome, ${admin.name}` : "Admin Dashboard"}
            </h1>
            <p className="text-muted-foreground">Full overview of companies, employees, and loans</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setGlobalRateSettingsOpen(true)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Global Interest Rates
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                await migrateCompanyStatus();
                await loadCompanies();
                toast({
                  title: "Migration Complete",
                  description: "Company statuses have been updated.",
                });
              }}
              className="gap-2"
            >
              Migrate Companies
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <Landmark className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4 animate-in slide-in-from-bottom duration-700">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companies.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered companies</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active employees</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved Loans</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedLoans.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all companies</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Loans</CardTitle>
              <FileText className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingLoans.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting decisions</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg animate-in slide-in-from-bottom duration-700">
          <CardHeader>
            <CardTitle>Companies</CardTitle>
            <CardDescription>Manage company approvals and view company information</CardDescription>
          </CardHeader>
          <CardContent>
            <SearchFilter
              searchTerm={companySearch}
              onSearchChange={setCompanySearch}
              placeholder="Search companies by name, email, or company ID..."
            />
            {filteredCompanies.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company ID</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Interest Rates</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id} className="hover:bg-muted/50 transition-colors group">
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {company.companyCode ?? "Not generated"}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleGenerateCompanyCode(company.id!, company.companyCode)}
                            disabled={generatingCompanyCodeId === company.id}
                          >
                            <RefreshCw className="h-4 w-4" />
                            {generatingCompanyCodeId === company.id
                              ? "Generating..."
                              : company.companyCode
                              ? "Regenerate"
                              : "Generate"}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {editingBalance === company.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={tempBalance}
                              onChange={(e) => setTempBalance(e.target.value)}
                              className="w-24 h-8"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveBalance(company.id!)}
                              className="h-8 w-8 p-0"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>₦{company.balance?.toFixed?.(2) ?? company.balance}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditBalance(company.id!, company.balance || 0)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            company.status === "approved"
                              ? "default"
                              : company.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {company.status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {company.interestRates ? (
                          <span className="text-sm text-muted-foreground">
                            3m: {company.interestRates["3"]}% • 6m: {company.interestRates["6"]}% • 12m: {company.interestRates["12"]}%
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not configured</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                console.log("Approve button clicked for company:", company.id);
                                handleCompanyApprove(company.id!);
                              }}
                              className="gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                console.log("Reject button clicked for company:", company.id);
                                const reason = prompt("Reason for rejection:");
                                if (reason) {
                                  handleCompanyReject(company.id!, reason);
                                }
                              }}
                              className="gap-1"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {company.status || "No status"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No companies match your search.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg animate-in slide-in-from-bottom duration-700">
          <CardHeader>
            <CardTitle>Employees</CardTitle>
            <CardDescription>Employees across every company</CardDescription>
          </CardHeader>
          <CardContent>
            <SearchFilter
              searchTerm={employeeSearch}
              onSearchChange={setEmployeeSearch}
              placeholder="Search employees by name, email, or employee ID..."
            />
            {filteredEmployees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => {
                    const company = companies.find((c) => c.id === employee.companyId);
                    return (
                      <TableRow key={employee.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                              {employee.employeeId || "Not generated"}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => handleGenerateEmployeeId(employee)}
                              disabled={generatingEmployeeId === employee.id}
                            >
                              <RefreshCw className="h-4 w-4" />
                              {generatingEmployeeId === employee.id
                                ? "Generating..."
                                : employee.employeeId
                                ? "Regenerate"
                                : "Generate"}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{company?.name ?? "Unknown"}</TableCell>
                        <TableCell className="font-semibold">
                          ₦{employee.salary?.toFixed?.(2) ?? employee.salary}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedEmployeeForHistory(employee)}
                            className="gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            View Loans
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No employees match your search.</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg animate-in slide-in-from-bottom duration-700">
          <CardHeader>
            <CardTitle>Loans</CardTitle>
            <CardDescription>Monitor and manage every loan request</CardDescription>
          </CardHeader>
          <CardContent>
            <SearchFilter
              searchTerm={loanSearch}
              onSearchChange={setLoanSearch}
              filterStatus={loanStatusFilter}
              onFilterChange={setLoanStatusFilter}
              showStatusFilter
              placeholder="Search loans by employee, company, or purpose..."
            />
            {filteredLoans.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => (
                    <TableRow key={loan.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{loan.employeeName ?? "Unknown"}</TableCell>
                      <TableCell>{loan.companyName ?? "Unknown"}</TableCell>
                      <TableCell className="font-semibold">₦{loan.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            loan.status === "approved"
                              ? "default"
                              : loan.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {loan.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleViewLoan(loan)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No loans match your filters.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employee Loan History Modal */}
      {selectedEmployeeForHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Employee Loan History</h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedEmployeeForHistory(null)}
                >
                  Close
                </Button>
              </div>
              <EmployeeLoanHistory
                employeeId={selectedEmployeeForHistory.id}
                employeeName={selectedEmployeeForHistory.name}
                onViewLoan={handleViewLoan}
                showActions={true}
              />
            </div>
          </div>
        </div>
      )}

      <LoanDetailsDialog
        loan={selectedLoan}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onApprove={handleLoanApprove}
        onReject={handleLoanReject}
        userRole="admin"
      />

      <GlobalInterestRateSettings
        open={globalRateSettingsOpen}
        onOpenChange={setGlobalRateSettingsOpen}
      />
    </div>
  );
};

export default AdminDashboard;
