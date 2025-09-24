import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, User } from "lucide-react";
import PaymentAdmin from "@/components/PaymentAdmin";
import AdminStats from "@/components/AdminStats";
import UserPlansManagement from "@/components/UserPlansManagement";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the admin dashboard.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out.",
        variant: "destructive",
      });
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI CareerX Admin</h1>
                <p className="text-sm text-gray-500">Administration Dashboard</p>
              </div>
            </div>

            {/* User Info and Logout */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{currentUser?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
          <p className="text-gray-600">
            Manage payments, subscriptions, and platform administration
          </p>
        </div>

        {/* Real-time Stats Cards */}
        <div className="mb-8">
          <AdminStats />
        </div>

        {/* Payment Management */}
        <div className="mb-8">
          <PaymentAdmin />
        </div>

        {/* User Plans Management */}
        <div className="mb-8">
          <UserPlansManagement />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
