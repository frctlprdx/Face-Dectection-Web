import React, { useRef, useState, useEffect } from 'react';
import MessageDisplay from '../components/MessageDisplay';

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
  flask_error_response?: string; // Opsional, muncul jika Laravel menangkap error mentah dari Flask
  recognized_nik_from_flask?: string; // Opsional, dari kasus "Face recognized, but NIK not found"
  status_code?: number; // Opsional, dari Laravel saat ada error
}

const RecognizePage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>({ text: '', type: 'info' });
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);

  const LARAVEL_RECOGNIZE_API_URL = 'http://localhost:8000/api/face-recognize';

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsWebcamActive(true);
        };
      }
    } catch (err) {
      console.error("Error accessing webcam: ", err);
      setMessage({ text: "Tidak bisa mengakses webcam. Pastikan Anda mengizinkan akses kamera.", type: "error" });
      setIsWebcamActive(false);
    }
  };

  const captureAndRecognize = async () => {
    if (videoRef.current && canvasRef.current && isWebcamActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        setMessage({ text: 'Gagal mendapatkan konteks canvas.', type: 'error' });
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const capturedImageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImageDataUrl(capturedImageDataUrl);

      setMessage({ text: 'Mengirim foto untuk pengenalan...', type: 'info' });
      setRecognitionResult(null);

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

        // Pastikan untuk membaca JSON hanya sekali
        const data: RecognitionResult = await response.json();

        if (response.ok) { // Status 200-299 dari Laravel (success atau wajah dikenali tapi user Laravel tidak ditemukan)
            setMessage({ text: data.message, type: 'success' });
            setRecognitionResult(data);
        } else { // Status error dari Laravel (misal 404, 500)
            let errorMessage = data.message || 'Terjadi kesalahan saat pengenalan.';

            if (data.flask_error_response) { // Error komunikasi dari Laravel ke Flask
                errorMessage += `\nDetail Error (Flask mentah): ${data.flask_error_response}`;
            } else if (data.flask_response && data.flask_response.message) { // Pesan dari Flask (misal "Face not recognized")
                errorMessage += `\nFlask Pesan: ${data.flask_response.message}`;
            } else if (data.recognized_nik_from_flask) { // Case "Face recognized, but user NIK not found"
                errorMessage += `\nNIK Dikenali oleh Flask: ${data.recognized_nik_from_flask}`;
            }

            setMessage({ text: errorMessage, type: 'error' });
            setRecognitionResult(data); // Simpan data error juga untuk debugging UI
        }
      } catch (error) {
        console.error("Error during fetch:", error);
        setMessage({ text: 'Terjadi kesalahan jaringan atau server tidak merespons.', type: 'error' });
        setRecognitionResult(null); // Reset hasil jika ada error jaringan
      }
    } else {
      setMessage({ text: 'Kamera belum aktif atau elemen tidak siap.', type: 'error' });
    }
  };

  return (
    <div className="page-container">
      <h2>Pengenalan Wajah</h2>

      <video ref={videoRef} autoPlay playsInline className="webcam-feed"></video>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      <div className="controls">
        {!isWebcamActive ? (
          <button onClick={startWebcam} className="btn-start">Mulai Kamera</button>
        ) : (
          <button onClick={captureAndRecognize} className="btn-capture">Ambil & Kenali Wajah</button>
        )}
      </div>

      <MessageDisplay text={message.text} type={message.type} />

      {recognitionResult && (
        <div className="recognition-result">
          <h3>Hasil Pengenalan:</h3>
          {recognitionResult.user_data ? (
            <>
              <p><strong>Dikenali sebagai:</strong> {recognitionResult.user_data.name}</p>
              <p><strong>NIK:</strong> {recognitionResult.user_data.nik}</p>
              <p><strong>Email:</strong> {recognitionResult.user_data.email}</p>
              {recognitionResult.flask_response && (
                  <p><strong>Kepercayaan Flask:</strong> {recognitionResult.flask_response.confidence?.toFixed(2)}%</p>
              )}
            </>
          ) : (
            <p>Wajah tidak dikenali atau pengguna tidak ditemukan di database Laravel.</p>
          )}
          {recognitionResult.flask_response && (
            <p className="flask-message">Pesan dari Flask: {recognitionResult.flask_response.message}</p>
          )}
          {recognitionResult.flask_error_response && (
            <p className="flask-message">Respons Error Mentah dari Flask: {recognitionResult.flask_error_response}</p>
          )}
          {recognitionResult.recognized_nik_from_flask && (
            <p className="flask-message">NIK Dikenali oleh Flask (tidak ditemukan di Laravel): {recognitionResult.recognized_nik_from_flask}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RecognizePage;