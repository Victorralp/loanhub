import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Company, Employee } from "../types";

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
    
    if (userType === "employee" || userType === "company") {
      const storageKey = userType;
      const storedData = localStorage.getItem(storageKey);

      if (storedData) {
        try {
          if (userType === "employee") {
            const employeeData: Employee = JSON.parse(storedData);
            if (employeeData.status === "verified") {
              setIsAuthenticated(true);
              setHasAccess(true);
            } else {
              console.log("ProtectedRoute: Employee not verified, status:", employeeData.status);
              setIsAuthenticated(false);
              setHasAccess(false);
            }
          } else {
            const companyData: Company = JSON.parse(storedData);
            if (companyData.status === "approved") {
              setIsAuthenticated(true);
              setHasAccess(true);
            } else {
              console.log("ProtectedRoute: Company not approved, status:", companyData.status);
              setIsAuthenticated(false);
              setHasAccess(false);
            }
          }
        } catch (error) {
          console.error("ProtectedRoute: Error parsing stored data:", error);
          setIsAuthenticated(false);
          setHasAccess(false);
        }
      } else {
        console.log(`ProtectedRoute: No ${storageKey} found in localStorage`);
        setIsAuthenticated(false);
        setHasAccess(false);
      }

      setLoading(false);
      return;
    }

    // Handle admin authentication with Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("ProtectedRoute: Auth state changed, user:", user ? user.uid : "null");
      
      if (!user) {
        console.log("ProtectedRoute: No user, setting not authenticated");
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      if (!userType) {
        console.log("ProtectedRoute: No userType specified, allowing access");
        setHasAccess(true);
        setLoading(false);
        return;
      }

      if (userType !== "admin") {
        console.log("ProtectedRoute: Non-admin user type defaults to access");
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Check if admin exists
      try {
        const userDoc = await getDoc(doc(db, "admins", user.uid));
        
        if (!userDoc.exists()) {
          console.log("ProtectedRoute: Admin document not found");
          setHasAccess(false);
          setLoading(false);
          return;
        }

        console.log("ProtectedRoute: Admin has access");
        setHasAccess(true);
      } catch (error) {
        console.error("ProtectedRoute: Error checking admin access:", error);
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
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
