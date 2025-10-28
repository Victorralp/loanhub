import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Generates a unique employee ID in the format EMP001, EMP002, etc.
 * @returns Promise<string> - The generated employee ID
 */
export const generateEmployeeId = async (): Promise<string> => {
  try {
    // Get all employees ordered by employeeId descending to find the highest number
    const employeesRef = collection(db, "employees");
    const q = query(employeesRef, orderBy("employeeId", "desc"), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // No employees exist yet, start with EMP001
      return "EMP001";
    }
    
    const lastEmployee = snapshot.docs[0].data();
    const lastEmployeeId = lastEmployee.employeeId;
    
    // Extract the number from the last employee ID
    const match = lastEmployeeId.match(/EMP(\d+)/);
    if (match) {
      const lastNumber = parseInt(match[1], 10);
      const nextNumber = lastNumber + 1;
      return `EMP${nextNumber.toString().padStart(3, '0')}`;
    }
    
    // If format doesn't match, start fresh
    return "EMP001";
  } catch (error) {
    console.error("Error generating employee ID:", error);
    // Fallback to timestamp-based ID if there's an error
    const timestamp = Date.now().toString().slice(-6);
    return `EMP${timestamp}`;
  }
};

/**
 * Validates employee login credentials
 * @param email - Employee email
 * @param employeeId - Employee ID
 * @returns Promise<Employee | null> - Employee data if valid, null if invalid
 */
export const validateEmployeeCredentials = async (
  email: string, 
  employeeId: string
): Promise<any | null> => {
  try {
    const employeesRef = collection(db, "employees");
    const snapshot = await getDocs(employeesRef);
    
    const employee = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.email === email && data.employeeId === employeeId;
    });
    
    if (employee) {
      return {
        id: employee.id,
        ...employee.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error validating employee credentials:", error);
    return null;
  }
};
