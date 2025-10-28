import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Remove the conflicting auth state listener
    // The AdminDashboard will handle the navigation after successful login
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful for user:", credential.user.uid);
      
      const adminDoc = await getDoc(doc(db, "admins", credential.user.uid));
      console.log("Admin document exists:", adminDoc.exists());
      
      if (!adminDoc.exists()) {
        console.log("Admin document not found, signing out user");
        await signOut(auth);
        toast({
          title: "Access Denied",
          description: "Your account is not authorized for admin access. Please register as admin first.",
          variant: "destructive",
        });
        return;
      }

      console.log("Admin document found, navigating to dashboard");
      toast({
        title: "Welcome back",
        description: "You are now logged in as an administrator.",
      });
      
      // Navigate to dashboard - AdminDashboard will handle the rest
      navigate("/admin/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAdminAccount = async () => {
    const adminEmail = prompt("Enter admin email:");
    const adminPassword = prompt("Enter admin password:");
    const adminName = prompt("Enter admin name:");

    if (!adminEmail || !adminPassword || !adminName) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      await setDoc(doc(db, "admins", credential.user.uid), {
        name: adminName,
        email: adminEmail,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "Admin account created successfully! You can now login.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--gradient-primary)" }}
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Sign in to manage the entire platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            
            <div className="text-center">
              <Button 
                type="button" 
                variant="outline" 
                onClick={createAdminAccount}
                className="w-full"
              >
                Create Admin Account
              </Button>
            </div>
            
            <div className="text-sm text-center text-muted-foreground space-y-2">
              <p>
                Need help? <Link to="/" className="text-primary hover:underline">Contact support</Link>
              </p>
              <p>
                Don't have an admin account?{" "}
                <Link to="/admin/register" className="text-primary hover:underline">
                  Register here
                </Link>
              </p>
              <p className="text-xs">
                💡 Quick access: Press <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Shift</kbd> + <kbd className="px-1 py-0.5 text-xs bg-muted rounded">A</kbd> from anywhere
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
