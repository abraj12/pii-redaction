import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import api from '../services/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  organization?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  anonymousSessionId: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [anonymousSessionId, setAnonymousSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    } else {
      // Check for or create anonymous session
      let anonId = localStorage.getItem('anonymousSessionId');
      if (!anonId) {
        anonId = uuidv4();
        localStorage.setItem('anonymousSessionId', anonId);
      }
      setAnonymousSessionId(anonId);
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    
    // Create new anonymous session on logout
    const newAnonId = uuidv4();
    localStorage.setItem('anonymousSessionId', newAnonId);
    setAnonymousSessionId(newAnonId);
  };

  return (
    <AuthContext.Provider value={{ user, token, anonymousSessionId, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
