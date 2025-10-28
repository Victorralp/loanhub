import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Employee } from "../types";

interface EmployeeAuthContextType {
  employee: Employee | null;
  login: (employee: Employee) => void;
  logout: () => void;
  isLoading: boolean;
}

const EmployeeAuthContext = createContext<EmployeeAuthContextType | undefined>(undefined);

export const useEmployeeAuth = () => {
  const context = useContext(EmployeeAuthContext);
  if (context === undefined) {
    throw new Error("useEmployeeAuth must be used within an EmployeeAuthProvider");
  }
  return context;
};

interface EmployeeAuthProviderProps {
  children: ReactNode;
}

export const EmployeeAuthProvider = ({ children }: EmployeeAuthProviderProps) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing employee session on mount
    const storedEmployee = localStorage.getItem("employee");
    if (storedEmployee) {
      try {
        const employeeData = JSON.parse(storedEmployee);
        setEmployee(employeeData);
      } catch (error) {
        console.error("Error parsing stored employee data:", error);
        localStorage.removeItem("employee");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (employeeData: Employee) => {
    setEmployee(employeeData);
    localStorage.setItem("employee", JSON.stringify(employeeData));
  };

  const logout = () => {
    setEmployee(null);
    localStorage.removeItem("employee");
  };

  const value = {
    employee,
    login,
    logout,
    isLoading,
  };

  return (
    <EmployeeAuthContext.Provider value={value}>
      {children}
    </EmployeeAuthContext.Provider>
  );
};
