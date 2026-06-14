<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['reception', 'unit_owner'])->default('unit_owner')->after('email');
            $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete()->after('role');
            $table->string('fcm_token')->nullable()->after('unit_id');
            $table->timestamp('last_seen_at')->nullable()->after('fcm_token');
            $table->softDeletes()->after('last_seen_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['unit_id']);
            $table->dropColumn(['role', 'unit_id', 'fcm_token', 'last_seen_at', 'deleted_at']);
        });
    }
};
