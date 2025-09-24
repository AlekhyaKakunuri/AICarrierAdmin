import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { UserRoleProvider } from "./contexts/UserRoleContext";
import SignIn from "./pages/SignIn";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/AdminRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserRoleProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                {/* Redirect root to admin dashboard */}
                <Route path="/" element={<Navigate to="/admin-dashboard" replace />} />
                
                {/* Admin Sign In */}
                <Route path="/signin" element={<SignIn />} />
                
                {/* Admin Dashboard - Protected Route */}
                <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                
                {/* Catch all route - redirect to admin dashboard */}
                <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
              </Routes>
            </div>
          </Router>
        </UserRoleProvider>
      </AuthProvider>
      <Toaster />
      <SonnerToaster />
    </QueryClientProvider>
  );
}

export default App;
