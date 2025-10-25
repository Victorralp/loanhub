import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, addDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Separator } from "../components/ui/separator";
import { useToast } from "../hooks/use-toast";
import { Loan, Employee as EmployeeType, calculateLoanDetails, InterestRatesByTerm } from "../types";
import LoanDetailsDialog from "../components/LoanDetailsDialog";
import { DollarSign, Clock, CheckCircle, XCircle, Eye } from "lucide-react";


const EmployeeDashboard = () => {
  const [employee, setEmployee] = useState<EmployeeType | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanAmount, setLoanAmount] = useState("");
  const [loanPurpose, setLoanPurpose] = useState("");
  const [companyInterestRates, setCompanyInterestRates] = useState<InterestRatesByTerm>({
    "3": 5,
    "6": 7,
    "12": 10
  });
  const [repaymentTerm, setRepaymentTerm] = useState<"3" | "6" | "12">("6");
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/employee/login");
        return;
      }

      try {
        const employeeDoc = await getDoc(doc(db, "employees", user.uid));
        if (employeeDoc.exists()) {
          const empData = employeeDoc.data() as EmployeeType;
          setEmployee(empData);
          
          // Fetch company's interest rates
          const companyDoc = await getDoc(doc(db, "companies", empData.companyId));
          if (companyDoc.exists()) {
            const companyData = companyDoc.data();
            if (companyData.interestRates) {
              setCompanyInterestRates(companyData.interestRates);
            } else if (companyData.defaultInterestRate) {
              // Backward compatibility
              const rate = companyData.defaultInterestRate;
              setCompanyInterestRates({
                "3": rate,
                "6": rate,
                "12": rate
              });
            }
          }
          
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

  const loadLoans = async (employeeId: string) => {
    const q = query(collection(db, "loans"), where("employeeId", "==", employeeId));
    const snapshot = await getDocs(q);
    const loanList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Loan[];
    setLoans(loanList);
  };

  const handleRequestLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(loanAmount);
    const rate = companyInterestRates[repaymentTerm];
    const term = parseInt(repaymentTerm);

    if (!employee) return;

    if (amount > employee.salary) {
      toast({
        title: "Error",
        description: "Loan amount cannot exceed your salary",
        variant: "destructive",
      });
      return;
    }

    if (!loanPurpose.trim()) {
      toast({
        title: "Error",
        description: "Please provide a purpose for the loan",
        variant: "destructive",
      });
      return;
    }

    try {
      const loanDetails = calculateLoanDetails(amount, rate, term);

      await addDoc(collection(db, "loans"), {
        employeeId: auth.currentUser?.uid,
        companyId: employee.companyId,
        amount,
        purpose: loanPurpose,
        interestRate: rate,
        repaymentTerm: term,
        totalAmount: loanDetails.totalAmount,
        monthlyPayment: loanDetails.monthlyPayment,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "Loan request submitted successfully",
      });
      setLoanAmount("");
      setLoanPurpose("");
      setRepaymentTerm("6");
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/employee/login");
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

  const pendingLoans = loans.filter(loan => loan.status === "pending");
  const approvedLoans = loans.filter(loan => loan.status === "approved");
  const rejectedLoans = loans.filter(loan => loan.status === "rejected");
  
  const currentRate = companyInterestRates[repaymentTerm];
  const calculatedLoan = loanAmount ? calculateLoanDetails(
    parseFloat(loanAmount) || 0,
    currentRate,
    parseInt(repaymentTerm) || 6
  ) : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-primary)" }}>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8 animate-in fade-in duration-500">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{employee?.name}</h1>
            <p className="text-lg text-muted-foreground">Salary: ${employee?.salary.toFixed(2)}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">Logout</Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8 animate-in slide-in-from-bottom duration-700">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loans.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All requests</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingLoans.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedLoans.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Successful</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedLoans.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Declined</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-lg animate-in slide-in-from-left duration-700">
            <CardHeader>
              <CardTitle>Request Loan</CardTitle>
              <CardDescription>Request a loan up to your salary amount</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestLoan} className="space-y-4">
                <div>
                  <Label htmlFor="amount">Loan Amount (Max: ${employee?.salary.toFixed(2)})</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    max={employee?.salary}
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="purpose">Loan Purpose *</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Explain why you need this loan..."
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                    className="min-h-[80px]"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="term">Repayment Term</Label>
                  <Select value={repaymentTerm} onValueChange={(value: "3" | "6" | "12") => setRepaymentTerm(value)}>
                    <SelectTrigger id="term">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 months - {companyInterestRates["3"]}% interest</SelectItem>
                      <SelectItem value="6">6 months - {companyInterestRates["6"]}% interest</SelectItem>
                      <SelectItem value="12">12 months - {companyInterestRates["12"]}% interest</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Interest rate: <span className="font-semibold">{currentRate}%</span> (set by company)
                  </p>
                </div>

                {calculatedLoan && loanAmount && (
                  <>
                    <Separator />
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                      <h4 className="font-semibold mb-2">Loan Summary</h4>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Principal Amount:</span>
                        <span className="font-medium">${parseFloat(loanAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Interest:</span>
                        <span className="font-medium">${calculatedLoan.totalInterest.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base">
                        <span className="font-semibold">Total Amount:</span>
                        <span className="font-bold">${calculatedLoan.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Payment:</span>
                        <span className="font-semibold text-primary">${calculatedLoan.monthlyPayment.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full">Submit Loan Request</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-lg animate-in slide-in-from-right duration-700">
            <CardHeader>
              <CardTitle>Loan History</CardTitle>
              <CardDescription>Your loan requests and their status ({loans.length} total)</CardDescription>
            </CardHeader>
            <CardContent>
              {loans.length > 0 ? (
                <div className="space-y-3">
                  {loans.map((loan) => (
                    <div
                      key={loan.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleViewLoan(loan)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">${loan.amount.toFixed(2)}</span>
                          <Badge
                            variant={
                              loan.status === "approved"
                                ? "default"
                                : loan.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {loan.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(loan.createdAt).toLocaleDateString()}
                          {loan.repaymentTerm && ` • ${loan.repaymentTerm} months`}
                        </p>
                        {loan.purpose && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {loan.purpose}
                          </p>
                        )}
                      </div>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No loan history yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Loan Details Dialog */}
      <LoanDetailsDialog
        loan={selectedLoan}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userRole="employee"
      />
    </div>
  );
};

export default EmployeeDashboard;