<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\PushController;
use App\Http\Controllers\UnitController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

Route::prefix('v1')->group(function () {

    // Public
    Route::post('/auth/login', [LoginController::class, 'login']);

    // Protected
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/auth/logout', [LoginController::class, 'logout']);
        Route::get('/me', fn(Request $r) => response()->json(['data' => $r->user()->load('unit')]));

        // Units — reception only
        Route::apiResource('units', UnitController::class);

        // Conversations
        Route::get('/conversations',           [ConversationController::class, 'index']);
        Route::get('/conversations/{unitId}',  [ConversationController::class, 'show']);
        Route::post('/conversations/{unitId}', [MessageController::class, 'store']);
        Route::patch('/messages/{message}/read',      [MessageController::class, 'markRead']);
        Route::patch('/conversations/{unitId}/read', [MessageController::class, 'markAllRead']);

        // Push notifications
        Route::post('/push/subscribe', [PushController::class, 'subscribe']);
    });
});
