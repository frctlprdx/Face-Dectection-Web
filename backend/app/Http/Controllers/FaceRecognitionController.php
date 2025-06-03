<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http; // Penting untuk komunikasi HTTP
use App\Models\User; // Asumsi kamu akan menyimpan data user di tabel 'users'
use Illuminate\Support\Facades\Log; // Untuk logging
use Illuminate\Validation\ValidationException;

class FaceRecognitionController extends Controller
{
    /**
     * Mendaftarkan wajah baru ke microservice Python.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function registerFace(Request $request)
    {
        // dd($request->all()); // Baris ini bagus untuk debugging, bisa diaktifkan jika perlu

        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'nik' => 'required|string|digits:16|unique:users,nik',
                'phone_number' => 'required|string|regex:/^08[0-9]{8,12}$/', // Regex diperluas sedikit untuk fleksibilitas
                'images' => 'required|array|min:1', // Validasi bahwa 'images' adalah array dan tidak kosong
                'images.*' => 'required|string', // Validasi bahwa setiap item dalam array 'images' adalah string (base64)
            ]);
        } catch (ValidationException $e) {
            // Jika validasi gagal, kembalikan response error JSON
            return response()->json([
                'message' => 'Validation Failed',
                'errors' => $e->errors()
            ], 422);
        }

        try {
            // Mengirim array gambar ke Python Microservice
            $response = Http::timeout(60)->post(env('PYTHON_MICROSERVICE_URL') . '/register_face', [
                'images' => $request->images, // Mengirim array 'images'
                'name' => $request->name,
                'nik' => $request->nik,
                // Anda bisa menambahkan email/phone_number jika Python Microservice membutuhkannya
            ]);

            if ($response->successful()) {
                $pythonResponse = $response->json();

                // Pastikan Python Microservice mengembalikan face_embedding
                if (!isset($pythonResponse['face_embedding'])) {
                    Log::error('Python Microservice tidak mengembalikan face_embedding: ' . $response->body());
                    return response()->json([
                        'message' => 'Python Microservice gagal mengembalikan face embedding yang valid.',
                        'python_response' => $pythonResponse
                    ], 500);
                }

                // Buat user baru di database Laravel
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => bcrypt($request->nik), // Menggunakan NIK sebagai password default
                    'nik' => $request->nik,
                    'phone_number' => $request->phone_number,
                    'face_embedding' => json_encode($pythonResponse['face_embedding']), // Simpan embedding sebagai JSON string
                ]);

                return response()->json([
                    'message' => 'Wajah berhasil didaftarkan dan data user disimpan.',
                    'user_data' => $user,
                    'python_response' => $pythonResponse
                ], 200);

            } else {
                Log::error('Error dari Python Microservice (register_face): ' . $response->body());
                return response()->json([
                    'message' => 'Gagal mendaftarkan wajah ke microservice.',
                    'python_error' => $response->json()
                ], $response->status());
            }
        } catch (\Exception $e) {
            Log::error('Koneksi ke Python Microservice gagal (register_face): ' . $e->getMessage());
            return response()->json(['message' => 'Server error: Tidak dapat terhubung ke microservice.', 'error' => $e->getMessage()], 500);
        }
    }

    public function recognizeFace(Request $request)
    {
        try {
            // 1. Validasi Input
            $validatedData = $request->validate([
                'image' => 'required|string', // Base64 string dari gambar wajah untuk recognition
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation Failed',
                'errors' => $e->errors()
            ], 422);
        }

        $imageData = $validatedData['image'];

        // Hapus prefix data:image/...;base64, jika ada, seperti yang Anda lakukan untuk register
        if (str_starts_with($imageData, 'data:')) {
            $imageData = preg_replace('/^data:image\/(.*?);base64,/', '', $imageData);
        }

        try {
            // 2. Kirim Gambar ke Flask App untuk Recognition
            $response = Http::post(env('PYTHON_MICROSERVICE_URL') . '/recognize_face', [
                'image' => $imageData,
            ]);

            // 3. Tangani Response dari Flask
            if ($response->successful()) {
                $pythonResponse = $response->json();

                if (isset($pythonResponse['status']) && $pythonResponse['status'] == 'success') {
                    $recognizedNik = $pythonResponse['nik'];

                    // Cari pengguna di database Laravel berdasarkan NIK
                    $user = User::where('nik', $recognizedNik)->first();

                    if ($user) {
                        // Wajah cocok dan pengguna ditemukan di DB Laravel
                        // Di sini Anda bisa menambahkan logika absensi:
                        // Misalnya, mencatat waktu absensi di tabel absensi
                        // atau update status kehadiran pengguna.

                        return response()->json([
                            'message' => 'Face recognized successfully!',
                            'user_data' => [
                                'id' => $user->id,
                                'name' => $user->name,
                                'nik' => $user->nik,
                                'email' => $user->email,
                            ],
                            'flask_response' => $pythonResponse
                        ], 200);
                    } else {
                        // Wajah dikenali oleh Flask, tapi NIK tidak ditemukan di database Laravel
                        return response()->json([
                            'message' => 'Face recognized, but user NIK not found in Laravel database.',
                            'recognized_nik_from_flask' => $recognizedNik,
                            'flask_response' => $pythonResponse
                        ], 404);
                    }

                } else {
                    // Flask merespons dengan status 'failure' atau error
                    return response()->json([
                        'message' => 'Face not recognized by Flask app.',
                        'flask_error' => $pythonResponse['message'] ?? 'Unknown Flask recognition error'
                    ], 404); // Menggunakan 404 Not Found karena wajah tidak dikenali
                }
            } else {
                // Ada masalah komunikasi dengan Flask (misalnya, Flask error 500)
                return response()->json([
                    'message' => 'Error communicating with Flask app for recognition.',
                    'status_code' => $response->status(),
                    'flask_error_response' => $response->body()
                ], 500);
            }
        } catch (\Exception $e) {
            // Penanganan error umum (misalnya, Flask server tidak berjalan)
            return response()->json([
                'message' => 'Internal server error or Flask app connection issue during recognition: ' . $e->getMessage(),
                // 'trace' => $e->getTraceAsString() // Aktifkan ini untuk debugging lebih lanjut
            ], 500);
        }
    }

    /**
     * Mendapatkan daftar user.
     * Ini hanya contoh, mungkin perlu otentikasi/otorisasi.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUsers()
    {
        $users = User::all();
        return response()->json($users);
    }
}