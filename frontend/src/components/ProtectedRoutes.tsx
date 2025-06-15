// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ambil useAuth

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn } = useAuth(); // Ambil status login dari context

  if (!isLoggedIn) {
    // Jika tidak login, arahkan ke halaman otentikasi
    return <Navigate to="/" replace />; // Arahkan ke AuthPage (root)
  }

  return <>{children}</>; // Tampilkan komponen anak jika sudah login
};

export default ProtectedRoute;