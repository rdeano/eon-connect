<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Unit extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'unit_number', 'floor', 'building', 'owner_name', 'status',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function owner(): HasOne
    {
        return $this->hasOne(User::class, 'unit_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'unit_id');
    }
}
