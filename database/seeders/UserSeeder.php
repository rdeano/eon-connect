<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name'     => 'Reception',
            'email'    => 'reception@eonrealty.com',
            'password' => bcrypt('password'),
            'role'     => 'reception',
        ]);

        User::create([
            'name'     => 'Maria Santos',
            'email'    => 'unit3b@eonrealty.com',
            'password' => bcrypt('password'),
            'role'     => 'unit_owner',
            'unit_id'  => 1,
        ]);

        User::create([
            'name'     => 'Juan Reyes',
            'email'    => 'unit7a@eonrealty.com',
            'password' => bcrypt('password'),
            'role'     => 'unit_owner',
            'unit_id'  => 2,
        ]);

        User::create([
            'name'     => 'Ana Dela Cruz',
            'email'    => 'unit12c@eonrealty.com',
            'password' => bcrypt('password'),
            'role'     => 'unit_owner',
            'unit_id'  => 3,
        ]);
    }
}
