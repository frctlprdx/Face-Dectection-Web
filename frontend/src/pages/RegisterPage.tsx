// src/pages/RegisterPage.tsx
import React, { useState } from "react";
import MessageDisplay from "../components/MessageDisplay";
import WebcamModal from "../components/WebcamModal";

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

  const [name, setName] = useState<string>("");
  const [nik, setNik] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [message, setMessage] = useState<Message>({ text: "Silakan mulai pendaftaran wajah untuk mengambil foto.", type: "info" }); // Initial message

  const LARAVEL_REGISTER_API_URL = `${import.meta.env.REACT_APP_LARAVEL_API_URL}/face-register`;

  const photoInstructions = [
    "Ambil foto wajah lurus.",
    "Ambil foto wajah sedikit miring ke samping.",
    "Ambil foto dengan sedikit senyum.",
  ];

  const handlePhotosCaptured = (photos: CapturedPhoto[]) => {
    setCapturedPhotos(photos);
    setShowWebcamModal(false);
    setMessage({ text: 'Semua foto berhasil diambil. Silakan lengkapi data diri.', type: 'success' });
  };

  const resetPhotos = () => {
    setCapturedPhotos([
      { index: 0, dataUrl: null, status: "pending" },
      { index: 1, dataUrl: null, status: "pending" },
      { index: 2, dataUrl: null, status: "pending" },
    ]);
    setCurrentPhotoIndex(0);
    setMessage({ text: "Silakan mulai pendaftaran wajah untuk mengambil foto.", type: "info" });
  };

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

    if (
      name.trim() === "" ||
      nik.trim() === "" ||
      email.trim() === "" ||
      phoneNumber.trim() === ""
    ) {
      setMessage({
        text: "Semua field (Nama, NIK, Email, No. Telepon) tidak boleh kosong.",
        type: "error",
      });
      return;
    }
    if (nik.trim().length !== 16 || !/^\d+$/.test(nik.trim())) {
      setMessage({ text: "NIK harus berupa 16 digit angka.", type: "error" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage({ text: "Format email tidak valid.", type: "error" });
      return;
    }

    setMessage({ text: "Mengirim data pendaftaran...", type: "info" });

    try {
      const response = await fetch(LARAVEL_REGISTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          images: capturedPhotos.map((photo) => photo.dataUrl),
          name: name,
          nik: nik,
          email: email,
          phone_number: phoneNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          text: data.message || "Pendaftaran berhasil!",
          type: "success",
        });
        setName("");
        setNik("");
        setEmail("");
        setPhoneNumber("");
        resetPhotos();
      } else {
        let errorMessage =
          data.message || "Terjadi kesalahan saat pendaftaran.";
        if (data.errors) {
          errorMessage += "\n" + Object.values(data.errors).flat().join("\n");
        } else if (data.python_error) {
          errorMessage += "\nPython Error: " + JSON.stringify(data.python_error);
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Daftar Wajah Baru
        </h2>

        {/* Tombol untuk membuka modal kamera */}
        {!allPhotosTaken ? (
          <button
            onClick={() => {
              resetPhotos(); // Reset foto sebelum membuka modal
              setShowWebcamModal(true);
            }}
            className="w-full mb-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300 ease-in-out"
          >
            Mulai Pendaftaran Wajah
          </button>
        ) : (
          <div className="mb-6 text-center">
            <p className="text-green-600 font-semibold mb-2">
              &#10003; 3 Foto Wajah Berhasil Diambil!
            </p>
            <button
              onClick={resetPhotos}
              className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition duration-300 ease-in-out text-sm"
            >
              Ulangi Pengambilan Foto
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="registration-form space-y-4">
          <div className="form-group">
            <label
              htmlFor="name"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Nama Lengkap:
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
            />
          </div>
          <div className="form-group">
            <label
              htmlFor="nik"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              NIK:
            </label>
            <input
              type="text"
              id="nik"
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              maxLength={16}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
            />
          </div>
          <div className="form-group">
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Email:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
            />
          </div>
          <div className="form-group">
            <label
              htmlFor="phoneNumber"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              No. Telepon:
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={
              !allPhotosTaken ||
              name.trim() === "" ||
              nik.trim() === "" ||
              email.trim() === "" ||
              phoneNumber.trim() === ""
            }
            className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 ease-in-out"
          >
            Daftar Wajah
          </button>
        </form>

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