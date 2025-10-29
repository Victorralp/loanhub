import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Company } from "../types";

/**
 * Generates a unique company ID in the format COMP-XXXXXX (timestamp + random)
 */
export const generateCompanyCode = async (): Promise<string> => {
  const companiesRef = collection(db, "companies");

  const createCandidate = () => {
    const source = (
      Date.now().toString(36) + Math.random().toString(36).slice(2)
    )
      .replace(/[^a-z0-9]/gi, "")
      .toUpperCase();
    const segment =
      source.length >= 7 ? source.slice(-7) : source.padEnd(7, "X");
    return `COMP-${segment}`;
  };

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = createCandidate();
    try {
      const existing = await getDocs(query(companiesRef, where("companyCode", "==", candidate)));
      if (existing.empty) {
        return candidate;
      }
    } catch (error) {
      console.error("Error checking company code uniqueness:", error);
      // try again
    }
  }

  throw new Error("Failed to generate a unique company ID. Please try again.");
};

/**
 * Validates company login credentials using email and company code.
 * Returns full company document data if found, otherwise null.
 */
export const validateCompanyCredentials = async (
  email: string,
  companyCode: string
): Promise<(Company & { id: string }) | null> => {
  try {
    const companiesRef = collection(db, "companies");
    const emailQuery = query(companiesRef, where("email", "==", email));
    const snapshot = await getDocs(emailQuery);

    const match = snapshot.docs.find((doc) => {
      const data = doc.data();
      return data.companyCode === companyCode;
    });

    if (!match) {
      return null;
    }

    const data = match.data() as Company;
    return {
      id: match.id,
      ...data,
    };
  } catch (error) {
    console.error("Error validating company credentials:", error);
    return null;
  }
};
