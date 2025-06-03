// src/pages/RecognizePage.tsx
import React, { useState } from 'react';
import MessageDisplay from '../components/MessageDisplay';
import WebcamCaptureModal from '../components/WebcamCaptureModal'; // Import modal baru

interface Message {
  text: string;
  type: 'success' | 'error' | 'info';
}

// PERBARUI INTERFACE RecognitionResult
interface RecognitionResult {
  message: string;
  user_data?: { // Opsional, mungkin tidak ada jika tidak dikenali atau user Laravel tidak ditemukan
    id: number;
    name: string;
    nik: string;
    email: string;
  };
  flask_response?: { // Opsional, mungkin tidak ada jika ada error komunikasi dengan Flask
    confidence: number;
    message: string;
    name: string;
    nik: string;
    status: string;
  };
  python_error?: any; // Mengganti flask_error_response, karena microservice Python mengirim 'python_error'
  recognized_nik_from_flask?: string; // Opsional, dari kasus "Face recognized, but NIK not found"
  status_code?: number; // Opsional, dari Laravel saat ada error
}

const RecognizePage: React.FC = () => {
  const [showWebcamModal, setShowWebcamModal] = useState<boolean>(false);
  const [message, setMessage] = useState<Message>({ text: 'Tekan tombol "Mulai Pengenalan Wajah" untuk memulai.', type: 'info' });
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);

  // Menggunakan environment variable untuk URL API
  const LARAVEL_RECOGNIZE_API_URL = `${import.meta.env.REACT_APP_LARAVEL_API_URL}/face-recognize`;

  // Callback yang dipanggil dari modal setelah foto diambil
  const handlePhotoCapturedAndRecognize = async (capturedImageDataUrl: string) => {
    setMessage({ text: 'Mengirim foto untuk pengenalan...', type: 'info' });
    setRecognitionResult(null); // Reset hasil sebelumnya

    try {
      const response = await fetch(LARAVEL_RECOGNIZE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          image: capturedImageDataUrl,
        }),
      });

      const data: RecognitionResult = await response.json();

      if (response.ok) { // Status 200-299 dari Laravel
          setMessage({ text: data.message, type: 'success' });
          setRecognitionResult(data);
      } else { // Status error dari Laravel (misal 404, 500)
          let errorMessage = data.message || 'Terjadi kesalahan saat pengenalan.';

          // Menyesuaikan penanganan error berdasarkan respons dari Laravel
          if (data.python_error) { // Error dari Python Microservice (diteruskan oleh Laravel)
              errorMessage += `\nDetail Error (Python): ${JSON.stringify(data.python_error)}`;
          } else if (data.flask_response && data.flask_response.message) { // Pesan dari Flask (misal "Face not recognized")
              errorMessage += `\nPesan dari Microservice: ${data.flask_response.message}`;
          } else if (data.recognized_nik_from_flask) { // Kasus "Face recognized, but user NIK not found"
              errorMessage += `\nNIK Dikenali oleh Microservice: ${data.recognized_nik_from_flask}`;
          }

          setMessage({ text: errorMessage, type: 'error' });
          setRecognitionResult(data); // Simpan data error juga untuk debugging UI
      }
    } catch (error) {
      console.error("Error during fetch:", error);
      setMessage({ text: 'Terjadi kesalahan jaringan atau server tidak merespons.', type: 'error' });
      setRecognitionResult(null); // Reset hasil jika ada error jaringan
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Pengenalan Wajah
        </h2>

        {/* Tombol untuk membuka modal kamera */}
        <button
          onClick={() => {
            setShowWebcamModal(true);
            setRecognitionResult(null); // Reset hasil saat membuka modal baru
            setMessage({ text: 'Mulai pengenalan wajah...', type: 'info' });
          }}
          className="w-full mb-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300 ease-in-out"
        >
          Mulai Pengenalan Wajah
        </button>

        <MessageDisplay text={message.text} type={message.type} />

        {recognitionResult && (
          <div className="recognition-result mt-6 p-4 border rounded-lg shadow-sm text-left">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Hasil Pengenalan:</h3>
            {recognitionResult.user_data ? (
              <>
                <p className="text-gray-800 mb-1"><strong>Dikenali sebagai:</strong> {recognitionResult.user_data.name}</p>
                <p className="text-gray-800 mb-1"><strong>NIK:</strong> {recognitionResult.user_data.nik}</p>
                <p className="text-gray-800 mb-1"><strong>Email:</strong> {recognitionResult.user_data.email}</p>
                {recognitionResult.flask_response && (
                    <p className="text-gray-800"><strong>Kepercayaan:</strong> {recognitionResult.flask_response.confidence?.toFixed(2)}%</p>
                )}
              </>
            ) : (
              <p className="text-red-600 font-medium">Wajah tidak dikenali atau pengguna tidak ditemukan di database Laravel.</p>
            )}
            {recognitionResult.flask_response && recognitionResult.flask_response.message && (
              <p className="text-gray-600 text-sm mt-2 border-t pt-2">Pesan dari Microservice: {recognitionResult.flask_response.message}</p>
            )}
            {recognitionResult.python_error && (
              <p className="text-red-500 text-sm mt-2 border-t pt-2">Error Detail: {JSON.stringify(recognitionResult.python_error)}</p>
            )}
            {recognitionResult.recognized_nik_from_flask && (
              <p className="text-orange-500 text-sm mt-2 border-t pt-2">NIK Dikenali oleh Microservice (tidak ditemukan di Laravel): {recognitionResult.recognized_nik_from_flask}</p>
            )}
          </div>
        )}
      </div>

      {/* Modal Kamera untuk Pengenalan */}
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