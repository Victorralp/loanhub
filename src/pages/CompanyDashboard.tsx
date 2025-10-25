import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../hooks/use-toast";
import { Loan, Company, Employee, UserRole, getPermissions } from "../types";
import LoanDetailsDialog from "../components/LoanDetailsDialog";
import SearchFilter from "../components/SearchFilter";
import InterestRateSettings from "../components/InterestRateSettings";
import { Eye, TrendingUp, TrendingDown, Users, FileText, DollarSign, Settings } from "lucide-react";


const CompanyDashboard = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("admin");
  
  // Search and filter states
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [loanSearch, setLoanSearch] = useState("");
  const [loanStatusFilter, setLoanStatusFilter] = useState("all");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const permissions = getPermissions(userRole);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/company/login");
        return;
      }

      try {
        // Load company data
        const companyDoc = await getDoc(doc(db, "companies", user.uid));
        if (companyDoc.exists()) {
          const companyData = companyDoc.data() as Company;
          setCompany(companyData);
          setUserRole(companyData.role || "admin");
          await loadEmployees(user.uid);
          await loadLoans(user.uid);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, toast]);

  const loadEmployees = async (companyId: string) => {
    const q = query(collection(db, "employees"), where("companyId", "==", companyId));
    const snapshot = await getDocs(q);
    const employeeList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Employee[];
    setEmployees(employeeList);
  };

  const loadLoans = async (companyId: string) => {
    const q = query(collection(db, "loans"), where("companyId", "==", companyId));
    const snapshot = await getDocs(q);
    
    // Get employee names for each loan
    const loanList = await Promise.all(
      snapshot.docs.map(async (loanDoc) => {
        const loanData = loanDoc.data();
        const employeeDoc = await getDoc(doc(db, "employees", loanData.employeeId));
        return {
          id: loanDoc.id,
          ...loanData,
          employeeName: employeeDoc.exists() ? employeeDoc.data().name : "Unknown"
        } as Loan;
      })
    );
    
    setLoans(loanList);
  };

  const handleLoanApprove = async (loanId: string, notes?: string) => {
    if (!permissions.canApproveLoan) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to approve loans",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateDoc(doc(db, "loans", loanId), {
        status: "approved",
        notes: notes || "",
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "Loan approved successfully",
      });

      if (auth.currentUser) {
        await loadLoans(auth.currentUser.uid);
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
    if (!permissions.canRejectLoan) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to reject loans",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateDoc(doc(db, "loans", loanId), {
        status: "rejected",
        rejectionReason: reason,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Loan Rejected",
        description: "Loan has been rejected with reason provided",
      });

      if (auth.currentUser) {
        await loadLoans(auth.currentUser.uid);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setDialogOpen(true);
  };

  const handleUpdateInterestRates = async (newRates: any) => {
    if (!auth.currentUser) return;

    try {
      await updateDoc(doc(db, "companies", auth.currentUser.uid), {
        interestRates: newRates,
      });

      toast({
        title: "Success",
        description: "Interest rates updated successfully",
      });

      // Reload company data
      const companyDoc = await getDoc(doc(db, "companies", auth.currentUser.uid));
      if (companyDoc.exists()) {
        setCompany(companyDoc.data() as Company);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/company/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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
  const pendingLoans = loans.filter(loan => loan.status === "pending");
  const approvedLoans = loans.filter(loan => loan.status === "approved");
  const rejectedLoans = loans.filter(loan => loan.status === "rejected");
  
  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.email.toLowerCase().includes(employeeSearch.toLowerCase())
  );
  
  const filteredLoans = loans.filter(loan => {
    const matchesSearch = loan.employeeName?.toLowerCase().includes(loanSearch.toLowerCase());
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
              <p className="text-lg text-muted-foreground">Balance: ${company?.balance.toFixed(2)}</p>
              <span className="text-muted-foreground">•</span>
              {company?.interestRates ? (
                <p className="text-sm text-muted-foreground">
                  Rates: 3mo-{company.interestRates["3"]}% | 6mo-{company.interestRates["6"]}% | 12mo-{company.interestRates["12"]}%
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Rates: Not set
                </p>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSettingsOpen(true)}
                className="gap-1 h-7 text-xs"
              >
                <Settings className="h-3 w-3" />
                {company?.interestRates ? "Edit Rates" : "Set Rates"}
              </Button>
            </div>
            <Badge variant="outline" className="mt-2">
              {userRole.toUpperCase()} Role
            </Badge>
          </div>
          <Button onClick={handleLogout} variant="outline">Logout</Button>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8 animate-in slide-in-from-bottom duration-700">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Loans</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingLoans.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total team members</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedLoans.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Loans approved</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedLoans.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Loans rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Loan Requests */}
        <Card className="shadow-lg mb-8 animate-in slide-in-from-bottom duration-700">
          <CardHeader>
            <CardTitle>Pending Loan Requests</CardTitle>
            <CardDescription>Review and approve/reject loan applications</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingLoans.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLoans.map((loan) => (
                    <TableRow key={loan.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{loan.employeeName}</TableCell>
                      <TableCell className="font-semibold">${loan.amount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewLoan(loan)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No pending loan requests</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee List */}
        {permissions.canViewAllEmployees && (
          <Card className="shadow-lg mb-8 animate-in slide-in-from-bottom duration-700">
            <CardHeader>
              <CardTitle>Employees</CardTitle>
              <CardDescription>Your team members ({employees.length} total)</CardDescription>
            </CardHeader>
            <CardContent>
              <SearchFilter
                searchTerm={employeeSearch}
                onSearchChange={setEmployeeSearch}
                placeholder="Search employees by name or email..."
              />
              {filteredEmployees.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Salary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell className="font-semibold">${employee.salary.toFixed(2)}</TableCell>
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
        )}

        {/* All Loans History */}
        <Card className="shadow-lg animate-in slide-in-from-bottom duration-700">
          <CardHeader>
            <CardTitle>All Loan Requests</CardTitle>
            <CardDescription>Complete loan history ({loans.length} total)</CardDescription>
          </CardHeader>
          <CardContent>
            <SearchFilter
              searchTerm={loanSearch}
              onSearchChange={setLoanSearch}
              filterStatus={loanStatusFilter}
              onFilterChange={setLoanStatusFilter}
              placeholder="Search loans by employee name..."
              showStatusFilter
            />
            {filteredLoans.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => (
                    <TableRow key={loan.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{loan.employeeName}</TableCell>
                      <TableCell className="font-semibold">${loan.amount.toFixed(2)}</TableCell>
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
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewLoan(loan)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {loanSearch || loanStatusFilter !== "all" ? "No loans found" : "No loan requests yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Loan Details Dialog */}
      <LoanDetailsDialog
        loan={selectedLoan}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onApprove={handleLoanApprove}
        onReject={handleLoanReject}
        userRole="company"
      />

      {/* Interest Rate Settings Dialog */}
      {company && (
        <InterestRateSettings
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          currentRates={company.interestRates || { "3": 5, "6": 7, "12": 10 }}
          onSave={handleUpdateInterestRates}
        />
      )}
    </div>
  );
};

export default CompanyDashboard;