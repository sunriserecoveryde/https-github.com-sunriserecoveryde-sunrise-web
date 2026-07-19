import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StaffMember, getStaffById } from '../data/mockStaff';

interface AuthContextValue {
  currentStaff: StaffMember | null;
  isLoggedIn: boolean;
  login: (staffId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);

  const login = (staffId: string) => setCurrentStaffId(staffId);
  const logout = () => setCurrentStaffId(null);

  const currentStaff = currentStaffId ? (getStaffById(currentStaffId) ?? null) : null;

  return (
    <AuthContext.Provider value={{ currentStaff, isLoggedIn: currentStaffId !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
