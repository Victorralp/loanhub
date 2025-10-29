import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { validateCompanyCredentials } from "../utils/company-utils";
import { Company } from "../types";

const CompanyLogin = () => {
  const [email, setEmail] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const storedCompany = localStorage.getItem("company");
    if (storedCompany) {
      navigate("/company/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const company = await validateCompanyCredentials(email, companyCode.toUpperCase());

      if (!company) {
        toast({
          title: "Access Denied",
          description: "Company account not found. Please check your email and company ID.",
          variant: "destructive",
        });
        return;
      }

      // Refresh company data to ensure latest status
      const companyDoc = await getDoc(doc(db, "companies", company.id));
      const companyData: Company = companyDoc.exists()
        ? (companyDoc.data() as Company)
        : company;

      if (companyData.status === "pending") {
        toast({
          title: "Account Pending",
          description: "Your company account is pending admin approval. Please wait for approval.",
          variant: "destructive",
        });
        return;
      }

      if (companyData.status === "rejected") {
        toast({
          title: "Account Rejected",
          description: "Your company account has been rejected. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      const session = {
        id: company.id,
        ...companyData,
      };
      localStorage.setItem("company", JSON.stringify(session));

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
          <CardDescription>Sign in with your email and Company ID</CardDescription>
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
              <Label htmlFor="companyCode">Company ID</Label>
              <Input
                id="companyCode"
                type="text"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                placeholder="e.g., COMP-A1B2C3"
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
