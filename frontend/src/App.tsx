// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import AuthProvider dan useAuth
import AuthPage from './pages/AuthPage'; // Import AuthPage
import HomePage from './pages/HomePage'; // Halaman tujuan setelah login
import RegisterPage from './pages/RegisterPage'; // Halaman verifikasi wajah
import RecognizePage from './pages/RecognizePage';
import ProtectedRoute from './components/ProtectedRoutes'; // Import ProtectedRoute
import './App.css'; // Pastikan CSS diimpor (minimal jika pakai Tailwind penuh)

// Main App component
const App: React.FC = () => {
  return (
    <Router>
      {/* AuthProvider membungkus seluruh aplikasi agar status login bisa diakses di mana saja */}
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

// Komponen terpisah untuk handle routing dan AuthContext agar useNavigate bisa digunakan
const AppContent: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Efek untuk mengarahkan pengguna berdasarkan status login saat aplikasi dimuat
  useEffect(() => {
    // Jika sudah login, arahkan ke /home jika saat ini di rute auth (/, /login, /register)
    if (isLoggedIn && (window.location.pathname === '/' || window.location.pathname === '/login' || window.location.pathname === '/register')) {
       navigate('/home', { replace: true });
    } 
    // Jika belum login, dan mencoba akses rute yang dilindungi, arahkan ke AuthPage
    else if (!isLoggedIn && (window.location.pathname !== '/' && window.location.pathname !== '/login' && window.location.pathname !== '/register')) {
      navigate('/', { replace: true });
    }
    // Tidak perlu melakukan apa-apa jika sudah di rute yang tepat
  }, [isLoggedIn, navigate]); // Bergantung pada status login dan fungsi navigate

  return (
    <div className="app-container">
      {/* HEADER GLOBAL TELAH DIHAPUS DARI SINI
          Karena HomePage sekarang memiliki navbarnya sendiri.
          Ini akan mencegah navbar bertumpuk. */}
      
      {/* Konten Halaman yang akan di-render berdasarkan Rute */}
      <main className="app-main-content">
        <Routes>
          {/* Rute untuk halaman otentikasi (AuthPage) - tidak dilindungi */}
          <Route path="/" element={<AuthPage />} />

          {/* Rute yang dilindungi - hanya bisa diakses jika sudah login */}
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/register-face" element={<ProtectedRoute><RegisterPage /></ProtectedRoute>} /> {/* Pendaftaran Wajah */}
          <Route path="/recognize-face" element={<ProtectedRoute><RecognizePage /></ProtectedRoute>} /> {/* Cek Wajah */}
          
          {/* Fallback untuk rute yang tidak ditemukan (misal: 404) */}
          <Route path="*" element={isLoggedIn ? <Navigate to="/home" /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

// Komponen LogoutButton juga tidak lagi di sini karena sudah dipindahkan ke HomePage.tsx

export default App;