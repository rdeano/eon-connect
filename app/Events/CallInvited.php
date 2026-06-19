<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class CallInvited implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(
        public int $unitId,
        public string $callerName,
        public string $room,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('conversation.' . $this->unitId)];
    }

    public function broadcastWith(): array
    {
        return [
            'unit_id'     => $this->unitId,
            'caller_name' => $this->callerName,
            'room'        => $this->room,
        ];
    }
}
