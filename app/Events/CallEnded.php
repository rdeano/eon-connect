<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class CallEnded implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public int $unitId, public int $endedBy) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('conversation.' . $this->unitId)];
    }

    public function broadcastWith(): array
    {
        return [
            'unit_id'  => $this->unitId,
            'ended_by' => $this->endedBy,
        ];
    }
}
