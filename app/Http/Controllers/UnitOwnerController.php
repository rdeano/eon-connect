<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UnitOwnerController extends Controller
{
    private function requireReception(Request $request): ?JsonResponse
    {
        if ($request->user()->role !== 'reception') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return null;
    }

    public function store(Request $request, Unit $unit): JsonResponse
    {
        if ($deny = $this->requireReception($request)) return $deny;

        if ($unit->owner) {
            return response()->json(['message' => 'Unit already has an owner account'], 422);
        }

        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => 'unit_owner',
            'unit_id'  => $unit->id,
        ]);

        return response()->json(['data' => $user, 'message' => 'Owner account created'], 201);
    }

    public function update(Request $request, Unit $unit): JsonResponse
    {
        if ($deny = $this->requireReception($request)) return $deny;

        if (!$unit->owner) {
            return response()->json(['message' => 'No owner account found'], 404);
        }

        $data = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'email'    => 'sometimes|email|unique:users,email,' . $unit->owner->id,
            'password' => 'sometimes|string|min:8',
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $unit->owner->update($data);

        return response()->json(['data' => $unit->fresh('owner')->owner, 'message' => 'Owner account updated']);
    }

    public function destroy(Request $request, Unit $unit): JsonResponse
    {
        if ($deny = $this->requireReception($request)) return $deny;

        if (!$unit->owner) {
            return response()->json(['message' => 'No owner account found'], 404);
        }

        $unit->owner->delete();

        return response()->json(['message' => 'Owner account removed']);
    }
}
