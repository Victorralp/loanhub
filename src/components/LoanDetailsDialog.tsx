import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Loan } from "../types";
import { format } from "date-fns";

interface LoanDetailsDialogProps {
  loan: Loan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (loanId: string, notes?: string) => void;
  onReject?: (loanId: string, reason: string) => void;
  userRole: "company" | "employee" | "admin";
}

const LoanDetailsDialog = ({
  loan,
  open,
  onOpenChange,
  onApprove,
  onReject,
  userRole,
}: LoanDetailsDialogProps) => {
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!loan) return null;

  const handleApprove = () => {
    if (onApprove) {
      onApprove(loan.id, notes);
      setNotes("");
      onOpenChange(false);
    }
  };

  const handleReject = () => {
    if (onReject && rejectionReason.trim()) {
      onReject(loan.id, rejectionReason);
      setRejectionReason("");
      setShowRejectForm(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Loan Request Details</DialogTitle>
          <DialogDescription>
            Review the complete loan information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loan Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
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

          <Separator />

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Employee</Label>
              <p className="font-medium">{loan.employeeName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Requested Amount</Label>
              <p className="font-medium text-lg">${loan.amount.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Request Date</Label>
              <p className="font-medium">
                {format(new Date(loan.createdAt), "PPP")}
              </p>
            </div>
            {loan.updatedAt && (
              <div>
                <Label className="text-muted-foreground">Last Updated</Label>
                <p className="font-medium">
                  {format(new Date(loan.updatedAt), "PPP")}
                </p>
              </div>
            )}
          </div>

          {/* Interest and Repayment Details */}
          {loan.interestRate !== undefined && loan.repaymentTerm && (
            <>
              <Separator />
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold">Repayment Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Interest Rate</Label>
                    <p className="font-medium">{loan.interestRate}% per year</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Repayment Term</Label>
                    <p className="font-medium">{loan.repaymentTerm} months</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Amount</Label>
                    <p className="font-medium text-lg">
                      ${loan.totalAmount?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Monthly Payment</Label>
                    <p className="font-medium text-lg">
                      ${loan.monthlyPayment?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Loan Purpose */}
          {loan.purpose && (
            <>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Loan Purpose</Label>
                <p className="mt-1 text-sm bg-muted/50 p-3 rounded-md">
                  {loan.purpose}
                </p>
              </div>
            </>
          )}

          {/* Notes */}
          {loan.notes && (
            <>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Company Notes</Label>
                <p className="mt-1 text-sm bg-muted/50 p-3 rounded-md">
                  {loan.notes}
                </p>
              </div>
            </>
          )}

          {/* Rejection Reason */}
          {loan.status === "rejected" && loan.rejectionReason && (
            <>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Rejection Reason</Label>
                <p className="mt-1 text-sm bg-destructive/10 text-destructive p-3 rounded-md">
                  {loan.rejectionReason}
                </p>
              </div>
            </>
          )}

          {/* Action Buttons for Company */}
          {(userRole === "company" || userRole === "admin") && loan.status === "pending" && (
            <>
              <Separator />
              {!showRejectForm ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="notes">Add Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any internal notes about this loan..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleApprove} className="flex-1">
                      Approve Loan
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectForm(true)}
                      className="flex-1"
                    >
                      Reject Loan
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="rejection">Rejection Reason *</Label>
                    <Textarea
                      id="rejection"
                      placeholder="Please provide a reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason("");
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={!rejectionReason.trim()}
                      className="flex-1"
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoanDetailsDialog;
