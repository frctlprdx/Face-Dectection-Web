// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
// Definisikan tipe untuk informasi pengguna (sesuai dengan yang Anda simpan di Laravel)
interface UserInfo {
  id: number;
  name: string;
  email: string;
  nik: string;
  phone_number?: string;
  // Anda bisa menambahkan data lain seperti role, dll.
}

// Definisikan tipe untuk Auth Context
interface AuthContextType {
  isLoggedIn: boolean;
  user: UserInfo | null;
  token: string | null;
  login: (userData: UserInfo, userToken: string) => void;
  logout: () => void;
}

// Buat Context dengan nilai default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props untuk AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Efek untuk memeriksa token di localStorage saat aplikasi dimuat
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');

    if (storedToken && storedUser) {
      try {
        const parsedUser: UserInfo = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        // Hapus data yang rusak
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
  }, []); // Jalankan hanya sekali saat komponen pertama kali di-mount

  // Fungsi Login
  const login = (userData: UserInfo, userToken: string) => {
    localStorage.setItem('authToken', userToken);
    localStorage.setItem('authUser', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
    setIsLoggedIn(true);
  };

  // Fungsi Logout
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook untuk menggunakan Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};