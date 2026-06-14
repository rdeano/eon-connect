<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'reception') {
            $units = Unit::with(['owner', 'messages' => function ($q) {
                $q->latest()->limit(1);
            }])
            ->withCount(['messages as unread_count' => function ($q) {
                $q->where('status', '!=', 'read')
                  ->where('receiver_id', auth()->id());
            }])
            ->active()
            ->get();

            return response()->json(['data' => $units]);
        }

        $messages = Message::where('unit_id', $user->unit_id)
            ->with('sender')
            ->orderBy('created_at')
            ->get();

        return response()->json(['data' => $messages]);
    }

    public function show(Request $request, int $unitId): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'reception' && $user->unit_id !== $unitId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $messages = Message::where('unit_id', $unitId)
            ->with('sender')
            ->orderBy('created_at')
            ->get();

        return response()->json(['data' => $messages]);
    }
}
