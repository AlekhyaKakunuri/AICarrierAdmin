import React, { createContext, useContext, useState, useCallback } from 'react';

interface RefreshContextType {
  refreshCustomClaims: (userId?: string) => void;
  refreshTrigger: { count: number; userId?: string };
}

const RefreshContext = createContext<RefreshContextType>({
  refreshCustomClaims: () => {},
  refreshTrigger: { count: 0 },
});

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};

interface RefreshProviderProps {
  children: React.ReactNode;
}

export const RefreshProvider: React.FC<RefreshProviderProps> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState<{ count: number; userId?: string }>({ count: 0 });

  const refreshCustomClaims = useCallback((userId?: string) => {
    console.log('🔄 Triggering custom claims refresh...', userId ? `for user: ${userId}` : 'generic');
    setRefreshTrigger(prev => ({ count: prev.count + 1, userId }));
  }, []);

  const value = {
    refreshCustomClaims,
    refreshTrigger,
  };

  return (
    <RefreshContext.Provider value={value}>
      {children}
    </RefreshContext.Provider>
  );
};
