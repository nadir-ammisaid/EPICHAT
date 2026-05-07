# EPICHAT 

Real-time chat application - RTC Project 2026

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express 5, Socket.IO, Zod |
| Database | PostgreSQL 16, Prisma ORM |
| Auth & Security | JWT, bcrypt, helmet, express-rate-limit |
| Desktop | Electron + electron-builder |

## New In V2 (Compared To V1)

- Direct messages (DM conversations and DM messages)
- Reactions on channel messages and DM messages
- GIF search integration (Giphy API)
- Server moderation: kick, permanent ban, temporary ban, unban
- Ownership transfer in servers
- Presence and typing improvements (channel + DM)
- Desktop app packaging with Electron
- Bilingual interface (EN/FR)
- CI split by backend/frontend and release Docker build on tags

## Requirements

- Node.js 20+
- Docker + Docker Compose (recommended)
- PostgreSQL 16+ (if running database locally)

## Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd EPICHAT

# Install root tooling (concurrently, formatting tools)
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Desktop (optional)
cd ../desktop
npm install
```

## Environment Setup

Create an environment file at repository root:

```bash
cp .env.sample .env
```

Important variables:

- `DATABASE_URL`
- `CLIENT_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_API_URL`
- `GIPHY_API_KEY` (required for `/gif/search`)

## Running

### Option 1 - Run with npm (host)

```bash
# From repository root (backend + frontend in parallel)
npm run dev
```

### Option 2 - Run with Docker Compose

```bash
# From repository root
docker compose up --build
```

Services:

- frontend: `http://localhost:3000`
- backend: `http://localhost:3001`
- prisma studio: `http://localhost:5555`

### Desktop app (optional)

```bash
cd desktop
npm run dev
```

## Database Setup (host mode)

```bash
cd backend
npx prisma db push
npm run db:seed
```

## Testing

### Backend

```bash
cd backend
npm run test
npm run test:coverage
```

### Frontend

```bash
cd frontend
npm run test
npm run test:coverage
```

### Root shortcuts

```bash
# From repository root
npm run test
```

Coverage reports:

- `backend/coverage/`
- `frontend/coverage/`

## CI/CD

Workflows:

- `.github/workflows/ci.yml`
  - triggers: push/pull_request on `main`, `dev`, `stage`
  - backend: install, prisma generate, lint, tests, coverage, build
  - frontend: install, lint, build, tests, coverage

- `.github/workflows/release-build.yml`
  - triggers: tag push `v*`
  - builds and pushes Docker images to GHCR:
    - `ghcr.io/<owner>/epichat-backend:<tag>`
    - `ghcr.io/<owner>/epichat-frontend:<tag>`

## API Endpoints

### Auth & Profile

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/logout` | Invalidate token |
| GET | `/auth/me` | Get current user (auth namespace) |
| PATCH | `/auth/me` | Update profile (auth namespace) |
| PATCH | `/auth/me/status` | Update user presence status |
| DELETE | `/auth/me` | Delete account (auth namespace) |
| GET | `/me` | Get current user |
| PATCH | `/me` | Update current user |
| DELETE | `/me` | Delete current user |

### Servers

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/servers` | List user servers |
| POST | `/servers` | Create server |
| GET | `/servers/:id` | Get server details |
| GET | `/server/:id` | Compatibility server details route |
| PUT | `/servers/:id` | Update server |
| DELETE | `/servers/:id` | Delete server |
| POST | `/servers/:id/join` | Join server |
| DELETE | `/servers/:id/leave` | Leave server |
| GET | `/servers/:id/members` | List members |
| PUT | `/servers/:id/members/:userId` | Update member role |
| POST | `/servers/:id/invites` | Create invite |
| POST | `/servers/:id/kick/:userId` | Kick member |
| POST | `/servers/:id/ban` | Permanent ban |
| POST | `/servers/:id/tempban` | Temporary ban |
| GET | `/servers/:id/bans` | List bans |
| DELETE | `/servers/:id/unban/:userId` | Unban member |
| POST | `/servers/:id/transfer-ownership/:userId` | Transfer ownership |

### Invites

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/invites/:code/join` | Join a server by invite code |

### Channels

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/servers/:serverId/channels` | Create channel |
| GET | `/servers/:serverId/channels` | List channels |
| GET | `/channels/:channelId` | Get channel details |
| PUT | `/channels/:channelId` | Update channel |
| DELETE | `/channels/:channelId` | Delete channel |

### Channel Messages

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/channels/:id/messages` | Send message |
| GET | `/channels/:id/messages` | Get message history (paginated) |
| PUT | `/messages/:id` | Edit message |
| DELETE | `/messages/:id` | Delete message |
| POST | `/messages/:id/reactions` | Toggle reaction |

### Direct Messages (DM)

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/dm/conversations` | List DM conversations |
| POST | `/dm/conversations` | Create/get DM conversation |
| GET | `/dm/conversations/:id/messages` | Get DM history (paginated) |
| POST | `/dm/conversations/:id/messages` | Send DM message |
| PUT | `/dm/messages/:id` | Edit DM message |
| DELETE | `/dm/messages/:id` | Delete DM message |
| POST | `/dm/messages/:id/reactions` | Toggle DM reaction |

### GIF

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/gif/search` | Search GIFs (Giphy) |

## WebSocket Events

Connection URL: `ws://localhost:3001/ws`

### Channel rooms

- Client -> server: `channel:join`, `channel:leave`
- Server -> client: `message:new`, `message:updated`, `message:deleted`, `message:reaction`

### Channel typing

- Client -> server: `typing:start`, `typing:stop`
- Server -> client: `typing:update`

### DM rooms

- Client -> server: `dm:join`, `dm:leave`
- Server -> client: `dm:message:new`, `dm:message:updated`, `dm:message:deleted`, `dm:message:reaction`

### DM typing

- Client -> server: `dm:typing:start`, `dm:typing:stop`
- Server -> client: `dm:typing:update`

### Presence and moderation

- Presence: `presence:snapshot`, `presence:broadcast`, `presence:init`, `presence:update`
- Moderation: `server:kick`, `member:banned`, `member:tempbanned`, `member:unbanned`, `server:ownershipTransferred`, `member:roleUpdated`

## Database Schema (High Level)

Core models:

- `User` (includes `status`)
- `Server`
- `ServerMember` (`owner`, `admin`, `member` role model)
- `Channel`
- `Message` (supports `type`, optional `mediaUrl`, soft delete)
- `Invite`

DM and reactions:

- `DirectConversation`
- `DirectMessage` (supports `type`, optional `mediaUrl`, soft delete)
- `MessageReaction`
- `DmReaction`

Moderation:

- `Ban` (permanent or temporary via `expiresAt`/`permanent`)

## Roles & Permissions

| Role | Create Channel | Delete Channel | Delete Messages | Manage Roles | Delete Server |
| --- | --- | --- | --- | --- | --- |
| Owner | Yes | Yes | Any | Yes | Yes |
| Admin | Yes | Yes | Any | No | No |
| Member | No | No | Own only | No | No |

## Project Structure

```text
EPICHAT/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── servers/
│   │   │   ├── channels/
│   │   │   ├── messages/
│   │   │   ├── invites/
│   │   │   ├── dm/
│   │   │   ├── reactions/
│   │   │   └── gif/
│   │   ├── shared/
│   │   └── socket/
│   ├── tests/
│   └── prisma/
├── frontend/
│   ├── src/
│   └── public/locales/{en,fr}
├── desktop/
└── docker-compose.yml
```

## Environment Variables

Use `.env.sample` at repo root as baseline.

```env
# Ports
FRONT_PORT=3000
BACK_PORT=3001
DB_PORT=5433

# DB
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=nom_de_la_base
DATABASE_URL=postgres://user:password@db:5432/nom_de_la_base

# Backend
CLIENT_URL=http://localhost:3000
JWT_SECRET=MySuperSecretKey
JWT_EXPIRES_IN=3600
GIPHY_API_KEY=your_giphy_api_key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Team

- Nadir - Full-Stack developer
- Younes - Full-Stack developer
- Michael - Full-Stack developer
- Warith - Full-Stack developer
