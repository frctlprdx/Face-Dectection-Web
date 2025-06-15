import React, { useRef, useState, useEffect } from 'react';
import MessageDisplay from './MessageDisplay'; // Pastikan path ini benar

interface CapturedPhoto {
  index: number;
  dataUrl: string | null;
  status: "pending" | "taken";
}

interface Message {
  text: string;
  type: "success" | "error" | "info";
}

interface WebcamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotosCaptured: (photos: CapturedPhoto[]) => void;
  currentPhotoIndex: number;
  setCurrentPhotoIndex: React.Dispatch<React.SetStateAction<number>>;
  photoInstructions: string[];
  capturedPhotos: CapturedPhoto[];
  setCapturedPhotos: React.Dispatch<React.SetStateAction<CapturedPhoto[]>>;
  setMessage: (message: Message) => void; // Diharapkan ini adalah fungsi yang di-memoize
}

const WebcamModal: React.FC<WebcamModalProps> = ({
  isOpen,
  onClose,
  onPhotosCaptured,
  currentPhotoIndex,
  setCurrentPhotoIndex,
  photoInstructions,
  capturedPhotos,
  setCapturedPhotos,
  setMessage, // Prop yang sudah di-memoize dari parent
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<Message>({ text: '', type: 'info' }); // Pesan khusus untuk modal

  // useEffect untuk mengontrol webcam berdasarkan state isOpen
  useEffect(() => {
    if (isOpen) {
      startWebcam();
      // Set pesan awal untuk modal
      setModalMessage({ text: photoInstructions[currentPhotoIndex], type: 'info' });
    } else {
      stopWebcam();
    }

    // Cleanup function: memastikan stream dimatikan saat komponen di-unmount atau modal ditutup
    return () => {
      stopWebcam();
    };
  }, [isOpen, currentPhotoIndex, photoInstructions]); // currentPhotoIndex dan photoInstructions ditambahkan sebagai dependency

  const startWebcam = async () => {
    // Pastikan tidak mencoba memulai kamera jika sudah aktif atau modal tidak terbuka
    if (isWebcamActive || !isOpen) return;

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
      setModalMessage({ text: "Tidak bisa mengakses webcam. Pastikan Anda mengizinkan akses kamera.", type: "error" });
      setIsWebcamActive(false);
      // Opsional: Tutup modal secara otomatis jika gagal akses kamera
      // onClose();
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

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && isWebcamActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        setModalMessage({ text: 'Gagal mendapatkan konteks canvas.', type: 'error' });
        return;
      }

      // Set canvas dimensions to match video feed
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      // Draw image from video onto canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const capturedImageDataUrl = canvas.toDataURL('image/jpeg', 0.9); // Kualitas 90%

      // Update capturedPhotos state
      setCapturedPhotos(prevPhotos => 
        prevPhotos.map(photo =>
          photo.index === currentPhotoIndex
            ? { ...photo, dataUrl: capturedImageDataUrl, status: "taken" }
            : photo
        )
      );

      setModalMessage({ text: `Foto ${currentPhotoIndex + 1} berhasil diambil.`, type: 'success' });
    } else {
      setModalMessage({ text: 'Kamera belum aktif atau elemen tidak siap.', type: 'error' });
    }
  };

  const handleNextPhoto = () => {
    if (currentPhotoIndex < photoInstructions.length - 1) {
      setCurrentPhotoIndex(prevIndex => prevIndex + 1);
      // Pesan instruksi baru akan di-set oleh useEffect saat currentPhotoIndex berubah
    } else {
      // Semua foto sudah diambil, panggil callback ke parent
      onPhotosCaptured(capturedPhotos);
      // setMessage({ text: 'Semua foto berhasil diambil. Silakan lengkapi data diri.', type: 'success' }); // Dihandle oleh onPhotosCaptured di parent
      onClose(); // Tutup modal
    }
  };

  // Jangan render modal jika isOpen adalah false
  if (!isOpen) return null;

  const currentPhotoTaken = capturedPhotos[currentPhotoIndex]?.status === "taken";
  const allPhotosCaptured = capturedPhotos.every(photo => photo.status === "taken");

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full flex flex-col items-center relative">
        {/* Close Button */}
        <button
          onClick={() => {
            onClose(); // Tutup modal
            setModalMessage({ text: '', type: 'info' }); // Bersihkan pesan modal saat ditutup
            setMessage({ text: 'Pendaftaran dibatalkan atau belum selesai.', type: 'info' }); // Beri tahu parent
          }}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-3xl font-bold p-1 leading-none rounded-full bg-gray-100 hover:bg-gray-200"
          aria-label="Close modal"
        >
          &times;
        </button>

        <h3 className="text-2xl font-bold text-gray-800 mb-4">Pengambilan Foto Wajah ({currentPhotoIndex + 1}/{photoInstructions.length})</h3>
        
        {isWebcamActive && (
          <p className="text-lg text-gray-700 font-medium mb-4 text-center animate-pulse">
            {photoInstructions[currentPhotoIndex]}
          </p>
        )}

        {/* Kontainer untuk webcam bulat */}
        <div className="relative w-72 h-72 rounded-full overflow-hidden bg-gray-200 border-4 border-blue-500 mb-6 flex items-center justify-center">
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

        <div className="controls flex space-x-4 mb-4">
          <button
            onClick={capturePhoto}
            disabled={!isWebcamActive || currentPhotoTaken}
            className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 ease-in-out"
          >
            {currentPhotoTaken ? "Foto Sudah Diambil" : "Ambil Foto"}
          </button>
          
          <button
            onClick={handleNextPhoto}
            disabled={!currentPhotoTaken} // Hanya bisa lanjut jika foto saat ini sudah diambil
            className={`px-6 py-2 ${currentPhotoIndex < photoInstructions.length - 1 ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'} text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 ease-in-out`}
          >
            {currentPhotoIndex < photoInstructions.length - 1 ? "Selanjutnya" : "Selesai"}
          </button>
        </div>

        <MessageDisplay text={modalMessage.text} type={modalMessage.type} />

        <div className="captured-previews flex justify-center space-x-2 mt-4 w-full">
          {capturedPhotos.map((photo) => (
            <div
              key={photo.index}
              className={`w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center border-2 ${
                photo.status === "taken" ? "border-green-500" : "border-gray-300"
              } ${
                photo.index === currentPhotoIndex ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {photo.dataUrl ? (
                <img
                  src={photo.dataUrl}
                  alt={`Photo ${photo.index + 1}`}
                  className="w-full h-full object-cover rounded-lg transform scale-x-[-1]"
                />
              ) : (
                <span className="text-gray-500 text-xs">P{photo.index + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WebcamModal;