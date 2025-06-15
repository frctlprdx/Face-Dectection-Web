// src/components/MessageDisplay.tsx
import React, { useState, useEffect } from 'react';

interface MessageDisplayProps {
  text: string;
  type: 'success' | 'error' | 'info';
  duration?: number; // Durasi tampilan pesan dalam ms (opsional)
  onDismiss?: () => void; // Callback jika ada tombol dismiss
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ text, type, duration, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Efek untuk mengontrol visibilitas dan durasi pesan
  useEffect(() => {
    if (text) {
      setIsVisible(true);
      if (duration) { // <<-- Ini yang memeriksa apakah prop duration diberikan
        const timer = setTimeout(() => {
          setIsVisible(false); // Mengatur isVisible menjadi false setelah durasi
          if (onDismiss) {
            onDismiss();
          }
        }, duration);
        return () => clearTimeout(timer); // Penting: Membersihkan timer
      }
    } else {
      setIsVisible(false);
    }
  }, [text, duration, onDismiss]);

  if (!isVisible) return null;

  const getClassName = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-500 text-green-800'; // Warna lebih kuat
      case 'error':
        return 'bg-red-100 border-red-500 text-red-800'; // Warna lebih kuat
      case 'info':
        return 'bg-blue-100 border-blue-500 text-blue-800'; // Warna lebih kuat
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      case 'info':
        return (
          <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`mt-4 p-4 border rounded-lg shadow-sm flex items-center ${getClassName()} transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      role="alert"
    >
      {getIcon()}
      <span className="font-medium text-sm flex-grow">{text}</span>
      {onDismiss && (
        <button
          onClick={() => setIsVisible(false)} // Langsung sembunyikan saat diklik
          className="ml-4 -mr-1.5 p-1 rounded-md inline-flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
          aria-label="Dismiss"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      )}
    </div>
  );
};

export default MessageDisplay;