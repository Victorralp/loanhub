// Test data utility for debugging employee verification
// This file helps create test employees for testing the company dashboard

import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const createTestEmployee = async (companyId: string) => {
  try {
    const testEmployee = {
      name: "Test Employee",
      email: "test@example.com",
      salary: 50000,
      companyId: companyId,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "employees"), testEmployee);
    console.log("Test employee created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating test employee:", error);
    throw error;
  }
};

// Usage: Call this function from browser console to create a test employee
// createTestEmployee("your-company-id-here");
