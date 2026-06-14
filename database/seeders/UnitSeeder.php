<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        Unit::create(['unit_number' => '3B',  'floor' => '3',  'owner_name' => 'Maria Santos',   'status' => 'active']);
        Unit::create(['unit_number' => '7A',  'floor' => '7',  'owner_name' => 'Juan Reyes',      'status' => 'active']);
        Unit::create(['unit_number' => '12C', 'floor' => '12', 'owner_name' => 'Ana Dela Cruz',   'status' => 'active']);
    }
}
