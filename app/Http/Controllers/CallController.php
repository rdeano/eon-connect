<?php

namespace App\Http\Controllers;

use App\Events\CallEnded;
use App\Events\CallInvited;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;

class CallController extends Controller
{
    /**
     * Generates a LiveKit access token (standard HS256 JWT).
     * No extra SDK needed — kreait/laravel-firebase already pulls in the JWT primitives
     * and LiveKit tokens are plain signed JWTs with an "video" claim.
     */
    private function livekitToken(string $identity, string $displayName, string $roomName): string
    {
        $key    = config('services.livekit.key');
        $secret = config('services.livekit.secret');
        $now    = time();

        $b64 = fn($v) => rtrim(strtr(base64_encode(is_string($v) ? $v : json_encode($v)), '+/', '-_'), '=');

        $header  = $b64(['alg' => 'HS256', 'typ' => 'JWT']);
        $payload = $b64([
            'iss'   => $key,
            'sub'   => $identity,
            'iat'   => $now,
            'exp'   => $now + 3600,
            'name'  => $displayName,
            'video' => ['roomJoin' => true, 'room' => $roomName],
        ]);

        $sig = $b64(hash_hmac('sha256', "{$header}.{$payload}", $secret, true));

        return "{$header}.{$payload}.{$sig}";
    }

    /** Issue a LiveKit room token for the authenticated user. */
    public function token(Request $request): JsonResponse
    {
        $request->validate(['unit_id' => 'required|integer']);

        $user  = $request->user();
        $room  = 'call_' . $request->unit_id;
        $token = $this->livekitToken('user_' . $user->id, $user->name, $room);

        return response()->json([
            'room'        => $room,
            'token'       => $token,
            'livekit_url' => config('services.livekit.url'),
        ]);
    }

    /** Notify the other party of an incoming call via FCM + Reverb. */
    public function invite(Request $request): JsonResponse
    {
        $request->validate(['unit_id' => 'required|integer']);

        $user   = $request->user();
        $unitId = $request->unit_id;

        $callee = $user->role === 'reception'
            ? User::where('unit_id', $unitId)->where('role', 'unit_owner')->firstOrFail()
            : User::where('role', 'reception')->firstOrFail();

        $room        = 'call_' . $unitId;
        $calleeToken = $this->livekitToken('user_' . $callee->id, $callee->name, $room);

        try {
            broadcast(new CallInvited($unitId, $user->name, $room))->toOthers();
        } catch (\Throwable) {}

        if ($callee->fcm_token) {
            try {
                app(Messaging::class)->send(
                    CloudMessage::new()
                        ->withToken($callee->fcm_token)
                        ->withData([
                            'type'        => 'call_invite',
                            'unit_id'     => (string) $unitId,
                            'room'        => $room,
                            'token'       => $calleeToken,
                            'livekit_url' => config('services.livekit.url'),
                            'caller_name' => $user->name,
                        ])
                );
            } catch (\Throwable $e) {
                \Log::error('[FCM] call invite failed: ' . $e->getMessage());
            }
        }

        return response()->json(['message' => 'Invite sent']);
    }

    /** Signal the other party that the call has ended. */
    public function end(Request $request): JsonResponse
    {
        $request->validate(['unit_id' => 'required|integer']);

        $user   = $request->user();
        $unitId = $request->unit_id;

        $other = $user->role === 'reception'
            ? User::where('unit_id', $unitId)->where('role', 'unit_owner')->first()
            : User::where('role', 'reception')->first();

        try {
            broadcast(new CallEnded($unitId, $user->id))->toOthers();
        } catch (\Throwable) {}

        if ($other?->fcm_token) {
            try {
                app(Messaging::class)->send(
                    CloudMessage::new()
                        ->withToken($other->fcm_token)
                        ->withData([
                            'type'    => 'call_ended',
                            'unit_id' => (string) $unitId,
                        ])
                );
            } catch (\Throwable $e) {
                \Log::error('[FCM] call end failed: ' . $e->getMessage());
            }
        }

        return response()->json(['message' => 'OK']);
    }
}
