import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from './AuthContext';
import { decodeJWT, getUserRoleFromJWT, isAdminFromJWT } from '@/lib/jwtDecoder';

interface AdminAuthContextType {
  isAdmin: boolean;
  isLoading: boolean;
  userRole: string | null;
  customClaims: any | null;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAdmin: false,
  isLoading: true,
  userRole: null,
  customClaims: null,
});

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: React.ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [customClaims, setCustomClaims] = useState<any | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        setIsAdmin(false);
        setIsLoading(false);
        setUserRole(null);
        setCustomClaims(null);
        return;
      }

      try {
        // Get the ID token which contains custom claims
        const tokenResult = await currentUser.getIdTokenResult();
        const token = tokenResult.token;
        const claims = tokenResult.claims;
        
        // Decode JWT to get custom claims
        const decodedJWT = decodeJWT(token);
        const userRole = decodedJWT?.role || claims.role || 'user';
        
        setCustomClaims(claims);
        setUserRole(userRole);
        
        // Check if user has admin role from JWT
        const hasAdminRole = isAdminFromJWT(token) || userRole === 'admin';
        setIsAdmin(hasAdminRole);
        
        console.log('🔐 Admin Auth Check:', {
          userId: currentUser.uid,
          email: currentUser.email,
          role: userRole,
          isAdmin: hasAdminRole,
          decodedJWT: decodedJWT,
          claims: claims
        });
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setUserRole(null);
        setCustomClaims(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  const value = {
    isAdmin,
    isLoading,
    userRole,
    customClaims,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

