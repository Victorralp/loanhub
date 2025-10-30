import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../hooks/use-toast";
import { Company, Employee, Loan, UserRole, getPermissions } from "../types";
import SearchFilter from "../components/SearchFilter";
import EmployeeLoanHistory from "../components/EmployeeLoanHistory";
import { CheckCircle, XCircle, Users, UserCheck, UserX, DollarSign, Clock, Eye, RefreshCw } from "lucide-react";
import { formatCurrency } from "../utils/format";
import { generateCompanyCode } from "../utils/company-utils";

const CompanyDashboard = () => {
  const [company, setCompany] = useState<(Company & { id: string }) | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("admin");
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState<Employee | null>(null);
  const [generatingCompanyCode, setGeneratingCompanyCode] = useState(false);
  
  // Search states
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loanSearch, setLoanSearch] = useState("");
  const [loanStatusFilter, setLoanStatusFilter] = useState("all");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const permissions = getPermissions(userRole);

  useEffect(() => {
    const storedCompany = localStorage.getItem("company");
    if (!storedCompany) {
      setLoading(false);
      navigate("/company/login");
      return;
    }

    let parsedCompany: (Company & { id: string }) | null = null;
    try {
      parsedCompany = JSON.parse(storedCompany);
    } catch (error) {
      console.error("CompanyDashboard: Failed to parse stored company", error);
    }

    if (!parsedCompany || !parsedCompany.id) {
      localStorage.removeItem("company");
      setLoading(false);
      navigate("/company/login");
      return;
    }

    const refreshCompanyData = async () => {
      try {
        const companyDoc = await getDoc(doc(db, "companies", parsedCompany!.id));
        if (!companyDoc.exists()) {
          localStorage.removeItem("company");
          toast({
            title: "Company not found",
            description: "Your company record could not be located. Please register again.",
            variant: "destructive",
          });
          navigate("/company/login");
          return;
        }

        const rawData = companyDoc.data() as Company;
        const companyData = {
          id: companyDoc.id,
          ...rawData,
          companyCode: rawData.companyCode ?? parsedCompany!.companyCode,
          email: rawData.email ?? parsedCompany!.email,
        };

        if (companyData.status !== "approved") {
          localStorage.removeItem("company");
          toast({
            title: "Access pending",
            description: "Your company account is not approved yet.",
            variant: "destructive",
          });
          navigate("/company/login");
          return;
        }

        setCompany(companyData);
        setUserRole(companyData.role || "admin");
        await loadEmployees(companyData.id);
        await loadLoans(companyData.id);
        localStorage.setItem("company", JSON.stringify(companyData));
      } catch (error: any) {
        console.error("CompanyDashboard: Failed to load company", error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    refreshCompanyData();
  }, [navigate, toast]);

  const loadEmployees = async (companyId: string) => {
    try {
      console.log("CompanyDashboard: Loading employees for company:", companyId);
      const q = query(collection(db, "employees"), where("companyId", "==", companyId));
      const snapshot = await getDocs(q);
      console.log("CompanyDashboard: Found", snapshot.docs.length, "employees");
      const employeeList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      console.log("CompanyDashboard: Employee data:", employeeList);
      setEmployees(employeeList);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const loadLoans = async (companyId: string) => {
    try {
      console.log("CompanyDashboard: Loading loans for company:", companyId);
      const q = query(collection(db, "loans"), where("companyId", "==", companyId));
      const snapshot = await getDocs(q);
      console.log("CompanyDashboard: Found", snapshot.docs.length, "loans");
      const loanList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Loan[];
      
      // Sort by createdAt in descending order (newest first)
      loanList.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      console.log("CompanyDashboard: Loan data:", loanList);
      setLoans(loanList);
    } catch (error) {
      console.error("Error loading company loans:", error);
    }
  };

  const handleGenerateCompanyCode = async () => {
    if (!company?.id) {
      toast({
        title: "Error",
        description: "Company session not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingCompanyCode(true);
    try {
      const newCompanyCode = await generateCompanyCode();
      await updateDoc(doc(db, "companies", company.id), {
        companyCode: newCompanyCode,
      });

      const updatedCompany = { ...company, companyCode: newCompanyCode };
      setCompany(updatedCompany);
      localStorage.setItem("company", JSON.stringify(updatedCompany));

      toast({
        title: "Company ID Updated",
        description: `Your new company ID is ${newCompanyCode}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingCompanyCode(false);
    }
  };

  const handleEmployeeVerify = async (employeeId: string) => {
    try {
      await updateDoc(doc(db, "employees", employeeId), {
        status: "verified",
        verifiedAt: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "Employee verified successfully",
      });

      if (company?.id) {
        await loadEmployees(company.id);
        await loadLoans(company.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEmployeeReject = async (employeeId: string, reason: string) => {
    try {
      await updateDoc(doc(db, "employees", employeeId), {
        status: "rejected",
        rejectionReason: reason,
        rejectedAt: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "Employee rejected successfully",
      });

      if (company?.id) {
        await loadEmployees(company.id);
        await loadLoans(company.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLoanApprove = async (loanId: string) => {
    try {
      await updateDoc(doc(db, "loans", loanId), {
        status: "approved",
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "Loan approved successfully",
      });

      if (company?.id) {
        await loadLoans(company.id);
      }
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
        title: "Success",
        description: "Loan rejected successfully",
      });

      if (company?.id) {
        await loadLoans(company.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  const handleLogout = () => {
    localStorage.removeItem("company");
    navigate("/company/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--gradient-primary)" }}>
        <div className="container py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <div className="grid gap-6 md:grid-cols-3">
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

  // Filter and search logic
  const pendingEmployees = employees.filter(emp => emp.status === "pending");
  const verifiedEmployees = employees.filter(emp => emp.status === "verified");
  const rejectedEmployees = employees.filter(emp => emp.status === "rejected");
  
  // Debug logging
  console.log("CompanyDashboard: Total employees:", employees.length);
  console.log("CompanyDashboard: Pending employees:", pendingEmployees.length);
  console.log("CompanyDashboard: Verified employees:", verifiedEmployees.length);
  console.log("CompanyDashboard: Rejected employees:", rejectedEmployees.length);
  
  const pendingLoans = loans.filter(loan => loan.status === "pending");
  const approvedLoans = loans.filter(loan => loan.status === "approved");
  const rejectedLoans = loans.filter(loan => loan.status === "rejected");
  
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                         emp.email.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                         (emp.employeeId && emp.employeeId.toLowerCase().includes(employeeSearch.toLowerCase()));
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredLoans = loans.filter(loan => {
    const employee = employees.find(emp => emp.id === loan.employeeId);
    const matchesSearch = loanSearch === "" || 
                         (employee?.name.toLowerCase().includes(loanSearch.toLowerCase()) ||
                          employee?.email.toLowerCase().includes(loanSearch.toLowerCase()) ||
                          loan.purpose?.toLowerCase().includes(loanSearch.toLowerCase()));
    const matchesStatus = loanStatusFilter === "all" || loan.status === loanStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-primary)" }}>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8 animate-in fade-in duration-500">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{company?.name}</h1>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
            <p className="text-lg text-muted-foreground">Balance: {formatCurrency(company?.balance ?? 0)}</p>
              <span className="text-muted-foreground">•</span>
              <p className="text-sm text-muted-foreground">
                Rates: 3mo-{company?.interestRates?.["3"] || 1}% | 6mo-{company?.interestRates?.["6"] || 1}% | 12mo-{company?.interestRates?.["12"] || 1}%
              </p>
            </div>
            <Badge variant="outline" className="mt-2">
              {userRole.toUpperCase()} Role
            </Badge>
          </div>
          <Button onClick={handleLogout} variant="outline">Logout</Button>
        </div>
        
        {company && (
          <Card className="mb-8 shadow-lg animate-in slide-in-from-bottom duration-700">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Company ID</CardTitle>
                <CardDescription>
                  Share this ID with employees so they can connect to your company.
                </CardDescription>
              </div>
              <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
                <span className="font-mono text-lg bg-muted px-3 py-1 rounded-md">
                  {company.companyCode ?? "Not generated"}
                </span>
                <Button
                  variant="outline"
                  onClick={handleGenerateCompanyCode}
                  disabled={generatingCompanyCode}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {generatingCompanyCode
                    ? "Generating..."
                    : company.companyCode
                    ? "Generate New ID"
                    : "Generate ID"}
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}
        
        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-6 mb-8 animate-in slide-in-from-bottom duration-700">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
              <UserCheck className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingEmployees.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting verification</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Verified Employees</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{verifiedEmployees.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Confirmed team members</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedEmployees.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Not verified</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Loans</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingLoans.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved Loans</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedLoans.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully approved</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rejected Loans</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedLoans.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Declined requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Employee Verification */}
        <Card className="shadow-lg mb-8 animate-in slide-in-from-bottom duration-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Employee Verification
            </CardTitle>
            <CardDescription>
              {pendingEmployees.length > 0 
                ? `Confirm that these ${pendingEmployees.length} employees work for your company`
                : "No pending employee verifications at this time"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingEmployees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingEmployees.map((employee) => (
                    <TableRow key={employee.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {employee.employeeId || "N/A"}
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(employee.salary)}</TableCell>
                      <TableCell>{new Date(employee.createdAt || "").toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleEmployeeVerify(employee.id)}
                            className="gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const reason = prompt("Reason for rejection:");
                              if (reason) {
                                handleEmployeeReject(employee.id, reason);
                              }
                            }}
                            className="gap-1"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  No pending employee verifications
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  New employees will appear here when they register
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loan Overview */}
        <Card className="shadow-lg mb-8 animate-in slide-in-from-bottom duration-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Loan Overview
            </CardTitle>
            <CardDescription>All loan requests from your employees ({loans.length} total)</CardDescription>
          </CardHeader>
          <CardContent>
            <SearchFilter
              searchTerm={loanSearch}
              onSearchChange={setLoanSearch}
              filterStatus={loanStatusFilter}
              onFilterChange={setLoanStatusFilter}
              placeholder="Search loans by employee name, email, or purpose..."
              showStatusFilter
            />
            {filteredLoans.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => {
                    const employee = employees.find(emp => emp.id === loan.employeeId);
                    return (
                      <TableRow key={loan.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          {employee?.name || "Unknown Employee"}
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(loan.amount)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {loan.purpose || "No purpose specified"}
                        </TableCell>
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
                        <TableCell>
                          {loan.repaymentTerm ? `${loan.repaymentTerm} months` : "N/A"}
                        </TableCell>
                        <TableCell>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {loan.status === "pending" && permissions.canApproveLoan && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleLoanApprove(loan.id)}
                                  className="gap-1"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    const reason = prompt("Reason for rejection:");
                                    if (reason) {
                                      handleLoanReject(loan.id, reason);
                                    }
                                  }}
                                  className="gap-1"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedEmployeeForHistory(employee!)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View History
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {loanSearch ? "No loans found" : "No loan requests yet"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Employees need to request loans first
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Employees */}
        <Card className="shadow-lg animate-in slide-in-from-bottom duration-700">
          <CardHeader>
            <CardTitle>All Employees</CardTitle>
            <CardDescription>Complete employee list ({employees.length} total)</CardDescription>
          </CardHeader>
          <CardContent>
            <SearchFilter
              searchTerm={employeeSearch}
              onSearchChange={setEmployeeSearch}
              filterStatus={statusFilter}
              onFilterChange={setStatusFilter}
              placeholder="Search employees by name, email, or employee ID..."
              showStatusFilter
            />
            {filteredEmployees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {employee.employeeId || "N/A"}
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(employee.salary)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            employee.status === "verified"
                              ? "default"
                              : employee.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {employee.status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(employee.createdAt || "").toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedEmployeeForHistory(employee)}
                          className="gap-1"
                        >
                          <Users className="h-4 w-4" />
                          View Loans
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {employeeSearch ? "No employees found" : "No employees yet"}
                </p>
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
                showActions={false}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CompanyDashboard;
