import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Employee } from "../types";

type AllowedUserType = "company" | "employee" | "admin";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo: string;
  userType?: AllowedUserType; // Specify which user type can access
}

const ProtectedRoute = ({ children, redirectTo, userType }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    console.log("ProtectedRoute: Setting up auth listener for userType:", userType);
    
    // Handle employee authentication differently (localStorage-based)
    if (userType === "employee") {
      const checkEmployeeAuth = () => {
        const storedEmployee = localStorage.getItem("employee");
        if (storedEmployee) {
          try {
            const employeeData: Employee = JSON.parse(storedEmployee);
            console.log("ProtectedRoute: Employee found in localStorage:", employeeData.employeeId);
            
            // Check if employee is verified
            if (employeeData.status === "verified") {
              setIsAuthenticated(true);
              setHasAccess(true);
            } else {
              console.log("ProtectedRoute: Employee not verified, status:", employeeData.status);
              setIsAuthenticated(false);
              setHasAccess(false);
            }
          } catch (error) {
            console.error("ProtectedRoute: Error parsing employee data:", error);
            setIsAuthenticated(false);
            setHasAccess(false);
          }
        } else {
          console.log("ProtectedRoute: No employee found in localStorage");
          setIsAuthenticated(false);
          setHasAccess(false);
        }
        setLoading(false);
      };
      
      checkEmployeeAuth();
      return;
    }

    // Handle company and admin authentication with Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("ProtectedRoute: Auth state changed, user:", user ? user.uid : "null");
      
      if (!user) {
        console.log("ProtectedRoute: No user, setting not authenticated");
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // If no userType specified, allow access (backward compatibility)
      if (!userType) {
        console.log("ProtectedRoute: No userType specified, allowing access");
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Check if user exists in the correct collection
      try {
        const collectionName = userType === "company" ? "companies" : "admins";
        console.log("ProtectedRoute: Checking user in collection:", collectionName);
        const userDoc = await getDoc(doc(db, collectionName, user.uid));
        
        if (!userDoc.exists()) {
          console.log("ProtectedRoute: User document not found in", collectionName);
          setHasAccess(false);
          setLoading(false);
          return;
        }

        // For companies, check if they are approved
        if (userType === "company") {
          const companyData = userDoc.data();
          const isApproved = companyData.status === "approved";
          console.log("ProtectedRoute: Company status:", companyData.status, "Approved:", isApproved);
          setHasAccess(isApproved);
        } else {
          console.log("ProtectedRoute: User type", userType, "has access");
          setHasAccess(true);
        }
      } catch (error) {
        console.error("ProtectedRoute: Error checking user type:", error);
        setHasAccess(false);
      }

      setLoading(false);
    });

    return () => {
      console.log("ProtectedRoute: Cleaning up auth listener");
      unsubscribe();
    };
  }, [userType]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
        <div className="text-center">
          <div className="text-2xl font-semibold text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // If user is authenticated but doesn't have access to this route type
  if (!hasAccess) {
    // Redirect to appropriate dashboard based on attempted access
    const correctRoute = (() => {
      if (userType === "company") return "/employee/login";
      if (userType === "employee") return "/company/login";
      return "/";
    })();
    return <Navigate to={correctRoute} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
