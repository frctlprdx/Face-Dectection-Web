// src/pages/HomePage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import useAuth

const HomePage: React.FC = () => {
  const { user, logout } = useAuth(); // Ambil user dan fungsi logout dari context
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State untuk mengontrol sidebar

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true }); // Arahkan kembali ke halaman otentikasi setelah logout
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* --- Navbar --- */}
      <nav className="bg-indigo-700 text-white p-4 shadow-md flex items-center justify-between relative z-10">
        {/* Burger Navigation (Kiri) */}
        <button
          className="p-2 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>

        {/* Pesan Selamat Datang (Tengah) */}
        <span className="text-xl font-semibold mr-auto ml-4">
          Selamat Datang, {user?.name || "Pengguna"}!
        </span>

        {/* Tombol Logout (Kanan Atas) */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Logout
        </button>
      </nav>

      {/* --- Sidebar / Burger Menu --- */}
      {isSidebarOpen && (
        <>
          {/* Overlay (untuk menutup sidebar saat klik di luar) */}
          <div
            className="fixed inset-0 bg-transparent z-20"
            onClick={() => setIsSidebarOpen(false)}
          ></div>

          {/* Sidebar Panel */}
          <div
            className={`fixed top-0 left-0 w-64 h-full bg-white shadow-xl z-30 transform transition-transform duration-300 ease-in-out
              ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          >
            <div className="p-4 border-b flex justify-between items-center bg-indigo-700 text-white">
              <h2 className="text-2xl font-bold">Menu</h2>
              <button
                className="p-2 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
            <nav className="flex flex-col p-4 space-y-2">
              <Link
                to="/register-face" // Link ke halaman pendaftaran wajah baru
                onClick={() => setIsSidebarOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition duration-200"
              >
                Daftarkan Wajah
              </Link>
              <Link
                to="/recognize-face" // Link ke halaman presensi harian / verifikasi
                onClick={() => setIsSidebarOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition duration-200"
              >
                Presensi Harian
              </Link>
              {/* Tambahkan link lain jika diperlukan */}
            </nav>
          </div>
        </>
      )}

      {/* --- Main Content Area --- */}
      <main className="flex-grow p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
            History Presensi
          </h2>

          {/* Template untuk History Presensi (Nanti diisi dengan data sungguhan) */}
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Tanggal: 14 Juni 2025
                </p>
                <p className="text-gray-700">Waktu Masuk: 08:00 AM</p>
                <p className="text-gray-700">Waktu Keluar: 05:00 PM</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Hadir
              </span>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Tanggal: 13 Juni 2025
                </p>
                <p className="text-gray-700">Waktu Masuk: 08:05 AM</p>
                <p className="text-gray-700">Waktu Keluar: 04:55 PM</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Hadir
              </span>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Tanggal: 12 Juni 2025
                </p>
                <p className="text-gray-700">Status: Tidak Hadir</p>
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                Absen
              </span>
            </div>

            {/* Contoh lain, bisa diulang dengan map dari data */}
            {/* {attendanceHistory.map((entry, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p>Tanggal: {entry.date}</p>
                <p>Status: {entry.status}</p>
                {entry.checkIn && <p>Masuk: {entry.checkIn}</p>}
                {entry.checkOut && <p>Keluar: {entry.checkOut}</p>}
              </div>
            ))} */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
