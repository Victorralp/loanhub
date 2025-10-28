import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Building2, UserCircle, Shield } from "lucide-react";

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
            <img src="/loanhub-logo.png" alt="AdvanceMe" className="h-8 w-8" />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              AdvanceMe
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
          <img src="/loanhub-logo.png" alt="AdvanceMe" className="h-8 w-8" />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            AdvanceMe
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground hidden sm:flex">
            <Button variant="ghost" size="sm" className="gap-1 h-6 px-2 text-xs" asChild>
              <Link to="/admin/register">
                <Shield className="h-3 w-3" />
                Admin
              </Link>
            </Button>
            <span className="text-muted-foreground">or</span>
            <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Shift</kbd> + <kbd className="px-1 py-0.5 text-xs bg-muted rounded">A</kbd>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;