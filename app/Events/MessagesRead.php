<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class MessagesRead implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public int $unitId, public int $readerId) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversation.' . $this->unitId),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'unit_id'   => $this->unitId,
            'reader_id' => $this->readerId,
        ];
    }
}
