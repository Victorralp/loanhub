import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { UserRole } from "../types";
import { generateCompanyCode } from "../utils/company-utils";

const CompanyRegister = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("admin");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prevent duplicate registrations by email
      const existingCompanies = await getDocs(
        query(collection(db, "companies"), where("email", "==", email))
      );

      if (!existingCompanies.empty) {
        toast({
          title: "Email already registered",
          description: "A company with this email address already exists. Please use a different email.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const companyCode = await generateCompanyCode();
      await addDoc(collection(db, "companies"), {
        name,
        email,
        companyCode,
        balance: 0, // Initial balance set to 0, admin will update this
        interestRates: {
          "3": 1,
          "6": 1,
          "12": 1,
        },
        role,
        status: "pending", // Company needs admin approval
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: `Company registered successfully. Your Company ID is ${companyCode}`,
      });
      navigate("/company/login");
    } catch (error: any) {
      toast({
        title: "Error",
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
          <CardTitle>Company Registration</CardTitle>
          <CardDescription>
            Create your company profile. We will generate a Company ID for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (Full Access)</SelectItem>
                  <SelectItem value="manager">Manager (Approve/Reject Loans)</SelectItem>
                  <SelectItem value="hr">HR (View Employees Only)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Admin has full access to all features
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Keep your generated Company ID safe — you will need it to log in.
            </p>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/company/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyRegister;
