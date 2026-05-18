import React, { createContext, useContext, useState } from 'react';

export type Role = 'citizen' | 'responder' | 'ops';
export type ShellState = 'S0' | 'S2' | 'S4' | 'S6';

interface AppState {
  role: Role;
  setRole: (role: Role) => void;
  drawerContent: string | null;
  setDrawerContent: (content: string | null) => void;
  shellState: ShellState;
  setShellState: (state: ShellState) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('citizen');
  const [drawerContent, setDrawerContent] = useState<string | null>(null);
  const [shellState, setShellState] = useState<ShellState>('S0');

  // Handle drawer opening syncing with shell state
  const handleSetDrawerContent = (content: string | null) => {
    setDrawerContent(content);
    if (content) {
      setShellState('S2');
    } else {
      setShellState('S0');
    }
  };

  return (
    <AppContext.Provider value={{ role, setRole, drawerContent, setDrawerContent: handleSetDrawerContent, shellState, setShellState }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
