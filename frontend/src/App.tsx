import React, { useState } from 'react';
import RegisterPage from './pages/RegisterPage';
import RecognizePage from './pages/RecognizePage';
import './App.css'; // Pastikan CSS diimpor

type PageType = 'register' | 'recognize';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('register'); // Default ke halaman register

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Sistem Absensi Wajah</h1>
        <nav className="page-navigation">
          <button
            className={currentPage === 'register' ? 'active' : ''}
            onClick={() => setCurrentPage('register')}
          >
            Daftar Wajah
          </button>
          <button
            className={currentPage === 'recognize' ? 'active' : ''}
            onClick={() => setCurrentPage('recognize')}
          >
            Kenali Wajah
          </button>
        </nav>
      </header>

      <main className="app-main-content">
        {currentPage === 'register' ? <RegisterPage /> : <RecognizePage />}
      </main>
    </div>
  );
};

export default App;