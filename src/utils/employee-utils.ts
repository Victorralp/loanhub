import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Generates a unique employee ID in the format EMP-XXXXXX (timestamp + random)
 * @returns Promise<string> - The generated employee ID
 */
export const generateEmployeeId = async (): Promise<string> => {
  const employeesRef = collection(db, "employees");

  const createCandidate = () => {
    const source = (
      Date.now().toString(36) + Math.random().toString(36).slice(2)
    )
      .replace(/[^a-z0-9]/gi, "")
      .toUpperCase();
    const segment =
      source.length >= 7 ? source.slice(-7) : source.padEnd(7, "X");
    return `EMP-${segment}`;
  };

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = createCandidate();
    try {
      const existing = await getDocs(query(employeesRef, where("employeeId", "==", candidate)));
      if (existing.empty) {
        return candidate;
      }
    } catch (error) {
      console.error("Error checking employee ID uniqueness:", error);
      // continue attempts, fallback handled below
    }
  }

  throw new Error("Failed to generate a unique employee ID. Please try again.");
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
