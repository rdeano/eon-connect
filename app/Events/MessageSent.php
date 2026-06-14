<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversation.' . $this->message->unit_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id'         => $this->message->id,
            'sender_id'  => $this->message->sender_id,
            'body'       => $this->message->body,
            'status'     => $this->message->status,
            'created_at' => $this->message->created_at,
        ];
    }
}
