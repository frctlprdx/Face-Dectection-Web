<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginRegisterController extends Controller
{
    public function register(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email',
                'password' => 'required|string|min:8|confirmed', // 'confirmed' butuh password_confirmation
                'nik' => 'required|string|digits:16|unique:users,nik',
                'phone_number' => 'nullable|string|regex:/^08[0-9]{8,12}$/',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation Failed',
                'errors' => $e->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'nik' => $validatedData['nik'],
            'phone_number' => $validatedData['phone_number'],
        ]);

        // Opsional: Buat token untuk user yang baru terdaftar dan loginkan otomatis
        // $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully!',
            // 'access_token' => $token, // Kirim token jika langsung login
            // 'token_type' => 'Bearer',
            'user' => $user->only(['id', 'name', 'email', 'nik', 'phone_number'])
        ], 201);
    }

    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation Failed',
                'errors' => $e->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => $user->only(['id', 'name', 'email', 'nik', 'phone_number']) // Kirim data user yang relevan
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful'
        ], 200);
    }
}