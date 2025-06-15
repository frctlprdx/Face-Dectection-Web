<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FaceRecognitionController;
use App\Http\Controllers\LoginRegisterController; // Pastikan namespace sesuai lokasi controller Anda
// ===============================

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Rute untuk mendapatkan user yang sedang login (ini sudah benar dilindungi)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// --- Rute Autentikasi (Tidak memerlukan token untuk diakses) ---
Route::post('/register', [LoginRegisterController::class, 'register']);
Route::post('/login', [LoginRegisterController::class, 'login']);

// --- Rute yang Membutuhkan Autentikasi (dilindungi oleh Sanctum) ---
Route::middleware('auth:sanctum')->group(function () {
    // Rute Logout (membutuhkan autentikasi untuk melogout user saat ini)
    Route::post('/logout', [LoginRegisterController::class, 'logout']);

    // Route untuk Face Recognition (MEMBUTUHKAN AUTENTIKASI)
    Route::post('/face-register', [FaceRecognitionController::class, 'registerFace']);
    Route::post('/face-recognize', [FaceRecognitionController::class, 'recognizeFace']);

    // Rute untuk mendapatkan daftar user (pertimbangkan apakah ini harus dilindungi atau tidak)
    Route::get('/users', [FaceRecognitionController::class, 'getUsers']);
});