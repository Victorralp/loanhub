import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Building2, UserCircle } from "lucide-react";

const Header = () => {
  const location = useLocation();
  
  // Check if user is on a dashboard page
  const isCompanyDashboard = location.pathname.includes("/company/dashboard");
  const isEmployeeDashboard = location.pathname.includes("/employee/dashboard");
  const isOnDashboard = isCompanyDashboard || isEmployeeDashboard;
  
  // Don't show navigation links when on dashboards (they have their own logout)
  if (isOnDashboard) {
    return (
      <header className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background backdrop-blur-md shadow-md">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-foreground hover:opacity-90 transition-all">
            <img src="/loanhub-logo.png" alt="Advance me" className="h-8 w-8" />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Advance me
            </span>
          </Link>
        </div>
      </header>
    );
  }
  
  return (
    <header className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background backdrop-blur-md shadow-md">
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-foreground hover:opacity-90 transition-all">
          <img src="/loanhub-logo.png" alt="Advance me" className="h-8 w-8" />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Advance me
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" className="gap-2 hover:bg-primary/10 transition-all" asChild>
            <Link to="/company/login">
              <Building2 className="h-4 w-4" />
              Company
            </Link>
          </Button>
          <Button variant="ghost" className="gap-2 hover:bg-primary/10 transition-all" asChild>
            <Link to="/employee/login">
              <UserCircle className="h-4 w-4" />
              Employee
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;