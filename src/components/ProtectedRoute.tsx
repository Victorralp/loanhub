import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo: string;
  userType?: "company" | "employee"; // Specify which user type can access
}

const ProtectedRoute = ({ children, redirectTo, userType }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // If no userType specified, allow access (backward compatibility)
      if (!userType) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Check if user exists in the correct collection
      try {
        const collectionName = userType === "company" ? "companies" : "employees";
        const userDoc = await getDoc(doc(db, collectionName, user.uid));
        setHasAccess(userDoc.exists());
      } catch (error) {
        console.error("Error checking user type:", error);
        setHasAccess(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
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
    const correctRoute = userType === "company" ? "/employee/dashboard" : "/company/dashboard";
    return <Navigate to={correctRoute} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
