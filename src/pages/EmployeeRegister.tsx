import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { generateEmployeeId } from "../utils/employee-utils";

interface Company {
  id: string;
  name: string;
}

const EmployeeRegister = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [salary, setSalary] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        console.log("EmployeeRegister: Loading approved companies...");
        const snapshot = await getDocs(collection(db, "companies"));
        console.log("EmployeeRegister: Found", snapshot.docs.length, "total companies");
        
        // Filter only approved companies
        const companyList = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter((company: any) => company.status === "approved")
          .map((company: any) => ({
            id: company.id,
            name: company.name
          })) as Company[];
          
        console.log("EmployeeRegister: Found", companyList.length, "approved companies");
        console.log("EmployeeRegister: Approved company list:", companyList);
        setCompanies(companyList);
        
        if (companyList.length === 0) {
          toast({
            title: "No Approved Companies",
            description: "No companies have been approved yet. Please register a company and wait for admin approval.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading companies:", error);
        toast({
          title: "Error",
          description: "Failed to load companies. Please try again.",
          variant: "destructive",
        });
      }
    };
    loadCompanies();
  }, [toast]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate unique employee ID
      const employeeId = await generateEmployeeId();
      
      // Create a unique document ID for the employee
      const employeeDocRef = doc(collection(db, "employees"));
      
      await setDoc(employeeDocRef, {
        employeeId,
        name,
        email,
        salary: parseFloat(salary),
        companyId,
        status: "pending", // Employee needs company verification
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: `Employee registered successfully! Your Employee ID is: ${employeeId}`,
      });
      
      // Show the employee ID to the user before navigating
      setTimeout(() => {
        navigate("/employee/login");
      }, 2000);
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
          <CardTitle>Employee Registration</CardTitle>
          <CardDescription>Create your employee account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
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
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Select value={companyId} onValueChange={setCompanyId} required disabled={companies.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={companies.length === 0 ? "No companies available" : "Select a company"} />
                </SelectTrigger>
                <SelectContent>
                  {companies.length === 0 ? (
                    <SelectItem value="no-companies" disabled>
                      No companies registered yet
                    </SelectItem>
                  ) : (
                    companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {companies.length === 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  No approved companies available. Companies need admin approval before employees can register.
                  <br />
                  Register a company at{" "}
                  <Link to="/company/register" className="text-primary hover:underline">
                    /company/register
                  </Link>
                  {" "}and wait for admin approval.
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading || companies.length === 0}>
              {loading ? "Registering..." : companies.length === 0 ? "No Companies Available" : "Register"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/employee/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeRegister;
