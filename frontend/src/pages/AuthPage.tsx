// src/pages/AuthPage.tsx
import React, { useState } from 'react';
import MessageDisplay from '../components/MessageDisplay';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { useNavigate } from 'react-router-dom'; // Untuk redirect setelah login

// Interface untuk pesan
interface Message {
  text: string;
  type: 'success' | 'error' | 'info';
}

const AuthPage: React.FC = () => {
  const [formType, setFormType] = useState<'register' | 'login'>('login'); // Default ke Login
  const { login } = useAuth(); // Ambil fungsi login dari AuthContext
  const navigate = useNavigate();

  // State untuk form login
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  
  // State untuk form register
  const [registerName, setRegisterName] = useState<string>('');
  const [registerEmail, setRegisterEmail] = useState<string>('');
  const [registerPassword, setRegisterPassword] = useState<string>(''); // Password yang diinput user
  const [registerNIK, setRegisterNIK] = useState<string>(''); // NIK yang diinput user
  const [registerPhoneNumber, setRegisterPhoneNumber] = useState<string>('');

  // State untuk pesan status
  const [message, setMessage] = useState<Message>({ text: 'Silakan masuk atau daftar akun baru.', type: 'info' });

  // URL API Laravel (disesuaikan untuk Vite)
  const LARAVEL_API_URL = `${import.meta.env.VITE_LARAVEL_API_URL}`;

  // Fungsi untuk menangani Login
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage({ text: 'Memproses login...', type: 'info' });

    try {
      // Endpoint Login Laravel Anda mungkin berbeda, sesuaikan
      const response = await fetch(`${LARAVEL_API_URL}/login`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();

      if (response.ok && data.token) { // Asumsi Laravel mengembalikan 'token' dan 'user'
        setMessage({ text: data.message || 'Login berhasil!', type: 'success' });
        // Panggil fungsi login dari AuthContext
        login(data.user, data.token); // Simpan info user dan token
        navigate('/home'); // Arahkan ke halaman utama setelah login
      } else {
        setMessage({ text: data.message || 'Login gagal. Periksa kembali kredensial Anda.', type: 'error' });
      }
    } catch (error) {
      console.error('Error during login fetch:', error);
      setMessage({ text: 'Terjadi kesalahan jaringan atau server tidak merespons saat login.', type: 'error' });
    }
  };

  // Fungsi untuk menangani Register
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage({ text: 'Memproses pendaftaran...', type: 'info' });

    // Validasi dasar di frontend
    if (registerName.trim() === '' || registerEmail.trim() === '' || registerPassword.trim() === '' || registerNIK.trim() === '' || registerPhoneNumber.trim() === '') {
      setMessage({ text: 'Semua field tidak boleh kosong.', type: 'error' });
      return;
    }
    if (registerNIK.trim().length !== 16 || !/^\d+$/.test(registerNIK.trim())) {
      setMessage({ text: "NIK harus berupa 16 digit angka.", type: "error" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail.trim())) {
      setMessage({ text: "Format email tidak valid.", type: "error" });
      return;
    }

    try {
      // Endpoint register Laravel Anda mungkin berbeda, sesuaikan
      const response = await fetch(`${LARAVEL_API_URL}/register`, { // Asumsi ada endpoint /register di Laravel
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
          password_confirmation: registerPassword, // Laravel biasanya butuh ini
          nik: registerNIK,
          phone_number: registerPhoneNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: data.message || 'Pendaftaran berhasil! Silakan login.', type: 'success' });
        // Bersihkan form register dan pindah ke form login
        setRegisterName('');
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterNIK('');
        setRegisterPhoneNumber('');
        setFormType('login');
      } else {
        // Tampilkan pesan error dari Laravel, termasuk error validasi
        let errorMessage = data.message || 'Pendaftaran gagal.';
        if (data.errors) {
          errorMessage += '\n' + Object.values(data.errors).flat().join('\n');
        }
        setMessage({ text: errorMessage, type: 'error' });
      }
    } catch (error) {
      console.error('Error during register fetch:', error);
      setMessage({ text: 'Terjadi kesalahan jaringan atau server tidak merespons saat pendaftaran.', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setFormType('register')}
            className={`px-6 py-2 rounded-l-lg font-semibold transition duration-300 ${
              formType === 'register' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Daftar
          </button>
          <button
            onClick={() => setFormType('login')}
            className={`px-6 py-2 rounded-r-lg font-semibold transition duration-300 ${
              formType === 'login' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Masuk
          </button>
        </div>

        {formType === 'register' ? (
          <>
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Daftar Akun Baru</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="form-group">
                <label htmlFor="registerName" className="block text-gray-700 text-sm font-bold mb-2">Nama Lengkap:</label>
                <input type="text" id="registerName" value={registerName} onChange={(e) => setRegisterName(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"/>
              </div>
              <div className="form-group">
                <label htmlFor="registerEmail" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                <input type="email" id="registerEmail" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"/>
              </div>
              <div className="form-group">
                <label htmlFor="registerPassword" className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
                <input type="password" id="registerPassword" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"/>
              </div>
              <div className="form-group">
                <label htmlFor="registerNIK" className="block text-gray-700 text-sm font-bold mb-2">NIK (16 digit):</label>
                <input type="text" id="registerNIK" value={registerNIK} onChange={(e) => setRegisterNIK(e.target.value)} maxLength={16} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"/>
              </div>
              <div className="form-group">
                <label htmlFor="registerPhoneNumber" className="block text-gray-700 text-sm font-bold mb-2">No. Telepon:</label>
                <input type="tel" id="registerPhoneNumber" value={registerPhoneNumber} onChange={(e) => setRegisterPhoneNumber(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"/>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition duration-300 ease-in-out cursor-pointer">
                Daftar
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-600">Sudah punya akun? <span className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer" onClick={() => setFormType('login')}>Masuk di sini</span></p>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Masuk Akun</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="form-group">
                <label htmlFor="loginEmail" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                <input type="email" id="loginEmail" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"/>
              </div>
              <div className="form-group">
                <label htmlFor="loginPassword" className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
                <input type="password" id="loginPassword" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"/>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition duration-300 ease-in-out cursor-pointer">
                Masuk
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-600">Belum punya akun? <span className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer" onClick={() => setFormType('register')}>Daftar di sini</span></p>
            </div>
          </>
        )}

        <MessageDisplay text={message.text} type={message.type} />
      </div>
    </div>
  );
};

export default AuthPage; // Export as AuthPage