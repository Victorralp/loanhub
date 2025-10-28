import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { 
  Building2, 
  UserCircle, 
  TrendingUp, 
  Shield, 
  Zap, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Users,
  FileText,
  ArrowRight,
  Sparkles
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-primary)" }}>
      {/* Hero Section */}
      <section className="container px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center animate-in fade-in duration-700">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src="/loanhub-logo.png" alt="AdvanceMe" className="h-16 w-16" />
            <h1 className="text-5xl md:text-6xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              AdvanceMe
            </h1>
          </div>
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="h-3 w-3 mr-1" />
            Modern Loan Management Platform
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Streamline Your Loan Management
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Empower your organization with intelligent loan processing, flexible interest rates, and seamless employee management.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/company/register">
              <Button size="lg" className="gap-2 group">
                <Building2 className="h-5 w-5" />
                Get Started as Company
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/employee/register">
              <Button size="lg" variant="outline" className="gap-2">
                <UserCircle className="h-5 w-5" />
                Join as Employee
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t">
            <div className="animate-in slide-in-from-bottom duration-700 delay-100">
              <div className="text-3xl font-bold text-foreground">100%</div>
              <div className="text-sm text-muted-foreground">Secure</div>
            </div>
            <div className="animate-in slide-in-from-bottom duration-700 delay-200">
              <div className="text-3xl font-bold text-foreground">24/7</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="animate-in slide-in-from-bottom duration-700 delay-300">
              <div className="text-3xl font-bold text-foreground">Fast</div>
              <div className="text-sm text-muted-foreground">Processing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-in fade-in duration-700">
            <h2 className="text-3xl font-bold text-foreground mb-4">Powerful Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage loans efficiently and effectively
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-300 animate-in slide-in-from-bottom delay-100">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Role-Based Access</CardTitle>
                <CardDescription>
                  Secure permissions for Admin, Manager, and HR roles with granular access control
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-300 animate-in slide-in-from-bottom delay-200">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Flexible Interest Rates</CardTitle>
                <CardDescription>
                  Set different rates for each repayment term - 3, 6, or 12 months
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-300 animate-in slide-in-from-bottom delay-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Real-Time Calculations</CardTitle>
                <CardDescription>
                  Instant loan calculations with interest, total amount, and monthly payments
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-300 animate-in slide-in-from-bottom delay-100">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Loan Comments & Notes</CardTitle>
                <CardDescription>
                  Add purpose descriptions, rejection reasons, and internal notes for better tracking
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-300 animate-in slide-in-from-bottom delay-200">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Employee Management</CardTitle>
                <CardDescription>
                  Search, filter, and manage your team with powerful tools and insights
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-300 animate-in slide-in-from-bottom delay-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Fast Approval Process</CardTitle>
                <CardDescription>
                  Streamlined workflow for quick loan reviews and instant notifications
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-in slide-in-from-left duration-700">
              <Badge className="mb-4">For Companies</Badge>
              <h2 className="text-3xl font-bold text-foreground mb-6">Manage Loans with Confidence</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Complete Control</h3>
                    <p className="text-sm text-muted-foreground">Set your own interest rates and approval workflows</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Track Everything</h3>
                    <p className="text-sm text-muted-foreground">Monitor all loans, employees, and financial metrics in one place</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Save Time</h3>
                    <p className="text-sm text-muted-foreground">Automated calculations and smart search features</p>
                  </div>
                </div>
              </div>
              <Link to="/company/register" className="inline-block mt-6">
                <Button className="gap-2">
                  Start Managing Loans
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="animate-in slide-in-from-right duration-700">
              <Badge className="mb-4">For Employees</Badge>
              <h2 className="text-3xl font-bold text-foreground mb-6">Get Loans Quickly & Easily</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Transparent Pricing</h3>
                    <p className="text-sm text-muted-foreground">See exact costs before requesting with real-time calculations</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Flexible Terms</h3>
                    <p className="text-sm text-muted-foreground">Choose repayment terms that work for your budget</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Track Status</h3>
                    <p className="text-sm text-muted-foreground">View your loan history and status updates in real-time</p>
                  </div>
                </div>
              </div>
              <Link to="/employee/register" className="inline-block mt-6">
                <Button className="gap-2">
                  Request Your First Loan
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-2xl bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 animate-in fade-in duration-700">
            <CardContent className="p-12 text-center">
              <DollarSign className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join hundreds of companies and employees managing loans efficiently with our platform
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/company/login">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Login
                  </Button>
                </Link>
                <Link to="/employee/login">
                  <Button size="lg" variant="outline" className="gap-2">
                    <UserCircle className="h-5 w-5" />
                    Employee Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="container px-4 py-8 border-t">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/loanhub-logo.png" alt="AdvanceMe" className="h-5 w-5" />
            <span className="font-semibold text-foreground">AdvanceMe</span>
          </div>
          <p>© 2025 AdvanceMe. Built with modern technology for seamless loan processing.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;