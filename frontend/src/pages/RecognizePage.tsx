// src/pages/RecognizePage.tsx
import React, { useState, useCallback, useEffect } from "react";
import MessageDisplay from "../components/MessageDisplay";
import WebcamCaptureModal from "../components/WebcamCaptureModal";
import { useNavigate } from "react-router-dom";

interface Message {
  text: string;
  type: "success" | "error" | "info";
}

interface RecognitionResult {
  message: string;
  attendance_info?: string;
  user_data?: {
    id: number;
    name: string;
    nik: string;
    email: string;
    phone_number?: string;
  };
  flask_response?: {
    confidence?: number;
    message: string;
    name?: string;
    nik?: string;
    status?: string;
  };
  python_error?: any;
  recognized_nik_from_flask?: string;
  status_code?: number;
  errors?: { [key: string]: string[] };
  authenticated_user_nik?: string;
}

const RecognizePage: React.FC = () => {
  const [showWebcamModal, setShowWebcamModal] = useState<boolean>(false);
  const [message, _setMessage] = useState<Message>({
    text: 'Tekan tombol "Mulai Pengenalan Wajah" untuk memulai.',
    type: "info",
  });
  const [recognitionResult, setRecognitionResult] =
    useState<RecognitionResult | null>(null);
  const [isRecognitionButtonDisabled, setIsRecognitionButtonDisabled] =
    useState<boolean>(true);

  const navigate = useNavigate();

  const LARAVEL_RECOGNIZE_API_URL = `${
    import.meta.env.VITE_LARAVEL_API_URL
  }/face-recognize`;

  const setMessage = useCallback((newMessage: Message) => {
    _setMessage(newMessage);
  }, []);

  // Fungsi untuk mengecek waktu dan mengatur status tombol
  const checkTimeForButtonStatus = useCallback(() => {
    const now = new Date();
    const startWindow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      9,
      0,
      0
    ); // Jam 09:00:00
    const endWindow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      16,
      0,
      0
    ); // Jam 16:00:00

    const canRecognize =
      now.getTime() >= startWindow.getTime() &&
      now.getTime() <= endWindow.getTime();

    setIsRecognitionButtonDisabled(!canRecognize);

    if (!canRecognize) {
      setMessage({
        text: "Absensi hanya dapat dilakukan antara jam 09:00 dan 16:00 WIB.",
        type: "info",
      });
    } else {
      setMessage({
        text: 'Tekan tombol "Mulai Pengenalan Wajah" untuk memulai.',
        type: "info",
      });
    }
  }, [setMessage]);

  // useEffect untuk memeriksa status login dan menjalankan checkTimeForButtonStatus
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setMessage({
        text: "Anda tidak terautentikasi. Silakan login.",
        type: "error",
      });
      navigate("/login");
      return;
    }

    checkTimeForButtonStatus();

    const intervalId = setInterval(checkTimeForButtonStatus, 60000);

    return () => clearInterval(intervalId);
  }, [checkTimeForButtonStatus, navigate]);

  // Callback yang dipanggil dari modal setelah foto diambil, di-memoize
  const handlePhotoCapturedAndRecognize = useCallback(
    async (capturedImageDataUrl: string) => {
      if (isRecognitionButtonDisabled) {
        setMessage({
          text: "Tidak dapat melakukan pengenalan. Di luar jam absensi yang diizinkan.",
          type: "error",
        });
        setShowWebcamModal(false);
        return;
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessage({
          text: "Anda tidak terautentikasi. Silakan login untuk melanjutkan.",
          type: "error",
        });
        setShowWebcamModal(false);
        navigate("/login");
        return;
      }

      setMessage({ text: "Mengirim foto untuk pengenalan...", type: "info" });
      setRecognitionResult(null);

      try {
        const response = await fetch(LARAVEL_RECOGNIZE_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            image: capturedImageDataUrl,
            // Removed authenticated_nik - backend will get this from authenticated user
          }),
        });

        const data: RecognitionResult = await response.json();

        if (response.ok) {
          const displayMessage = data.attendance_info || data.message;
          setMessage({ text: displayMessage, type: "success" });
          setRecognitionResult(data);
        } else {
          let errorMessage =
            data.message || "Terjadi kesalahan saat pengenalan.";

          if (response.status === 401) {
            errorMessage =
              "Sesi Anda telah berakhir atau Anda belum login. Silakan login kembali.";
            navigate("/login");
          } else if (response.status === 403) {
            // Handle NIK mismatch case
            errorMessage = data.message || "Wajah tidak cocok dengan pengguna yang sedang login.";
          } else if (data.errors) {
            errorMessage += "\n" + Object.values(data.errors).flat().join("\n");
          } else if (data.python_error) {
            errorMessage += `\nDetail Error (Python): ${JSON.stringify(
              data.python_error
            )}`;
          } else if (data.flask_response && data.flask_response.message) {
            errorMessage += `\nPesan dari Microservice: ${data.flask_response.message}`;
          } else if (data.recognized_nik_from_flask) {
            errorMessage += `\nNIK Dikenali oleh Microservice: ${data.recognized_nik_from_flask}`;
          }

          setMessage({ text: errorMessage, type: "error" });
          setRecognitionResult(data);
        }
      } catch (error) {
        console.error("Error during fetch:", error);
        setMessage({
          text: "Terjadi kesalahan jaringan atau server tidak merespons.",
          type: "error",
        });
        setRecognitionResult(null);
      } finally {
        setShowWebcamModal(false);
      }
    },
    [
      setMessage,
      LARAVEL_RECOGNIZE_API_URL,
      isRecognitionButtonDisabled,
      navigate,
    ]
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Pengenalan Wajah
        </h2>

        <button
          onClick={() => {
            if (!isRecognitionButtonDisabled) {
              setShowWebcamModal(true);
              setRecognitionResult(null);
              setMessage({ text: "Mulai pengenalan wajah...", type: "info" });
            }
          }}
          className={`w-full mb-6 px-6 py-3 font-semibold rounded-lg shadow-md transition duration-300 ease-in-out
            ${
              isRecognitionButtonDisabled
                ? "bg-gray-400 text-gray-700 cursor-not-allowed opacity-70"
                : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
            }`}
          disabled={isRecognitionButtonDisabled}
        >
          Mulai Pengenalan Wajah
        </button>

        <MessageDisplay text={message.text} type={message.type} />

        {recognitionResult && (
          <div className="recognition-result mt-6 p-4 border rounded-lg shadow-sm text-left">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              Hasil Pengenalan:
            </h3>
            {recognitionResult.user_data ? (
              <>
                <p className="text-gray-800 mb-1">
                  <strong>Dikenali sebagai:</strong>{" "}
                  {recognitionResult.user_data.name}
                </p>
                <p className="text-gray-800 mb-1">
                  <strong>NIK:</strong> {recognitionResult.user_data.nik}
                </p>
                <p className="text-gray-800 mb-1">
                  <strong>Email:</strong> {recognitionResult.user_data.email}
                </p>
                {recognitionResult.flask_response &&
                  typeof recognitionResult.flask_response.confidence ===
                    "number" && (
                    <p className="text-gray-800">
                      <strong>Kepercayaan:</strong>{" "}
                      {recognitionResult.flask_response.confidence.toFixed(2)}%
                    </p>
                  )}
                {recognitionResult.attendance_info && (
                  <p
                    className={`mt-2 font-medium ${
                      message.type === "success"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <strong>Info Absensi:</strong>{" "}
                    {recognitionResult.attendance_info}
                  </p>
                )}
                {/* Menambahkan tampilan NIK dari user yang login jika ada */}
                {recognitionResult.authenticated_user_nik && (
                  <p className="text-gray-600 text-sm mt-2 border-t pt-2">
                    NIK Anda saat login:{" "}
                    {recognitionResult.authenticated_user_nik}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-red-600 font-medium">
                  {recognitionResult.message || "Wajah tidak dikenali atau pengguna tidak ditemukan di database Laravel."}
                </p>
                {/* Show debug information for NIK mismatch */}
                {recognitionResult.recognized_nik_from_flask && (
                  <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                    <p className="text-yellow-700 text-sm">
                      <strong>Info Debug:</strong>
                    </p>
                    <p className="text-yellow-600 text-sm">
                      NIK yang dikenali microservice: {recognitionResult.recognized_nik_from_flask}
                    </p>
                    {recognitionResult.authenticated_user_nik && (
                      <p className="text-yellow-600 text-sm">
                        NIK pengguna yang login: {recognitionResult.authenticated_user_nik}
                      </p>
                    )}
                    <p className="text-yellow-600 text-sm mt-1">
                      Wajah dikenali tetapi bukan milik pengguna yang sedang login.
                    </p>
                  </div>
                )}
              </>
            )}
            {recognitionResult.flask_response &&
              recognitionResult.flask_response.message && (
                <p className="text-gray-600 text-sm mt-2 border-t pt-2">
                  Pesan dari Microservice:{" "}
                  {recognitionResult.flask_response.message}
                </p>
              )}
            {recognitionResult.python_error && (
              <p className="text-red-500 text-sm mt-2 border-t pt-2">
                Error Detail: {JSON.stringify(recognitionResult.python_error)}
              </p>
            )}
          </div>
        )}
      </div>

      <WebcamCaptureModal
        isOpen={showWebcamModal}
        onClose={() => setShowWebcamModal(false)}
        onPhotoCaptured={handlePhotoCapturedAndRecognize}
        setMessage={setMessage}
      />
    </div>
  );
};

export default RecognizePage;