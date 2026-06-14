<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    private function requireReception(Request $request): ?JsonResponse
    {
        if ($request->user()->role !== 'reception') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return null;
    }

    public function index(Request $request): JsonResponse
    {
        if ($deny = $this->requireReception($request)) return $deny;

        return response()->json(['data' => Unit::with('owner')->active()->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($deny = $this->requireReception($request)) return $deny;

        $data = $request->validate([
            'unit_number' => 'required|string',
            'floor'       => 'nullable|string',
            'building'    => 'nullable|string',
            'owner_name'  => 'required|string',
            'status'      => 'in:active,inactive',
        ]);

        $unit = Unit::create($data);

        return response()->json(['data' => $unit, 'message' => 'Unit created'], 201);
    }

    public function show(Request $request, Unit $unit): JsonResponse
    {
        if ($deny = $this->requireReception($request)) return $deny;

        return response()->json(['data' => $unit->load('owner')]);
    }

    public function update(Request $request, Unit $unit): JsonResponse
    {
        if ($deny = $this->requireReception($request)) return $deny;

        $data = $request->validate([
            'unit_number' => 'sometimes|string',
            'floor'       => 'nullable|string',
            'building'    => 'nullable|string',
            'owner_name'  => 'sometimes|string',
            'status'      => 'in:active,inactive',
        ]);

        $unit->update($data);

        return response()->json(['data' => $unit, 'message' => 'Unit updated']);
    }

    public function destroy(Request $request, Unit $unit): JsonResponse
    {
        if ($deny = $this->requireReception($request)) return $deny;

        $unit->delete();

        return response()->json(['message' => 'Unit deleted']);
    }
}
