// src/components/WebcamCaptureModal.tsx
import React, { useRef, useState, useEffect } from 'react';

interface WebcamCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (imageDataUrl: string) => void; // Callback untuk mengirim foto ke parent
  setMessage: (message: { text: string; type: 'success' | 'error' | 'info' }) => void;
}

const WebcamCaptureModal: React.FC<WebcamCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
  setMessage,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      startWebcam();
    } else {
      stopWebcam();
    }
    // Membersihkan stream saat komponen di-unmount
    return () => {
      stopWebcam();
    };
  }, [isOpen]); // Jalankan efek saat isOpen berubah

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsWebcamActive(true);
          setMessage({ text: "Silakan ambil foto wajah Anda untuk pengenalan.", type: "info" });
        };
      }
    } catch (err) {
      console.error("Error accessing webcam: ", err);
      setMessage({ text: "Tidak bisa mengakses webcam. Pastikan Anda mengizinkan akses kamera.", type: "error" });
      setIsWebcamActive(false);
      onClose(); // Tutup modal jika gagal akses kamera
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsWebcamActive(false);
    }
  };

  const captureAndTriggerRecognition = () => {
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
      onPhotoCaptured(capturedImageDataUrl); // Kirim foto ke parent
      onClose(); // Tutup modal setelah foto diambil
    } else {
      setMessage({ text: 'Kamera belum aktif atau elemen tidak siap.', type: 'error' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full flex flex-col items-center relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-3xl font-bold p-1 leading-none rounded-full bg-gray-100 hover:bg-gray-200"
          aria-label="Close modal"
        >
          &times;
        </button>

        <h3 className="text-2xl font-bold text-gray-800 mb-4">Pengenalan Wajah</h3>
        
        {isWebcamActive && (
          <p className="text-lg text-gray-700 font-medium mb-4 text-center animate-pulse">
            Silakan ambil foto wajah Anda.
          </p>
        )}

        {/* Kontainer untuk webcam bulat */}
        <div className="relative w-64 h-64 rounded-full overflow-hidden bg-gray-200 border-4 border-blue-500 mb-6 flex items-center justify-center">
          {!isWebcamActive && (
            <span className="text-gray-500 text-sm">Memuat kamera...</span>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover transform scale-x-[-1]" // Mirroring webcam
          ></video>
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        </div>

        <button
          onClick={captureAndTriggerRecognition}
          disabled={!isWebcamActive}
          className="px-8 py-3 bg-green-600 text-white font-semibold rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 ease-in-out"
        >
          Ambil & Kenali Wajah
        </button>
      </div>
    </div>
  );
};

export default WebcamCaptureModal;