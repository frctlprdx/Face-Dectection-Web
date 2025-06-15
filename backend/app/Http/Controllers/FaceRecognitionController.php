<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http; // Penting untuk komunikasi HTTP
use App\Models\User; // Asumsi kamu akan menyimpan data user di tabel 'users'
use App\Models\Attendance; // Import Attendance model
use Illuminate\Support\Facades\Log; // Untuk logging
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

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
            // Validasi input: hanya butuh name, nik, dan images.
            // Email dan phone_number tidak lagi dikirim dari frontend untuk face registration.
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'nik' => 'required|string|digits:16', // nik tidak perlu 'unique' di sini karena user sudah terdaftar
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
            // Pastikan PYTHON_MICROSERVICE_URL sudah diatur di .env Anda
            $response = Http::timeout(60)->post(env('PYTHON_MICROSERVICE_URL') . '/register_face', [
                'images' => $request->images, // Mengirim array 'images'
                'name' => $request->name,
                'nik' => $request->nik,
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

                // *** Bagian User::create() di Laravel telah dihapus dari sini ***
                // User sudah dibuat saat pendaftaran awal melalui AuthPage
                // Database face_recognition_db di Python yang bertanggung jawab menyimpan embedding.

                return response()->json([
                    'message' => 'Wajah berhasil didaftarkan ke microservice.', // Pesan disesuaikan
                    'nik' => $request->nik, // Tambahkan NIK dalam respons
                    'name' => $request->name, // Tambahkan nama dalam respons
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
            // Get the currently authenticated user from Laravel session
            $authenticatedUser = auth()->user();

            // Safety check: If authenticatedUser is null (rare if middleware works)
            if (!$authenticatedUser) {
                return response()->json(['message' => 'Unauthorized: User not found in session.'], 401);
            }

            // 1. Validate Input (Only 'image' is required from frontend)
            $validatedData = $request->validate([
                'image' => 'required|string', // Base64 string from face image for recognition
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation Failed',
                'errors' => $e->errors()
            ], 422);
        }

        $imageData = $validatedData['image'];

        // Remove data:image/...;base64, prefix if exists
        if (str_starts_with($imageData, 'data:')) {
            $imageData = preg_replace('/^data:image\/(.*?);base64,/', '', $imageData);
        }

        try {
            // 2. Send Image to Flask App for Face Recognition Processing
            $response = Http::timeout(60)->post(env('PYTHON_MICROSERVICE_URL') . '/recognize_face', [
                'image' => $imageData,
            ]);

            // 3. Handle Response from Flask Microservice
            if ($response->successful()) {
                $pythonResponse = $response->json();

                if (isset($pythonResponse['status']) && $pythonResponse['status'] == 'success') {
                    $recognizedNik = $pythonResponse['nik'];

                    // NIK matching logic
                    if ($recognizedNik === $authenticatedUser->nik) {
                        // Recognized NIK MATCHES the logged-in user's NIK
                        Log::info('Face recognized and NIK matches. User: ' . $authenticatedUser->name . ' (' . $authenticatedUser->nik . ')');
                        
                        // === ATTENDANCE RECORDING LOGIC ===
                        $today = Carbon::today()->format('Y-m-d'); // Use Carbon for today's date
                        $currentTime = Carbon::now(); // Use Carbon for current timestamp
                        
                        try {
                            // Check if attendance already exists for today
                            $existingAttendance = Attendance::where('user_id', $authenticatedUser->id)
                                ->where('date', $today)
                                ->first();

                            if ($existingAttendance) {
                                // Attendance already recorded for today
                                $attendanceMessage = "Anda sudah melakukan absensi hari ini pada " . 
                                    $existingAttendance->attendance_time->format('H:i') . 
                                    " dengan status: " . ucfirst($existingAttendance->status);
                                    
                                Log::info('Attendance already exists for user: ' . $authenticatedUser->name . ' on date: ' . $today);
                            } else {
                                // Create new attendance record
                                $attendance = new Attendance();
                                $attendance->user_id = $authenticatedUser->id;
                                $attendance->date = $today;
                                $attendance->attendance_time = $currentTime;
                                $attendance->status = 'present';
                                $attendance->save();
                                
                                $attendanceMessage = "Absensi berhasil dicatat pada " . 
                                    $currentTime->format('H:i') . 
                                    " dengan status: Present";
                                    
                                Log::info('New attendance recorded for user: ' . $authenticatedUser->name . ' at: ' . $currentTime);
                            }
                        } catch (\Exception $attendanceError) {
                            Log::error('Error recording attendance: ' . $attendanceError->getMessage());
                            Log::error('Attendance error trace: ' . $attendanceError->getTraceAsString());
                            $attendanceMessage = "Pengenalan wajah berhasil, tetapi gagal mencatat absensi. Silakan hubungi administrator.";
                        }
                        // === END ATTENDANCE RECORDING LOGIC ===
                        
                        return response()->json([
                            'message' => 'Saya kenal anda.',
                            'attendance_info' => $attendanceMessage, // Add attendance info to response
                            'user_data' => [
                                'id' => $authenticatedUser->id,
                                'name' => $authenticatedUser->name,
                                'nik' => $authenticatedUser->nik,
                                'email' => $authenticatedUser->email,
                            ],
                            'flask_response' => [
                                'confidence' => $pythonResponse['confidence'] ?? 0,
                                'message' => $pythonResponse['message'] ?? '',
                                'name' => $pythonResponse['name'] ?? '',
                                'nik' => $pythonResponse['nik'] ?? '',
                                'status' => $pythonResponse['status'] ?? ''
                            ],
                            'recognized_nik_from_flask' => $recognizedNik,
                            'authenticated_user_nik' => $authenticatedUser->nik
                        ], 200);
                    } else {
                        // Recognized NIK DOES NOT MATCH the logged-in user's NIK
                        Log::warning('Face recognized, but NIK does not match logged-in user. Recognized NIK: ' . $recognizedNik . ', Authenticated NIK: ' . $authenticatedUser->nik);
                        
                        return response()->json([
                            'message' => 'Saya tidak kenal anda. Wajah yang dikenali bukan milik pengguna yang sedang login.',
                            'recognized_nik_from_flask' => $recognizedNik,
                            'authenticated_user_nik' => $authenticatedUser->nik,
                            'flask_response' => [
                                'confidence' => $pythonResponse['confidence'] ?? 0,
                                'message' => $pythonResponse['message'] ?? '',
                                'name' => $pythonResponse['name'] ?? '',
                                'nik' => $pythonResponse['nik'] ?? '',
                                'status' => $pythonResponse['status'] ?? ''
                            ],
                        ], 403); // 403 Forbidden because NIKs don't match
                    }

                } else {
                    // Flask responded with status 'failure' (face not recognized at all by microservice)
                    $pythonError = $pythonResponse['message'] ?? 'Unknown recognition error from microservice';
                    Log::warning('Face not recognized by Flask microservice: ' . $pythonError);
                    
                    return response()->json([
                        'message' => 'Saya tidak kenal anda. Wajah tidak dapat dikenali.',
                        'python_error' => $pythonError,
                        'authenticated_user_nik' => $authenticatedUser->nik
                    ], 404); // 404 Not Found: Face not recognized
                }
            } else {
                // Communication problem with Flask (e.g., Flask error 500, no response, or network error)
                Log::error('Error communicating with Python Microservice (recognize_face) - Status: ' . $response->status() . ' - Body: ' . $response->body());
                
                return response()->json([
                    'message' => 'Error komunikasi dengan microservice.',
                    'status_code' => $response->status(),
                    'python_error' => $response->json() ?? $response->body(),
                    'authenticated_user_nik' => $authenticatedUser->nik
                ], 500);
            }
        } catch (\Exception $e) {
            // This will catch other unhandled PHP errors
            Log::error('Internal server error in Laravel (recognize_face): ' . $e->getMessage());
            Log::error('File: ' . $e->getFile() . ' on line ' . $e->getLine());
            
            return response()->json([
                'message' => 'Kesalahan server internal di Laravel.',
                'error' => $e->getMessage(),
                'authenticated_user_nik' => $authenticatedUser->nik
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