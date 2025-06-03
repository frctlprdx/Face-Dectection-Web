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
        Schema::create('users', function (Blueprint $table) {
            $table->id(); // id bigint unsigned, PRIMARY KEY, auto_increment

            $table->string('name'); // name varchar(255), NOT NULL

            $table->string('email')->unique(); // email varchar(255), NOT NULL, UNIQUE

            $table->string('password'); // password varchar(255), NOT NULL

            $table->string('nik')->unique(); // nik varchar(255), NOT NULL, UNIQUE

            $table->string('phone_number')->nullable(); // phone_number varchar(255), NULLABLE

            $table->rememberToken(); // remember_token varchar(100), NULLABLE
            $table->timestamps(); // created_at timestamp, updated_at timestamp, NULLABLE
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};