import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Loan } from "../types";
import { Eye, DollarSign, Calendar, Clock } from "lucide-react";

interface EmployeeLoanHistoryProps {
  employeeId: string;
  employeeName: string;
  onViewLoan?: (loan: Loan) => void;
  showActions?: boolean;
}

const EmployeeLoanHistory = ({ 
  employeeId, 
  employeeName, 
  onViewLoan,
  showActions = true 
}: EmployeeLoanHistoryProps) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmployeeLoans = async () => {
      try {
        console.log("EmployeeLoanHistory: Loading loans for employee:", employeeId);
        const q = query(
          collection(db, "loans"),
          where("employeeId", "==", employeeId)
        );
        const snapshot = await getDocs(q);
        console.log("EmployeeLoanHistory: Found", snapshot.docs.length, "loans");
        const loanList = snapshot.docs.map((loanDoc) => ({
          id: loanDoc.id,
          ...loanDoc.data(),
        })) as Loan[];
        
        // Sort by createdAt in descending order (newest first)
        loanList.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        console.log("EmployeeLoanHistory: Loan data:", loanList);
        setLoans(loanList);
      } catch (error) {
        console.error("Error loading employee loans:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployeeLoans();
  }, [employeeId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Loan History - {employeeName}
          </CardTitle>
          <CardDescription>Loading loan history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Loan History - {employeeName}
        </CardTitle>
        <CardDescription>
          {loans.length} loan{loans.length !== 1 ? 's' : ''} total
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loans.length > 0 ? (
          <div className="space-y-3">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg">${loan.amount.toFixed(2)}</span>
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
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(loan.createdAt).toLocaleDateString()}
                    </div>
                    {loan.repaymentTerm && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {loan.repaymentTerm} months
                      </div>
                    )}
                    {loan.interestRate && (
                      <span>{loan.interestRate}% interest</span>
                    )}
                  </div>
                  {loan.purpose && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {loan.purpose}
                    </p>
                  )}
                  {loan.totalAmount && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Total: ${loan.totalAmount.toFixed(2)} • Monthly: ${loan.monthlyPayment?.toFixed(2)}
                    </p>
                  )}
                </div>
                {showActions && onViewLoan && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onViewLoan(loan)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No loan history</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeLoanHistory;
