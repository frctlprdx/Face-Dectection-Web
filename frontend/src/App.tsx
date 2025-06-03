// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage'; // Import komponen halaman baru
import FaceVerificationPage from './pages/FaceVerificationPage'; // Import container halaman verifikasi
import './App.css'; // Pastikan CSS diimpor

const App: React.FC = () => {
  return (
    <Router> {/* Wrapper utama untuk semua rute */}
      <div className="app-container">
        {/* Header dan Navigasi Umum (opsional, jika Anda ingin nav di setiap halaman) */}
        <header className="app-header bg-indigo-700 text-white p-4 shadow-md">
          <nav className="flex justify-between items-center max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold">Sistem Absensi Wajah</h1>
            <ul className="flex space-x-6">
              <li>
                <Link to="/" className="hover:text-indigo-200 transition duration-300">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/faceverification" className="hover:text-indigo-200 transition duration-300">
                  Verifikasi Wajah
                </Link>
              </li>
              {/* Tambahkan link lain jika ada halaman lain */}
            </ul>
          </nav>
        </header>

        {/* Konten Halaman yang akan di-render berdasarkan Rute */}
        <main className="app-main-content">
          <Routes> {/* Container untuk semua definisi rute */}
            <Route path="/" element={<HomePage />} />
            <Route path="/faceverification" element={<FaceVerificationPage />} />
            {/* Anda bisa menambahkan rute lain di sini */}
            {/* <Route path="/about" element={<AboutPage />} /> */}
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;