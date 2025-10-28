import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";

const CompanyLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const companyDoc = await getDoc(doc(db, "companies", user.uid));
        if (companyDoc.exists()) {
          const companyData = companyDoc.data();
          if (companyData.status === "approved") {
            navigate("/company/dashboard");
          } else {
            await signOut(auth);
          }
        } else {
          await signOut(auth);
        }
      } catch (error: any) {
        console.error("Error verifying company:", error);
        await signOut(auth);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const companyDoc = await getDoc(doc(db, "companies", credential.user.uid));

      if (!companyDoc.exists()) {
        await signOut(auth);
        toast({
          title: "Access Denied",
          description: "Company account not found.",
          variant: "destructive",
        });
        return;
      }

      const companyData = companyDoc.data();
      if (companyData.status === "pending") {
        await signOut(auth);
        toast({
          title: "Account Pending",
          description: "Your company account is pending admin approval. Please wait for approval.",
          variant: "destructive",
        });
        return;
      }

      if (companyData.status === "rejected") {
        await signOut(auth);
        toast({
          title: "Account Rejected",
          description: "Your company account has been rejected. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome back",
        description: "You are now logged in to your company account.",
      });
      navigate("/company/dashboard");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--gradient-primary)" }}>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Company Login</CardTitle>
          <CardDescription>Sign in to your company account</CardDescription>
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
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/company/register" className="text-primary hover:underline">
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyLogin;