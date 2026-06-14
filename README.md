# Eon Connect

A real-time messaging platform that connects condominium unit owners with building reception. Unit owners can send and receive messages from reception, with conversations scoped per unit and delivered live via WebSockets.

## Tech Stack

**Backend**
- PHP 8.3 / Laravel 13
- MySQL
- Laravel Sanctum — token-based API auth
- Laravel Reverb — WebSocket server for real-time broadcasting
- Redis — queue and cache driver
- Spatie Laravel Permission — role management
- Spatie Laravel Backup

**Frontend**
- React 19 + React Router 7
- Material UI (MUI) v9
- Zustand — client state management
- Laravel Echo + Pusher.js — WebSocket client
- TailwindCSS 4 + Vite

## Roles

| Role | Access |
|---|---|
| `reception` | Manage units, view all conversations, send/receive messages |
| unit owner | View and send messages for their own unit |

## API Endpoints

All routes are prefixed with `/api/v1`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login and receive a Sanctum token |
| POST | `/auth/logout` | Required | Revoke current token |
| GET | `/me` | Required | Current user with unit |
| GET/POST/PUT/DELETE | `/units` | Required (reception) | Unit CRUD |
| GET | `/conversations` | Required | List conversations (reception: all units; owner: own messages) |
| GET | `/conversations/{unitId}` | Required | Full message thread for a unit |
| POST | `/conversations/{unitId}` | Required | Send a message to a unit |
| PATCH | `/messages/{message}/read` | Required | Mark a message as read |
| POST | `/push/subscribe` | Required | Register a push notification token |

Real-time events are broadcast on private channel `conversation.{unit_id}` using `MessageSent`.

## Setup

**Requirements:** PHP 8.3+, Composer, Node 20+, MySQL, Redis

```bash
# 1. Clone and install
git clone <repo-url> eon-connect
cd eon-connect

# 2. One-command setup (install deps, copy .env, generate key, migrate, build assets)
composer run setup
```

Copy `.env.example` to `.env` and configure these values before running setup:

```env
APP_URL=http://eon-connect.test

DB_DATABASE=eon_connect
DB_USERNAME=root
DB_PASSWORD=

BROADCAST_CONNECTION=reverb
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

## Running Locally

```bash
composer run dev
```

This starts three processes concurrently:
- `php artisan serve` — Laravel HTTP server
- `php artisan queue:listen` — queue worker
- `npm run dev` — Vite dev server

## Testing

```bash
composer run test
```

Uses [Pest](https://pestphp.com/) with the Laravel plugin.
