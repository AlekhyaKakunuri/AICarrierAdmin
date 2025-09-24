import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);


  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // Handle Firebase configuration errors
      if (error.code === 'auth/api-key-not-valid') {
        throw new Error('Firebase configuration is not set up properly. Please check your Firebase settings.');
      }
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please allow popups and try again.');
      } else if (error.code === 'auth/api-key-not-valid') {
        throw new Error('Firebase configuration is not set up properly. Please check your Firebase settings.');
      }
      throw error;
    }
  };



  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      // Handle Firebase configuration errors
      if (error.code === 'auth/api-key-not-valid') {
        throw new Error('Firebase configuration is not set up properly. Please check your Firebase settings.');
      }
      throw error;
    }
  };


  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setLoading(false);
        setAuthInitialized(true);
      });

      return unsubscribe;
    } catch (error) {
      setLoading(false);
      setAuthInitialized(true);
    }
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    loginWithGoogle,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {authInitialized && children}
    </AuthContext.Provider>
  );
};
