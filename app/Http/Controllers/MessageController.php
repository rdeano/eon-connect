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
use Kreait\Firebase\Messaging\Notification;

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
                $fcmMessage = CloudMessage::withTarget('token', $receiver->fcm_token)
                    ->withNotification(Notification::create($user->name, $message->body))
                    ->withData(['unit_id' => (string) $unitId]);
                app(Messaging::class)->send($fcmMessage);
            } catch (\Throwable) {
                // FCM unreachable — message is saved, push skipped
            }
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
