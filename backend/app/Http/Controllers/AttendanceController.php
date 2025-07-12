<?php

namespace App\Http\Controllers;
use App\Models\Attendance;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index()
    {
        return response()->json(Attendance::with('user')->get());
    }
}
