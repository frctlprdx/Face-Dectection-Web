// src/pages/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="home-page-container flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Selamat Datang di Sistem Absensi Wajah</h1>
      <p className="text-lg text-gray-600 text-center mb-8 max-w-xl">
        Aplikasi ini memungkinkan Anda untuk mendaftarkan wajah dan melakukan absensi menggunakan teknologi pengenalan wajah.
      </p>
      <div className="flex space-x-4">
        <Link 
          to="/faceverification" 
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
        >
          Mulai Verifikasi Wajah
        </Link>
        {/* Anda bisa menambahkan Link lain jika ada halaman lain di root */}
        {/* <Link
          to="/some-other-page"
          className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300 ease-in-out"
        >
          Halaman Lain
        </Link> */}
      </div>
    </div>
  );
};

export default HomePage;