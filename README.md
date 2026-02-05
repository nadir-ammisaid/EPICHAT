# {EPICHAT}

Real-time chat application - RTC Project 2026

## Stack

| Layer    | Technology                        |
| -------- | --------------------------------- |
| Frontend | Next.js 16, React 19, TailwindCSS |
| Backend  | Node.js, Express 5, Socket.IO     |
| Database | PostgreSQL, Prisma ORM            |
| Auth     | JWT (jsonwebtoken, bcrypt)        |

## Requirements

- Node.js 20+
- PostgreSQL 15+

## Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd EPICHAT

# Backend
cd backend
npm install
cp .env.sample .env  # Configure DATABASE_URL, JWT_SECRET, CLIENT_URL

# Frontend
cd ../frontend
npm install
```

## Database Setup

```bash
cd backend
npx prisma db push
npm run db:seed  # Optional: seed with test data
```

## Running

```bash
# Backend (port 3001)
cd backend
npm run dev

# Frontend (port 3000)
cd frontend
npm run dev
```

## Testing

```bash
cd backend
npm test              # Run tests
npm run test:coverage # Run with coverage report
```

## API Endpoints

### Authentication

| Method | Endpoint       | Description       |
| ------ | -------------- | ----------------- |
| POST   | `/auth/signup` | Create account    |
| POST   | `/auth/login`  | Authenticate user |
| POST   | `/auth/logout` | Invalidate token  |
| GET    | `/me`          | Get current user  |

### Servers

| Method | Endpoint                       | Description         |
| ------ | ------------------------------ | ------------------- |
| GET    | `/servers`                     | List user's servers |
| POST   | `/servers`                     | Create server       |
| GET    | `/server/:id`                  | Get server details  |
| PUT    | `/servers/:id`                 | Update server       |
| DELETE | `/servers/:id`                 | Delete server       |
| POST   | `/servers/:id/join`            | Join server         |
| DELETE | `/servers/:id/leave`           | Leave server        |
| GET    | `/servers/:id/members`         | List members        |
| PUT    | `/servers/:id/members/:userId` | Update member role  |

### Channels

| Method | Endpoint                      | Description         |
| ------ | ----------------------------- | ------------------- |
| GET    | `/servers/:serverId/channels` | List channels       |
| POST   | `/servers/:serverId/channels` | Create channel      |
| GET    | `/channels/:id`               | Get channel details |
| PUT    | `/channels/:id`               | Update channel      |
| DELETE | `/channels/:id`               | Delete channel      |

### Messages

| Method | Endpoint                 | Description         |
| ------ | ------------------------ | ------------------- |
| GET    | `/channels/:id/messages` | Get message history |
| POST   | `/channels/:id/messages` | Send message        |
| DELETE | `/messages/:id`          | Delete message      |

### Invites

| Method | Endpoint             | Description     |
| ------ | -------------------- | --------------- |
| POST   | `/invites/:code/use` | Use invite code |

## WebSocket Events

Connection: `ws://localhost:3001/ws`

| Event             | Direction | Payload                    | Description            |
| ----------------- | --------- | -------------------------- | ---------------------- |
| `channel:join`    | Client    | `channelId`                | Join channel room      |
| `channel:leave`   | Client    | `channelId`                | Leave channel room     |
| `typing:start`    | Client    | `{ channelId, userId }`    | Start typing indicator |
| `typing:stop`     | Client    | `{ channelId, userId }`    | Stop typing indicator  |
| `typing:update`   | Server    | `{ channelId, userIds[] }` | Typing users list      |
| `message:new`     | Server    | `Message`                  | New message broadcast  |
| `message:deleted` | Server    | `{ messageId }`            | Message deleted        |

## Database Schema

```
User
├── id, email, username, passwordHash, createdAt
├── ownedServers[]
├── memberships[]
└── messages[]

Server
├── id, name, ownerId, createdAt
├── owner (User)
├── members[]
├── channels[]
└── invites[]

ServerMember
├── serverId, userId, role, joinedAt
└── role: "owner" | "admin" | "member"

Channel
├── id, serverId, name, createdBy, createdAt
└── messages[]

Message
├── id, channelId, authorId, content
├── createdAt, updatedAt, deletedAt
└── Soft delete pattern

Invite
├── id, serverId, code, createdBy
├── expiresAt, maxUses, uses, createdAt
└── Unique code constraint
```

## Roles & Permissions

| Role   | Create Channel | Delete Channel | Delete Messages | Manage Roles | Delete Server |
| ------ | -------------- | -------------- | --------------- | ------------ | ------------- |
| Owner  | Yes            | Yes            | Any             | Yes          | Yes           |
| Admin  | Yes            | Yes            | Any             | No           | No            |
| Member | No             | No             | Own only        | No           | No            |

## Project Structure

```
EPICHAT/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── servers/
│   │   │   ├── channels/
│   │   │   ├── messages/
│   │   │   └── invites/
│   │   ├── shared/
│   │   │   ├── middlewares/
│   │   │   ├── errors/
│   │   │   └── utils/
│   │   ├── prisma/
│   │   └── socket/
│   ├── tests/
│   └── prisma/
│       └── schema.prisma
│
└── frontend/
    └── src/
        ├── app/
        │   ├── (auth)/
        │   │   ├── login/
        │   │   └── register/
        │   └── (main)/
        │       ├── dashboard/
        │       └── servers/
        ├── components/
        └── lib/
```

## Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://user:pass@localhost:5432/epichat
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
CLIENT_URL=http://localhost:3000
PORT=3001
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Bonus Features

| Feature               | Status      |
| --------------------- | ----------- |
| Emoji/Unicode support | Implemented |

### Emoji Support

Full Unicode and emoji support is available:

- `EmojiPicker` component with 5 categories and 130+ emojis
- Search functionality
- Click-outside-to-close
- Keyboard navigation (Escape to close)
- `MessageInput` component with integrated emoji picker
- Auto-resize textarea
- Enter to send, Shift+Enter for new line

Usage:

```tsx
import { MessageInput } from "@/components/ui";

<MessageInput
  onSendMessage={(content) => console.log(content)}
  onTypingStart={() => socket.emit("typing:start", { channelId, userId })}
  onTypingStop={() => socket.emit("typing:stop", { channelId, userId })}
/>;
```

## Team

- Nadir - Full-Stack developer
- Younes - Full-Stack developer
- Michael - Full-Stack developer
- Warith - Full-Stack developer
