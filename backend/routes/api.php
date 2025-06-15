<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FaceRecognitionController;
use App\Http\Controllers\LoginRegisterController; // Import Controller Auth baru Anda

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// --- Rute Autentikasi ---
// Anda mungkin perlu membuat Auth Controller baru atau menggunakan Laravel Breeze/Fortify API routes
// Contoh sederhana:
Route::post('/register', [LoginRegisterController::class, 'register']); // Buat ini
Route::post('/login', [LoginRegisterController::class, 'login']);   // Buat ini
Route::post('/logout', [LoginRegisterController::class, 'logout'])->middleware('auth:sanctum'); // Butuh middleware auth

// --- Route untuk Face Recognition (membutuhkan autentikasi jika Anda ingin) ---
Route::post('/face-register', [FaceRecognitionController::class, 'registerFace']);
Route::post('/face-recognize', [FaceRecognitionController::class, 'recognizeFace']);
Route::get('/users', [FaceRecognitionController::class, 'getUsers']); // Pertimbangkan middleware auth jika ini data sensitif