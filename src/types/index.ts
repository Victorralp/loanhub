// User roles for role-based access control
export type UserRole = "admin" | "hr" | "manager" | "employee";

// Interest rates by repayment term
export interface InterestRatesByTerm {
  "3": number;  // 3 months
  "6": number;  // 6 months
  "12": number; // 12 months
}

// Company interface with role support
export interface Company {
  name: string;
  email: string;
  balance: number;
  role?: UserRole; // admin, hr, manager
  defaultInterestRate?: number; // Deprecated - kept for backward compatibility
  interestRates?: InterestRatesByTerm; // Interest rates by term
}

// Employee interface
export interface Employee {
  id: string;
  name: string;
  email: string;
  salary: number;
  companyId: string;
  role?: UserRole;
}

// Loan interface with enhanced fields
export interface Loan {
  id: string;
  employeeId: string;
  employeeName?: string;
  companyId: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt?: string;
  // Feature 4: Comments/Notes
  purpose?: string;
  rejectionReason?: string;
  notes?: string;
  // Feature 5: Interest and repayment
  interestRate?: number;
  repaymentTerm?: 3 | 6 | 12; // months
  totalAmount?: number; // amount + interest
  monthlyPayment?: number;
}

// Loan comment/note interface
export interface LoanComment {
  id: string;
  loanId: string;
  userId: string;
  userRole: "company" | "employee";
  userName: string;
  comment: string;
  createdAt: string;
}

// Permission interface for role-based access
export interface Permission {
  canApproveLoan: boolean;
  canRejectLoan: boolean;
  canViewAllEmployees: boolean;
  canEditEmployees: boolean;
  canViewFinancials: boolean;
  canManageRoles: boolean;
}

// Get permissions based on role
export const getPermissions = (role?: UserRole): Permission => {
  switch (role) {
    case "admin":
      return {
        canApproveLoan: true,
        canRejectLoan: true,
        canViewAllEmployees: true,
        canEditEmployees: true,
        canViewFinancials: true,
        canManageRoles: true,
      };
    case "manager":
      return {
        canApproveLoan: true,
        canRejectLoan: true,
        canViewAllEmployees: true,
        canEditEmployees: false,
        canViewFinancials: true,
        canManageRoles: false,
      };
    case "hr":
      return {
        canApproveLoan: false,
        canRejectLoan: false,
        canViewAllEmployees: true,
        canEditEmployees: true,
        canViewFinancials: false,
        canManageRoles: false,
      };
    default:
      return {
        canApproveLoan: false,
        canRejectLoan: false,
        canViewAllEmployees: false,
        canEditEmployees: false,
        canViewFinancials: false,
        canManageRoles: false,
      };
  }
};

// Calculate loan with interest
export const calculateLoanDetails = (
  amount: number,
  interestRate: number,
  repaymentTerm: number
) => {
  const totalInterest = (amount * interestRate * repaymentTerm) / 1200; // monthly interest
  const totalAmount = amount + totalInterest;
  const monthlyPayment = totalAmount / repaymentTerm;

  return {
    totalInterest,
    totalAmount,
    monthlyPayment,
  };
};
