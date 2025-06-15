import React, { useState, useCallback, useEffect } from "react";
import MessageDisplay from "../components/MessageDisplay";
import WebcamModal from "../components/WebcamModal";
import { useAuth } from "../context/AuthContext"; // <--- Tambahkan import ini
import { Link } from "react-router-dom"; // Tambahkan Link untuk navigasi jika user belum login

interface Message {
  text: string;
  type: "success" | "error" | "info";
}

interface CapturedPhoto {
  index: number;
  dataUrl: string | null;
  status: "pending" | "taken";
}

const RegisterPage: React.FC = () => {
  const [showWebcamModal, setShowWebcamModal] = useState<boolean>(false);

  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([
    { index: 0, dataUrl: null, status: "pending" },
    { index: 1, dataUrl: null, status: "pending" },
    { index: 2, dataUrl: null, status: "pending" },
  ]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);


  // Mengambil informasi pengguna dan token dari AuthContext
  const { user, token } = useAuth(); // <--- Ambil data user dan token dari context

  // Gunakan _setMessage untuk variabel internal, dan setMessage yang di-memoize
  const [message, _setMessage] = useState<Message>({
    text: "Silakan mulai pendaftaran wajah untuk mengambil foto.",
    type: "info",
  });

  // Memoize setMessage function
  const setMessage = useCallback((newMessage: Message) => {
    _setMessage(newMessage);
  }, []);

  // Pastikan ini menggunakan VITE_LARAVEL_API_URL
  const LARAVEL_REGISTER_API_URL = `${
    import.meta.env.VITE_LARAVEL_API_URL
  }/face-register`;

  const photoInstructions = [
    "Ambil foto wajah lurus.",
    "Ambil foto wajah sedikit miring ke samping.",
    "Ambil foto dengan sedikit senyum.",
  ];

  // Memoize handlePhotosCaptured function
  const handlePhotosCaptured = useCallback(
    (photos: CapturedPhoto[]) => {
      setCapturedPhotos(photos);
      setShowWebcamModal(false);
      setMessage({
        text: "Semua foto berhasil diambil. Siap untuk dikirim.",
        type: "success",
      });
    },
    [setMessage]
  );

  const resetPhotos = useCallback(() => {
    setCapturedPhotos([
      { index: 0, dataUrl: null, status: "pending" },
      { index: 1, dataUrl: null, status: "pending" },
      { index: 2, dataUrl: null, status: "pending" },
    ]);
    setCurrentPhotoIndex(0);
    setMessage({
      text: "Silakan mulai pendaftaran wajah untuk mengambil foto.",
      type: "info",
    });
  }, [setMessage]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const allPhotosTaken = capturedPhotos.every(
      (photo) => photo.dataUrl !== null
    );
    if (!allPhotosTaken) {
      setMessage({
        text: "Harap ambil ketiga foto wajah terlebih dahulu.",
        type: "error",
      });
      return;
    }

    // --- Validasi dan pengambilan data dari user context ---
    if (!user || !user.nik || !user.name) {
      setMessage({
        text: "Informasi pengguna tidak lengkap atau Anda belum login. Harap login ulang.",
        type: "error",
      });
      return;
    }
    // Tidak perlu validasi email dan phone_number karena tidak diinput di sini

    setMessage({ text: "Mengirim data pendaftaran...", type: "info" });

    try {
      const response = await fetch(LARAVEL_REGISTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`, // <--- Kirim token otentikasi
        },
        body: JSON.stringify({
          images: capturedPhotos.map((photo) => photo.dataUrl),
          name: user.name, // <--- Menggunakan nama dari user yang login
          nik: user.nik, // <--- Menggunakan NIK dari user yang login
          // Tidak lagi mengirim email dan phone_number karena tidak diinput di sini
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          text: data.message || "Pendaftaran wajah berhasil!",
          type: "success",
        });
        // Tidak perlu reset name, nik, email, phone_number state lagi
        resetPhotos(); // Panggil resetPhotos yang sudah di-memoize
      } else {
        let errorMessage =
          data.message || "Terjadi kesalahan saat pendaftaran.";
        if (data.errors) {
          errorMessage += "\n" + Object.values(data.errors).flat().join("\n");
        } else if (data.python_error) {
          errorMessage +=
            "\nPython Error: " + JSON.stringify(data.python_error);
        }
        setMessage({ text: errorMessage, type: "error" });
      }
    } catch (error) {
      console.error("Error during fetch:", error);
      setMessage({
        text: "Terjadi kesalahan jaringan atau server tidak merespons.",
        type: "error",
      });
    }
  };

  const allPhotosTaken = capturedPhotos.every(
    (photo) => photo.dataUrl !== null
  );

  // Efek untuk menampilkan pesan jika user belum login
  useEffect(() => {
    if (!user) {
      setMessage({
        text: "Anda harus login untuk mendaftarkan wajah.",
        type: "error",
      });
    }
  }, [user, setMessage]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Daftarkan Wajah Anda
        </h2>

        {user ? ( // <--- Tampilkan konten hanya jika user sudah login
          <>
            <p className="text-center text-gray-700 mb-4">
              Anda login sebagai:{" "}
              <span className="font-semibold">
                {user.name} ({user.nik})
              </span>
            </p>

            {/* Tombol untuk membuka modal kamera */}
            {!allPhotosTaken ? (
              <button
                onClick={() => {
                  resetPhotos(); // Reset foto sebelum membuka modal
                  setShowWebcamModal(true);
                }}
                className="w-full mb-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300 ease-in-out"
              >
                Mulai Ambil Foto Wajah
              </button>
            ) : (
              <div className="mb-6 text-center">
                <p className="text-green-600 font-semibold mb-2">
                  &#10003; 3 Foto Wajah Berhasil Diambil!
                </p>
                <button
                  onClick={resetPhotos} // Panggil resetPhotos yang sudah di-memoize
                  className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition duration-300 ease-in-out text-sm"
                >
                  Ulangi Pengambilan Foto
                </button>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="registration-form space-y-4"
            >
              <p className="text-gray-700 text-sm font-bold mb-2">
                Data ini akan digunakan untuk pendaftaran wajah Anda:
              </p>
              {/* MENAMPILKAN DATA DARI USER CONTEXT, TIDAK LAGI SEBAGAI INPUT */}
              <div className="form-group">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nama:
                </label>
                {/* Input disabled karena data diambil dari sesi */}
                <input
                  type="text"
                  value={user.name}
                  disabled
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div className="form-group">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  NIK:
                </label>
                {/* Input disabled karena data diambil dari sesi */}
                <input
                  type="text"
                  value={user.nik}
                  disabled
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 cursor-not-allowed"
                />
              </div>
              {/* INPUT EMAIL DAN PHONE NUMBER DIHAPUS DARI SINI */}

              <button
                type="submit"
                disabled={!allPhotosTaken} // Tombol submit hanya aktif jika foto sudah diambil
                className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 ease-in-out cursor-pointer"
              >
                Kirim Data Wajah untuk Pendaftaran
              </button>
            </form>
          </>
        ) : (
          // Jika user belum login, tampilkan pesan ini
          <p className="text-center text-red-600 font-semibold">
            Silakan{" "}
            <Link to="/" className="text-blue-600 hover:underline">
              login
            </Link>{" "}
            terlebih dahulu untuk mendaftarkan wajah Anda.
          </p>
        )}

        <MessageDisplay text={message.text} type={message.type} />
      </div>

      {/* Modal Kamera */}
      <WebcamModal
        isOpen={showWebcamModal}
        onClose={() => setShowWebcamModal(false)}
        onPhotosCaptured={handlePhotosCaptured}
        currentPhotoIndex={currentPhotoIndex}
        setCurrentPhotoIndex={setCurrentPhotoIndex}
        photoInstructions={photoInstructions}
        capturedPhotos={capturedPhotos}
        setCapturedPhotos={setCapturedPhotos}
        setMessage={setMessage}
      />
    </div>
  );
};

export default RegisterPage;
