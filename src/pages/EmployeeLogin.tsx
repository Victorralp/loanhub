import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { validateEmployeeCredentials } from "../utils/employee-utils";

const EmployeeLogin = () => {
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if employee is already logged in (stored in localStorage)
    const loggedInEmployee = localStorage.getItem("employee");
    if (loggedInEmployee) {
      navigate("/employee/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const employee = await validateEmployeeCredentials(email, employeeId);
      
      if (!employee) {
        toast({
          title: "Invalid Credentials",
          description: "Email or Employee ID is incorrect.",
          variant: "destructive",
        });
        return;
      }

      if (employee.status !== "verified") {
        toast({
          title: "Account Not Verified",
          description: "Your account is pending verification. Please contact your company admin.",
          variant: "destructive",
        });
        return;
      }

      // Store employee data in localStorage for session management
      localStorage.setItem("employee", JSON.stringify(employee));
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      navigate("/employee/dashboard");
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
          <CardTitle>Employee Login</CardTitle>
          <CardDescription>Sign in to your employee account</CardDescription>
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
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                placeholder="e.g., EMP-A1B2C3"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/employee/register" className="text-primary hover:underline">
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeLogin;
