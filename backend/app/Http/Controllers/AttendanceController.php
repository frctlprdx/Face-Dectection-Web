<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;



class AttendanceController extends Controller
{
    public function index(Request $request)
{
    $userId = $request->query('id');

    $attendance = DB::table('attendances')
        ->where('user_id', $userId)
        ->orderBy('date', 'desc')
        ->get()
        ->map(function ($item) {
            $item->date = Carbon::parse($item->date)->toDateString(); // Format: YYYY-MM-DD
            return $item;
        });

    return response()->json($attendance);
}
}
