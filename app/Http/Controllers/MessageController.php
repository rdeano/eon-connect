<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Events\MessagesRead;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;

class MessageController extends Controller
{
    public function store(Request $request, int $unitId): JsonResponse
    {
        $request->validate(['body' => 'required|string|max:2000']);

        $user = $request->user();

        $receiver = $user->role === 'reception'
            ? User::where('unit_id', $unitId)->where('role', 'unit_owner')->firstOrFail()
            : User::where('role', 'reception')->firstOrFail();

        $message = Message::create([
            'sender_id'   => $user->id,
            'receiver_id' => $receiver->id,
            'unit_id'     => $unitId,
            'body'        => $request->body,
            'status'      => 'sent',
        ]);

        try {
            broadcast(new MessageSent($message))->toOthers();
        } catch (\Throwable) {
            // Reverb unreachable — message is saved, real-time delivery skipped
        }

        if ($receiver->fcm_token) {
            try {
                $fcmMessage = CloudMessage::new()
                    ->withToken($receiver->fcm_token)
                    ->withData([
                        'unit_id' => (string) $unitId,
                        'title'   => $user->name,
                        'body'    => $message->body,
                    ]);
                app(Messaging::class)->send($fcmMessage);
                \Log::info('[FCM] push sent to user ' . $receiver->id);
            } catch (\Throwable $e) {
                \Log::error('[FCM] push failed: ' . $e->getMessage());
            }
        } else {
            \Log::warning('[FCM] receiver ' . $receiver->id . ' has no fcm_token');
        }

        return response()->json(['data' => $message->load('sender'), 'message' => 'Sent'], 201);
    }

    public function markRead(Request $request, Message $message): JsonResponse
    {
        if ($message->receiver_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $message->update([
            'status'  => 'read',
            'read_at' => now(),
        ]);

        return response()->json(['data' => $message]);
    }

    public function markAllRead(Request $request, int $unitId): JsonResponse
    {
        $updated = Message::where('unit_id', $unitId)
            ->where('receiver_id', $request->user()->id)
            ->where('status', '!=', 'read')
            ->update(['status' => 'read', 'read_at' => now()]);

        if ($updated > 0) {
            try {
                broadcast(new MessagesRead($unitId, $request->user()->id))->toOthers();
            } catch (\Throwable) {
                // Reverb unreachable — read status is saved, real-time notice skipped
            }
        }

        return response()->json(['message' => 'OK']);
    }
}
