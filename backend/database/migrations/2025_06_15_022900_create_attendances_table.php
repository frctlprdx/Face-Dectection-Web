<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id(); // id bigint unsigned, PRIMARY KEY, auto_increment
            // Foreign key ke tabel users
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('date'); // Tanggal presensi
            $table->timestamp('attendance_time')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps(); // This adds created_at and updated_at columns
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};