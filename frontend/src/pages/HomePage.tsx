import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Attendance {
  id: number;
  date: string;
  attendance_time: string | null;
  status: string;
}
const HomePage: React.FC = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [attendances, setAttendances] = useState<Attendance[]>([]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const userAuth = localStorage.getItem("authUser");

    if (!userAuth) return;

    const user = JSON.parse(userAuth);
    const userId = user.id;

    const fetchAttendances = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_LARAVEL_API_URL}/attendances?id=${userId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Gagal mengambil data dari server");
        }

        const data = await response.json();
        setAttendances(data);
      } catch (error) {
        console.error("Gagal mengambil data presensi:", error);
      }
    };

    if (token) fetchAttendances();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* --- Navbar --- */}
      <nav className="bg-indigo-700 text-white p-4 shadow-md flex items-center justify-between relative z-10">
        <button
          className="p-2 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          onClick={() => setIsSidebarOpen(true)}
        >
          {/* Icon Menu */}
          <svg
            className="h-6 w-6 cursor-pointer"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <span className="text-xl font-semibold mr-auto ml-4">
          Selamat Datang, {user?.name || "Pengguna"}!
        </span>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition cursor-pointer"
        >
          Logout
        </button>
      </nav>

      {/* --- Sidebar --- */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-transparent z-20"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          <div className="fixed top-0 left-0 w-64 h-full bg-white shadow-xl z-30 transform transition-transform duration-300 ease-in-out">
            <div className="p-4 border-b flex justify-between items-center bg-indigo-700 text-white">
              <h2 className="text-2xl font-bold">Menu</h2>
              <button
                className="p-2 rounded-md hover:bg-indigo-600 focus:outline-none"
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col p-4 space-y-2">
              <Link
                to="/register-face"
                onClick={() => setIsSidebarOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Daftarkan Wajah
              </Link>
              <Link
                to="/recognize-face"
                onClick={() => setIsSidebarOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Presensi Harian
              </Link>
            </nav>
          </div>
        </>
      )}

      {/* --- Main Content --- */}
      <main className="flex-grow p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
            History Presensi
          </h2>
          <div className="space-y-4">
            {attendances.length === 0 ? (
              <p className="text-gray-600">Belum ada data presensi.</p>
            ) : (
              attendances.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex justify-between items-center"
                >
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      Tanggal:{" "}
                      {new Date(entry.date).toLocaleDateString("id-ID")}
                    </p>
                    {entry.status === "absent" ? (
                      <p className="text-gray-700">Status: Tidak Hadir</p>
                    ) : (
                      <>
                        <p className="text-gray-700">
                          Waktu Masuk:{" "}
                          {entry.attendance_time
                            ? new Date(
                                entry.attendance_time
                              ).toLocaleTimeString("id-ID")
                            : "-"}
                        </p>
                      </>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      entry.status === "present"
                        ? "bg-green-100 text-green-800"
                        : entry.status === "absent"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {entry.status === "present"
                      ? "Hadir"
                      : entry.status === "absent"
                      ? "Absen"
                      : "Pending"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
