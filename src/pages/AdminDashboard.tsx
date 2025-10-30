import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useToast } from "../hooks/use-toast";
import SearchFilter from "../components/SearchFilter";
import LoanDetailsDialog from "../components/LoanDetailsDialog";
import GlobalInterestRateSettings from "../components/GlobalInterestRateSettings";
import { formatCurrency } from "../utils/format";
import { Admin, Company, Employee, Loan } from "../types";
import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  Landmark,
  CheckCircle,
  XCircle,
  Settings,
  Edit3,
  Save,
  X,
  RefreshCw,
  UserPlus,
  Mail,
  Wallet,
  Calendar as CalendarIcon,
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
  const [globalRateSettingsOpen, setGlobalRateSettingsOpen] = useState(false);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [editingBalance, setEditingBalance] = useState<string | null>(null);
  const [tempBalance, setTempBalance] = useState<string>("");
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
  const [newEmployeeSalary, setNewEmployeeSalary] = useState("");
  const [isSavingEmployee, setIsSavingEmployee] = useState(false);

  const [companySearch, setCompanySearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [loanSearch, setLoanSearch] = useState("");
  const [loanStatusFilter, setLoanStatusFilter] = useState("all");
  const [companyStatusFilter, setCompanyStatusFilter] = useState("all");
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState("all");
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

  useEffect(() => {
    if (companies.length === 0) {
      if (selectedCompanyId !== null) {
        setSelectedCompanyId(null);
      }
      return;
    }

    if (!selectedCompanyId || !companies.some((company) => company.id === selectedCompanyId)) {
      const firstCompanyId = companies[0]?.id ?? null;
      if (firstCompanyId && firstCompanyId !== selectedCompanyId) {
        setSelectedCompanyId(firstCompanyId);
      }
    }
  }, [companies, selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId) {
      if (selectedEmployeeId !== null) {
        setSelectedEmployeeId(null);
      }
      return;
    }

    const scopedEmployees = employees.filter((employee) => employee.companyId === selectedCompanyId);
    if (scopedEmployees.length === 0) {
      if (selectedEmployeeId !== null) {
        setSelectedEmployeeId(null);
      }
      return;
    }

    if (!selectedEmployeeId || !scopedEmployees.some((employee) => employee.id === selectedEmployeeId)) {
      setSelectedEmployeeId(scopedEmployees[0].id);
    }
  }, [selectedCompanyId, employees, selectedEmployeeId]);

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

  // Enforce default interest rates of 1% across all companies
  const enforceDefaultInterestRates = async () => {
    try {
      console.log("AdminDashboard: Enforcing default interest rates (1%) for all companies");
      const snapshot = await getDocs(collection(db, "companies"));
      const updates = snapshot.docs.map(async (companyDoc) => {
        const data = companyDoc.data() as Company;
        const ir: any = data?.interestRates ?? {};
        const rate3 = typeof ir?.["3"] === "number" ? ir["3"] : Number(ir?.["3"]);
        const rate6 = typeof ir?.["6"] === "number" ? ir["6"] : Number(ir?.["6"]);
        const rate12 = typeof ir?.["12"] === "number" ? ir["12"] : Number(ir?.["12"]);
        const missingOrDifferent =
          rate3 !== 1 || rate6 !== 1 || rate12 !== 1 || ir?.["3"] == null || ir?.["6"] == null || ir?.["12"] == null;
        if (missingOrDifferent) {
          await updateDoc(doc(db, "companies", companyDoc.id), {
            interestRates: { "3": 1, "6": 1, "12": 1 },
            updatedAt: new Date().toISOString(),
          });
        }
      });
      await Promise.all(updates);
      console.log("AdminDashboard: Default interest rates enforced where needed");
    } catch (error) {
      console.error("AdminDashboard: Failed enforcing default interest rates:", error);
    }
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

      // Ensure all companies have 1% interest rate by default
      await enforceDefaultInterestRates();
      
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

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setEmployeeSearch("");
    // Explicitly auto-select the first employee for this company
    try {
      const scoped = employees
        .filter((e) => e.companyId === companyId)
        .sort((a, b) => a.name.localeCompare(b.name));
      const firstId = scoped[0]?.id ?? null;
      setSelectedEmployeeId(firstId);
    } catch {
      // no-op; fallback to effect-based selection
    }
    setCompanyDialogOpen(true);
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
  };

  const resetAddEmployeeForm = () => {
    setNewEmployeeName("");
    setNewEmployeeEmail("");
    setNewEmployeeSalary("");
  };

  const handleAddEmployeeDialogOpenChange = (open: boolean) => {
    if (!open) {
      if (isSavingEmployee) {
        return;
      }
      setIsAddEmployeeOpen(false);
      resetAddEmployeeForm();
      return;
    }

    setIsAddEmployeeOpen(true);
  };

  const handleCreateEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCompany || !selectedCompany.id) {
      toast({
        title: "Select a company",
        description: "Choose a company before adding an employee.",
        variant: "destructive",
      });
      return;
    }

    const trimmedName = newEmployeeName.trim();
    const trimmedEmail = newEmployeeEmail.trim();
    const salaryValue = parseFloat(newEmployeeSalary);

    if (!trimmedName || !trimmedEmail) {
      toast({
        title: "Missing details",
        description: "Name and email are required.",
        variant: "destructive",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast({
        title: "Invalid email",
        description: "Please provide a valid employee email address.",
        variant: "destructive",
      });
      return;
    }

    if (Number.isNaN(salaryValue) || salaryValue <= 0) {
      toast({
        title: "Invalid salary",
        description: "Enter a salary greater than zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingEmployee(true);
      const employeeId = await generateEmployeeId();
      const employeeDocRef = doc(collection(db, "employees"));
      const timestamp = new Date().toISOString();

      const employeeRecord = {
        employeeId,
        name: trimmedName,
        email: trimmedEmail.toLowerCase(),
        salary: salaryValue,
        companyId: selectedCompany.id,
        status: "pending" as Employee["status"],
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await setDoc(employeeDocRef, employeeRecord);

      const newEmployee: Employee = {
        id: employeeDocRef.id,
        ...employeeRecord,
      };

      setEmployees((prev) => [...prev, newEmployee]);
      setSelectedEmployeeId(employeeDocRef.id);
      setEmployeeSearch("");

      toast({
        title: "Employee added",
        description: `${trimmedName} has been added to ${selectedCompany.name}. Employee ID: ${employeeId}`,
      });

      resetAddEmployeeForm();
      setIsAddEmployeeOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message ?? "Unable to add employee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingEmployee(false);
    }
  };

  const selectedCompany = useMemo(() => {
    if (!selectedCompanyId) {
      return null;
    }

    return companies.find((company) => company.id === selectedCompanyId) ?? null;
  }, [companies, selectedCompanyId]);

  const companyEmployeeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    employees.forEach((employee) => {
      counts.set(employee.companyId, (counts.get(employee.companyId) ?? 0) + 1);
    });
    return counts;
  }, [employees]);

  const companyLoanSummary = useMemo(() => {
    const summary = new Map<string, { total: number; pending: number; approved: number; rejected: number }>();
    loans.forEach((loan) => {
      const current = summary.get(loan.companyId) ?? { total: 0, pending: 0, approved: 0, rejected: 0 };
      current.total += 1;
      if (loan.status === "pending") {
        current.pending += 1;
      } else if (loan.status === "approved") {
        current.approved += 1;
      } else if (loan.status === "rejected") {
        current.rejected += 1;
      }
      summary.set(loan.companyId, current);
    });
    return summary;
  }, [loans]);

  const employeeLoanCounts = useMemo(() => {
    const counts = new Map<string, { total: number; pending: number; approved: number; rejected: number }>();
    loans.forEach((loan) => {
      const current = counts.get(loan.employeeId) ?? { total: 0, pending: 0, approved: 0, rejected: 0 };
      current.total += 1;
      if (loan.status === "pending") {
        current.pending += 1;
      } else if (loan.status === "approved") {
        current.approved += 1;
      } else if (loan.status === "rejected") {
        current.rejected += 1;
      }
      counts.set(loan.employeeId, current);
    });
    return counts;
  }, [loans]);

  const filteredCompanies = useMemo(() => {
    if (!companies.length) {
      return [];
    }
    const search = companySearch.trim().toLowerCase();
    const sorted = [...companies].sort((a, b) => a.name.localeCompare(b.name));

    const byStatus =
      companyStatusFilter === "all"
        ? sorted
        : sorted.filter((company) => (company.status ?? "pending") === companyStatusFilter);

    if (!search) {
      return byStatus;
    }
    return byStatus.filter((company) => {
      const haystack = `${company.name} ${company.email} ${company.companyCode ?? ""}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [companies, companySearch, companyStatusFilter]);

  const employeesForSelectedCompany = useMemo(() => {
    if (!selectedCompanyId) {
      return [];
    }
    const scoped = employees.filter((employee) => employee.companyId === selectedCompanyId);
    const sorted = [...scoped].sort((a, b) => a.name.localeCompare(b.name));

    const byStatus =
      employeeStatusFilter === "all"
        ? sorted
        : sorted.filter((employee) => (employee.status ?? "pending") === employeeStatusFilter);

    if (!employeeSearch) {
      return byStatus;
    }
    const search = employeeSearch.trim().toLowerCase();
    return byStatus.filter((employee) => {
      const haystack = `${employee.name} ${employee.email} ${employee.employeeId ?? ""}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [employees, selectedCompanyId, employeeSearch, employeeStatusFilter]);

  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeId) {
      return null;
    }
    return employees.find((employee) => employee.id === selectedEmployeeId) ?? null;
  }, [employees, selectedEmployeeId]);

  const selectedEmployeeLoans = useMemo(() => {
    if (!selectedEmployeeId) {
      return [];
    }
    return loans
      .filter((loan) => loan.employeeId === selectedEmployeeId)
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  }, [loans, selectedEmployeeId]);

  const employeeLoanStats = useMemo(() => {
    return selectedEmployeeLoans.reduce(
      (acc, loan) => {
        acc.total += 1;
        acc.totalAmount += loan.amount ?? 0;
        if (loan.status === "pending") {
          acc.pending += 1;
        } else if (loan.status === "approved") {
          acc.approved += 1;
        } else if (loan.status === "rejected") {
          acc.rejected += 1;
        }
        return acc;
      },
      { total: 0, approved: 0, pending: 0, rejected: 0, totalAmount: 0 }
    );
  }, [selectedEmployeeLoans]);

  const filteredLoans = useMemo(() => {
    const search = loanSearch.trim().toLowerCase();
    return loans.filter((loan) => {
      const matchesStatus = loanStatusFilter === "all" || loan.status === loanStatusFilter;
      if (!matchesStatus) {
        return false;
      }
      if (selectedCompanyId && loan.companyId !== selectedCompanyId) {
        return false;
      }
      if (selectedEmployeeId && loan.employeeId !== selectedEmployeeId) {
        return false;
      }
      if (!search) {
        return true;
      }
      const haystack = `${loan.employeeName ?? ""} ${loan.companyName ?? ""} ${loan.purpose ?? ""}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [loans, loanSearch, loanStatusFilter, selectedCompanyId, selectedEmployeeId]);

  const pendingLoans = loans.filter((loan) => loan.status === "pending");
  const approvedLoans = loans.filter((loan) => loan.status === "approved");
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
              filterStatus={companyStatusFilter}
              onFilterChange={setCompanyStatusFilter}
              showStatusFilter
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
                  {filteredCompanies.map((company) => {

                    const isSelected = company.id === selectedCompanyId;

                    const employeeCount = company.id ? companyEmployeeCounts.get(company.id) ?? 0 : 0;

                    const loanSummary =

                      company.id && companyLoanSummary.get(company.id)

                        ? companyLoanSummary.get(company.id)!

                        : { total: 0, pending: 0, approved: 0, rejected: 0 };

                    return (

                      <TableRow

                        key={company.id}

                        className={`group cursor-pointer transition-colors ${

                          isSelected ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/50"

                        }`}

                        onClick={() => handleCompanySelect(company.id!)}

                      >

                        <TableCell className="font-medium">

                          <div className="flex flex-col">

                            <span>{company.name}</span>

                            <span className="mt-1 text-xs text-muted-foreground">

                              {employeeCount} employee{employeeCount === 1 ? '' : 's'} · {loanSummary.total} loan{loanSummary.total === 1 ? '' : 's'}

                            </span>

                            {loanSummary.pending > 0 || loanSummary.approved > 0 ? (

                              <span className="text-xs text-muted-foreground">

                                {loanSummary.pending} pending · {loanSummary.approved} approved

                              </span>

                            ) : null}

                          </div>

                        </TableCell>

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

                              onClick={(event) => {

                                event.stopPropagation();

                                handleCompanySelect(company.id!);

                                handleGenerateCompanyCode(company.id!, company.companyCode);

                              }}

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

                                className="h-8 w-24"

                                autoFocus

                              />

                              <Button

                                size="sm"

                                variant="ghost"

                                onClick={(event) => {

                                  event.stopPropagation();

                                  handleSaveBalance(company.id!);

                                }}

                                className="h-8 w-8 p-0"

                              >

                                <Save className="h-4 w-4" />

                              </Button>

                              <Button

                                size="sm"

                                variant="ghost"

                                onClick={(event) => {

                                  event.stopPropagation();

                                  handleCancelEdit();

                                }}

                                className="h-8 w-8 p-0"

                              >

                                <X className="h-4 w-4" />

                              </Button>

                            </div>

                          ) : (

                            <div className="flex items-center gap-2">

                              <span>

                                {"₦"}

                                {formatCurrency(company.balance ?? 0, "NGN", false)}

                              </span>

                              <Button

                                size="sm"

                                variant="ghost"

                                onClick={(event) => {

                                  event.stopPropagation();

                                  handleEditBalance(company.id!, company.balance || 0);

                                }}

                                className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"

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
                          <span className="text-sm text-muted-foreground">
                            Rates: 3m {company.interestRates?.["3"] ?? 1}% | 6m {company.interestRates?.["6"] ?? 1}% | 12m {company.interestRates?.["12"] ?? 1}%
                          </span>
                        </TableCell>

                        <TableCell>

                          {company.status === "pending" ? (

                            <div className="flex gap-2">

                              <Button

                                size="sm"

                                onClick={(event) => {

                                  event.stopPropagation();

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

                                onClick={(event) => {

                                  event.stopPropagation();

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

                    );

                  })}




                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No companies match your search.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hidden">

          <CardHeader className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <CardTitle>

                {selectedCompany ? `${selectedCompany.name} · Team` : "Employees"}

              </CardTitle>

              <CardDescription>

                {selectedCompany

                  ? "Click a row to focus an employee and review their activity."

                  : "Select a company to view and manage its employees."}

              </CardDescription>

            </div>

            <Button
              size="sm"
              className="gap-2"
              onClick={() => handleAddEmployeeDialogOpenChange(true)}
              disabled={!selectedCompany}
            >

              <UserPlus className="h-4 w-4" />

              Add Employee

            </Button>

          </CardHeader>

          <CardContent>

            {selectedCompany ? (

              <>

                <SearchFilter
                  searchTerm={employeeSearch}
                  onSearchChange={setEmployeeSearch}
                  filterStatus={employeeStatusFilter}
                  onFilterChange={setEmployeeStatusFilter}
                  showStatusFilter
                  statusOptions={[
                    { value: "all", label: "All Status" },
                    { value: "pending", label: "Pending" },
                    { value: "verified", label: "Verified" },
                    { value: "rejected", label: "Rejected" },
                  ]}
                  placeholder="Search employees by name, email, or employee ID..."
                />

                {employeesForSelectedCompany.length > 0 ? (

                  <Table>

                    <TableHeader>

                      <TableRow>

                        <TableHead>Name</TableHead>

                        <TableHead>Email</TableHead>

                        <TableHead>Employee ID</TableHead>

                        <TableHead>Salary</TableHead>

                        <TableHead>Loans</TableHead>

                        <TableHead>Status</TableHead>

                      </TableRow>

                    </TableHeader>

                    <TableBody>

                      {employeesForSelectedCompany.map((employee) => {

                        const loanCounts =

                          employeeLoanCounts.get(employee.id) ?? {

                            total: 0,

                            pending: 0,

                            approved: 0,

                            rejected: 0,

                          };

                        const isSelectedEmployee = employee.id === selectedEmployeeId;

                        return (

                          <TableRow

                            key={employee.id}

                            className={`cursor-pointer transition-colors ${

                              isSelectedEmployee ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/50"

                            }`}

                            onClick={() => handleEmployeeSelect(employee.id)}

                          >

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

                                  onClick={(event) => {

                                    event.stopPropagation();

                                    handleGenerateEmployeeId(employee);

                                  }}

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

                            <TableCell className="font-semibold">

                              {"₦"}

                              {"₦"}{employee.salary?.toFixed?.(2) ?? employee.salary}

                            </TableCell>

                            <TableCell className="text-sm text-muted-foreground">

                              {loanCounts.total} total

                              {loanCounts.pending > 0 ? ` / ${loanCounts.pending} pending` : ""}

                            </TableCell>

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

                          </TableRow>

                        );

                      })}

                    </TableBody>

                  </Table>

                ) : (

                  <div className="py-8 text-center text-sm text-muted-foreground">

                    No employees found for this company yet.

                  </div>

                )}

              </>

            ) : (

              <div className="py-8 text-center text-sm text-muted-foreground">

                Select a company from the table above to manage its employees.

              </div>

            )}

          </CardContent>

        </Card>



        <Card className="hidden">

          <CardHeader className="pb-4">

            <CardTitle>Employee Detail</CardTitle>

            <CardDescription>

              {selectedEmployee

                ? `Profile snapshot for ${selectedEmployee.name}.`

                : "Select an employee to view profile and loan history."}

            </CardDescription>

          </CardHeader>

          <CardContent className="space-y-6">

            {selectedEmployee ? (

              <>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                  <div>

                    <h3 className="text-2xl font-semibold text-foreground">{selectedEmployee.name}</h3>

                    <p className="text-sm text-muted-foreground">

                      Employee ID:{" "}

                      <span className="font-mono">

                        {selectedEmployee.employeeId || "Not generated"}

                      </span>

                    </p>

                  </div>

                  <Badge

                    variant={

                      selectedEmployee.status === "verified"

                        ? "default"

                        : selectedEmployee.status === "rejected"

                        ? "destructive"

                        : "secondary"

                    }

                  >

                    {selectedEmployee.status || "pending"}

                  </Badge>

                </div>



                <div className="grid gap-4 sm:grid-cols-2">

                  <div className="space-y-1">

                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>

                    <div className="flex items-center gap-2 text-sm">

                      <Mail className="h-4 w-4 text-muted-foreground" />

                      <span>{selectedEmployee.email}</span>

                    </div>

                  </div>

                  <div className="space-y-1">

                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Salary</p>

                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">

                      <Wallet className="h-4 w-4 text-muted-foreground" />

                      <span>

                        {"₦"}

                        {selectedEmployee.salary?.toFixed?.(2) ?? selectedEmployee.salary}

                      </span>

                    </div>

                  </div>

                  <div className="space-y-1">

                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company</p>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">

                      <Building2 className="h-4 w-4" />

                      <span>{selectedCompany?.name ?? "Unknown company"}</span>

                    </div>

                  </div>

                  <div className="space-y-1">

                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Update</p>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">

                      <CalendarIcon className="h-4 w-4" />

                      <span>

                        {selectedEmployee.createdAt

                          ? new Date(selectedEmployee.createdAt).toLocaleDateString()

                          : "Not available"}

                      </span>

                    </div>

                  </div>

                </div>



                <div className="grid gap-4 sm:grid-cols-4">

                  <div className="rounded-lg border bg-background p-4">

                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Loans</p>

                    <p className="mt-2 text-xl font-semibold text-foreground">{employeeLoanStats.total}</p>

                  </div>

                  <div className="rounded-lg border bg-background p-4">

                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Approved</p>

                    <p className="mt-2 text-xl font-semibold text-emerald-600">{employeeLoanStats.approved}</p>

                  </div>

                  <div className="rounded-lg border bg-background p-4">

                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending</p>

                    <p className="mt-2 text-xl font-semibold text-amber-600">{employeeLoanStats.pending}</p>

                  </div>

                  <div className="rounded-lg border bg-background p-4">

                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Requested</p>

                    <p className="mt-2 text-xl font-semibold text-foreground">

                      {"₦"}

                      {employeeLoanStats.totalAmount.toFixed(2)}

                    </p>

                  </div>

                </div>



                <div className="space-y-3">

                  <div className="flex flex-wrap items-center justify-between gap-2">

                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Loan Timeline</h4>

                    <span className="text-xs text-muted-foreground">

                      {selectedEmployeeLoans.length} record{selectedEmployeeLoans.length === 1 ? "" : "s"}

                    </span>

                  </div>

                  {selectedEmployeeLoans.length > 0 ? (

                    selectedEmployeeLoans.map((loan) => (

                      <div

                        key={loan.id}

                        className="flex flex-col gap-3 rounded-lg border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"

                      >

                        <div className="space-y-2">

                          <div className="flex items-center gap-2">

                            <span className="text-lg font-semibold text-foreground">

                              {"₦"}

                              {loan.amount.toFixed(2)}

                            </span>

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

                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">

                            <span className="flex items-center gap-1">

                              <CalendarIcon className="h-3.5 w-3.5" />

                              {new Date(loan.createdAt).toLocaleDateString()}

                            </span>

                            {loan.repaymentTerm ? <span>{loan.repaymentTerm} months</span> : null}

                            {loan.interestRate ? <span>{loan.interestRate}% interest</span> : null}

                          </div>

                          {loan.purpose ? (

                            <p className="text-sm text-muted-foreground line-clamp-2">{loan.purpose}</p>

                          ) : null}

                          {loan.totalAmount ? (

                            <p className="text-xs text-muted-foreground">

                              Total repayable: {"₦"}

                              {loan.totalAmount.toFixed(2)}

                              {loan.monthlyPayment ? (

                                <>

                                  {" "}

                                  · Monthly: {"₦"}

                                  {loan.monthlyPayment.toFixed(2)}

                                </>

                              ) : null}

                            </p>

                          ) : null}

                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">

                          <Button size="sm" variant="ghost" onClick={() => handleViewLoan(loan)} className="gap-1">

                            <FileText className="h-4 w-4" />

                            View

                          </Button>

                        </div>

                      </div>

                    ))

                  ) : (

                    <div className="py-8 text-center text-sm text-muted-foreground">

                      No loans recorded for this employee yet.

                    </div>

                  )}

                </div>

              </>

            ) : (

              <div className="py-8 text-center text-sm text-muted-foreground">

                Select an employee from the table above to see detailed information.

              </div>

            )}

          </CardContent>

        </Card>

        <Card className="shadow-lg animate-in slide-in-from-bottom duration-700">
          <CardHeader>
            <CardTitle>Loans</CardTitle>
            <CardDescription>
              {selectedEmployee
                ? `Showing loans requested by ${selectedEmployee.name}.`
                : selectedCompany
                ? `Showing loans for ${selectedCompany.name}.`
                : "Monitor and manage every loan request."}
            </CardDescription>
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
                      <TableCell className="font-semibold">
                        {formatCurrency(loan.amount)}
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

      <Dialog open={isAddEmployeeOpen} onOpenChange={handleAddEmployeeDialogOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>
              {selectedCompany
                ? `New hires will be created under ${selectedCompany.name}. They'll appear as pending until verified.`
                : "Select a company before adding employees."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEmployee} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-employee-name">Full name</Label>
              <Input
                id="add-employee-name"
                value={newEmployeeName}
                onChange={(event) => setNewEmployeeName(event.target.value)}
                placeholder="e.g. Adaobi Okafor"
                disabled={isSavingEmployee}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-employee-email">Email</Label>
              <Input
                id="add-employee-email"
                type="email"
                value={newEmployeeEmail}
                onChange={(event) => setNewEmployeeEmail(event.target.value)}
                placeholder="employee@company.com"
                disabled={isSavingEmployee}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-employee-salary">Monthly salary</Label>
              <Input
                id="add-employee-salary"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={newEmployeeSalary}
                onChange={(event) => setNewEmployeeSalary(event.target.value)}
                placeholder="0.00"
                disabled={isSavingEmployee}
                required
              />
            </div>
            {selectedCompany && (
              <p className="text-sm text-muted-foreground">
                This employee will be linked to <span className="font-medium text-foreground">{selectedCompany.name}</span> and
                marked as <span className="font-medium text-foreground">pending</span> until verified.
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddEmployeeDialogOpenChange(false)}
                disabled={isSavingEmployee}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingEmployee || !selectedCompany}>
                {isSavingEmployee ? "Adding..." : "Add employee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

      {/* Company Employees + Detail Dialog */}
      <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
        <DialogContent className="max-w-6xl w-[95vw] md:w-[90vw]">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle>
                  {selectedCompany ? `${selectedCompany.name} – Team` : "Employees"}
                </DialogTitle>
                <DialogDescription>
                  Review employees for this company and see details for a selected employee.
                </DialogDescription>
              </div>
              <div className="shrink-0">
                <Button 
                  size="sm"
                  className="gap-2"
                  onClick={() => handleAddEmployeeDialogOpenChange(true)}
                  disabled={!selectedCompany}
                >
                  <UserPlus className="h-4 w-4" />
                  Add Employee
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Employees list for selected company */}
            <div className="space-y-3">
              {selectedCompany ? (
                <>
                  <SearchFilter
                    searchTerm={employeeSearch}
                    onSearchChange={setEmployeeSearch}
                    filterStatus={employeeStatusFilter}
                    onFilterChange={setEmployeeStatusFilter}
                    showStatusFilter
                    statusOptions={[
                      { value: "all", label: "All Status" },
                      { value: "pending", label: "Pending" },
                      { value: "verified", label: "Verified" },
                      { value: "rejected", label: "Rejected" },
                    ]}
                    placeholder="Search employees by name, email, or employee ID..."
                  />

                  {employeesForSelectedCompany.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Employee ID</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeesForSelectedCompany.map((employee) => {
                          const isSelectedEmployee = employee.id === selectedEmployeeId;
                          return (
                            <TableRow
                              key={employee.id}
                              className={`cursor-pointer transition-colors ${
                                isSelectedEmployee ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/50"
                              }`}
                              onClick={() => handleEmployeeSelect(employee.id)}
                            >
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
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleGenerateEmployeeId(employee);
                                    }}
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
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No employees found for this company yet.
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Select a company to view employees.
                </div>
              )}
            </div>

            {/* Selected employee detail */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Employee Detail</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedEmployee
                    ? `Profile snapshot for ${selectedEmployee.name}.`
                    : "Select an employee from the list to view details."}
                </p>
              </div>

              {selectedEmployee ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xl font-semibold text-foreground">{selectedEmployee.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Employee ID: <span className="font-mono">{selectedEmployee.employeeId || "Not generated"}</span>
                      </p>
                    </div>
                    <Badge
                      variant={
                        selectedEmployee.status === "verified"
                          ? "default"
                          : selectedEmployee.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {selectedEmployee.status || "pending"}
                    </Badge>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedEmployee.email}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Salary</p>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <span>{formatCurrency(selectedEmployee.salary ?? 0)}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{selectedCompany?.name ?? "Unknown company"}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Update</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                          {selectedEmployee.createdAt
                            ? new Date(selectedEmployee.createdAt).toLocaleDateString()
                            : "Not available"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="rounded-lg border bg-background p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Loans</p>
                      <p className="mt-2 text-xl font-semibold text-foreground">{employeeLoanStats.total}</p>
                    </div>
                    <div className="rounded-lg border bg-background p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Approved</p>
                      <p className="mt-2 text-xl font-semibold text-emerald-600">{employeeLoanStats.approved}</p>
                    </div>
                    <div className="rounded-lg border bg-background p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending</p>
                      <p className="mt-2 text-xl font-semibold text-amber-600">{employeeLoanStats.pending}</p>
                    </div>
                    <div className="rounded-lg border bg-background p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Requested</p>
                      <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(employeeLoanStats.totalAmount)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Loan Timeline</h4>
                      <span className="text-xs text-muted-foreground">
                        {selectedEmployeeLoans.length} record{selectedEmployeeLoans.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    {selectedEmployeeLoans.length > 0 ? (
                      selectedEmployeeLoans.map((loan) => (
                        <div
                          key={loan.id}
                          className="flex flex-col gap-3 rounded-lg border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-foreground">{formatCurrency(loan.amount)}</span>
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
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                {new Date(loan.createdAt).toLocaleDateString()}
                              </span>
                              {loan.repaymentTerm ? <span>{loan.repaymentTerm} months</span> : null}
                              {loan.interestRate ? <span>{loan.interestRate}% interest</span> : null}
                            </div>
                            {loan.purpose ? (
                              <p className="text-sm text-muted-foreground line-clamp-2">{loan.purpose}</p>
                            ) : null}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No loans recorded for this employee yet.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Select an employee from the list to view detail.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;


