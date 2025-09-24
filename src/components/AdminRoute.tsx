import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const { isAdmin, isLoading } = useUserRole();

  // Show loading while checking user role
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  // Redirect to sign in if not admin
  if (!isAdmin) {
    return <Navigate to="/signin" replace />;
  }

  // Render admin content if user is admin
  return <>{children}</>;
};

export default AdminRoute;
