import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserRoleContextType {
  userRole: 'admin' | 'user' | 'loading';
  isAdmin: boolean;
  isLoading: boolean;
}

const UserRoleContext = createContext<UserRoleContextType>({
  userRole: 'loading',
  isAdmin: false,
  isLoading: true,
});

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};

interface UserRoleProviderProps {
  children: ReactNode;
}

export const UserRoleProvider: React.FC<UserRoleProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState<'admin' | 'user' | 'loading'>('loading');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!currentUser) {
        setUserRole('user');
        setIsLoading(false);
        return;
      }

      try {
        // Check if user is in the admin users collection by email
        const q = query(
          collection(db, 'adminUsers'),
          where('email', '==', currentUser.email)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setUserRole('admin');
        } else {
          setUserRole('user');
        }
      } catch (error) {
        setUserRole('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, [currentUser]);

  const value: UserRoleContextType = {
    userRole,
    isAdmin: userRole === 'admin',
    isLoading,
  };

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
};
