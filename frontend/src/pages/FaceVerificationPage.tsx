// src/pages/FaceVerificationPage.tsx
import React, { useState } from 'react';
import RegisterPage from './RegisterPage';
import RecognizePage from './RecognizePage';

type SubPageType = 'register' | 'recognize';

const FaceVerificationPage: React.FC = () => {
  const [currentSubPage, setCurrentSubPage] = useState<SubPageType>('register');

  return (
    <div className="face-verification-container min-h-screen bg-gray-100 py-10 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Verifikasi Wajah
        </h2>
        <nav className="flex justify-center mb-6 space-x-4">
          <button
            className={`px-6 py-2 rounded-lg font-semibold transition duration-300 ease-in-out ${
              currentSubPage === 'register' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setCurrentSubPage('register')}
          >
            Daftar Wajah
          </button>
          <button
            className={`px-6 py-2 rounded-lg font-semibold transition duration-300 ease-in-out ${
              currentSubPage === 'recognize' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setCurrentSubPage('recognize')}
          >
            Kenali Wajah
          </button>
        </nav>

        <div className="sub-page-content">
          {currentSubPage === 'register' ? <RegisterPage /> : <RecognizePage />}
        </div>
      </div>
    </div>
  );
};

export default FaceVerificationPage;