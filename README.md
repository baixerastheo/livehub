<div align="center">

<img src="frontend/public/brand/Livehub_logo.png" alt="LiveHub Logo" width="360"/>

<br/>

### `> LIVEHUB v1.0 :: SYSTEM ONLINE_`

**Communication platform. Real-time. No compromises.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Storage-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![pnpm](https://img.shields.io/badge/pnpm-workspaces-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)

<br/>

```
 ╔══════════════════════════════════════════════════════════╗
 ║  [FEATURES]  [STACK]  [INSTALL]  [ARCH]  [API]  [WS]   ║
 ╚══════════════════════════════════════════════════════════╝
```

[Features](#-features) · [Tech Stack](#%EF%B8%8F-tech-stack) · [Install](#-boot-sequence) · [Architecture](#-system-map) · [API](#-api-endpoints) · [Realtime](#-realtime-engine)

</div>

---

## `> cat /about.md`

**LiveHub** is a real-time communication platform combining private messaging, community servers, and friend management. Built on WebSockets, it delivers instant, low-latency communication — whether you're chatting 1-on-1 or coordinating a team across multiple channels.

---

## `> ls /features`

### `[01] PRIVATE MESSAGING`
```
STATUS: OPERATIONAL
PROTOCOL: WebSocket (Socket.io)
```
- Real-time message delivery via persistent WebSocket connections
- Full conversation history with pagination
- Read receipts on every message
- Conversations sorted by latest activity

### `[02] SERVERS & CHANNELS`
```
STATUS: OPERATIONAL
MODULES: CRUD, Roles, Channels
```
- Spin up **servers** for your community or team
- Multiple **channels** per server (auto-generated `#general`)
- **Role system** : `PROPRIETAIRE` > `ADMINISTRATEUR` > `MEMBRE`
- Member management — invite, promote, kick
- Channel creation/deletion (admin+)

### `[03] FRIEND SYSTEM`
```
STATUS: OPERATIONAL
FEATURES: Request, Accept, Decline, Realtime Presence
```
- Send & receive **friend requests**
- Accept / decline with one click
- Friends list with **live online status**
- Built-in protection against duplicates & self-requests

### `[04] AUTHENTICATION`
```
STATUS: SECURED
PROVIDERS: 3
```
- **Email / password** registration
- **Google** OAuth <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" width="14" height="14" />
- **Roblox** OAuth
- HTTP-only session cookies (7-day TTL)
- Powered by Better Auth

### `[05] USER PROFILES`
```
STATUS: OPERATIONAL
STORAGE: Supabase Bucket
```
- Custom **avatar upload** (stored on Supabase Storage)
- Presence status: `EN_LIGNE` | `HORS_LIGNE`
- Profile settings page

### `[06] VOICE CHANNELS`
```
STATUS: OPERATIONAL
PROTOCOL: LiveKit (WebRTC)
```
- Join **voice channels** inside a server
- Live participant list with mute indicators
- Mute / deafen controls
- Local volume per participant
- Powered by **LiveKit** (self-hosted or LiveKit Cloud)

### `[07] MENTIONS`
```
STATUS: OPERATIONAL
FORMAT: @[userId] stored, rendered as chip
```
- Type `@` in any server channel to trigger autocomplete
- Filtered member list with avatar + keyboard navigation
- Mention stored as `@[userId]` in message content
- Rendered as a styled **purple chip** in message bubbles
- **Amber chip** when the mention targets the current user

### `[08] NOTIFICATIONS`
```
STATUS: OPERATIONAL
TRIGGER: background tab only
```
- **In-app toast** when mentioned in a channel (foreground, different channel)
- **OS notification** (Browser Notification API) when tab is in background :
  - Mention in a server channel
  - New private message
  - Kicked or banned from a server

### `[09] REALTIME ENGINE`
```
STATUS: OPERATIONAL
LATENCY: ~instant
```
- Private messages delivered in real-time
- Channel messages synced across all subscribers
- Live member join notifications
- Live channel creation notifications
- **Presence broadcast** to servers & friends

---

## `> cat /tech-stack.yml`

### Frontend

| Tech | Role |
|---|---|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" width="18"/> **Next.js 16** | React framework, App Router |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="18"/> **React 19** | UI rendering |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="18"/> **TypeScript 5** | Static typing |
| **Zustand** | Client state (sidebar, modals) |
| **TanStack React Query** | Server state & cache |
| **React Hook Form + Zod** | Forms & validation |
| **Socket.io Client** | Realtime transport |

### Backend

| Tech | Role |
|---|---|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nestjs/nestjs-original.svg" width="18"/> **NestJS 11** | REST API framework |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="18"/> **TypeScript 5** | Static typing |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="18"/> **PostgreSQL 15** | Relational database |
| **Prisma 7** | Type-safe ORM |
| **Socket.io** | WebSocket gateway |
| **Better Auth** | Auth (OAuth + credentials) |
| **Supabase Storage** | Avatar file storage |
| **Swagger** | Auto-generated API docs |

### Infrastructure

| Tech | Role |
|---|---|
| **pnpm Workspaces** | Monorepo management |
| **Supabase** | Hosted PostgreSQL + Storage |
| **Docker** | Local Supabase (dev) |
| **Playwright** | E2E tests |
| **Jest** | Unit tests |

---

## `> ./boot-sequence.sh`

### Prerequisites

```
[CHECK] Node.js >= 18    .......... OK
[CHECK] pnpm >= 8        .......... OK
[CHECK] Docker           .......... OK
```

### Step 1 — Clone

```bash
git clone https://github.com/votre-username/Livehub.git
cd Livehub
```

### Step 2 — Install dependencies

```bash
pnpm install
```

### Step 3 — Configure environment

Create `backend/.env` :

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database
DIRECT_URL=postgresql://user:password@host:port/database

# Auth
BETTER_AUTH_URL=http://localhost:4001
FRONTEND_URL=http://localhost:3000
ROBLOX_CLIENT_ID=your_client_id
ROBLOX_CLIENT_SECRET=your_client_secret
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key
SUPABASE_STORAGE_BUCKET=avatars

# LiveKit (voice channels)
LIVEKIT_URL=wss://your-livekit-server
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# Server
PORT=4001
NODE_ENV=development
```

Create `frontend/.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:4001
```

### Step 4 — Initialize database

```bash
pnpm run supabase:start   # optional: local Supabase
pnpm run db:push           # push Prisma schema
pnpm run db:generate       # generate Prisma client
```

### Step 5 — Launch

```bash
pnpm run dev
```

```
 ┌─────────────────────────────────────────┐
 │  SERVICE          STATUS      PORT      │
 ├─────────────────────────────────────────┤
 │  Frontend         RUNNING     :3000     │
 │  Backend API      RUNNING     :4001     │
 │  Swagger Docs     RUNNING     :4001/api │
 │  WebSocket        RUNNING     :4001     │
 └─────────────────────────────────────────┘
```

---

## `> tree /system-map`

```
Livehub/
├── frontend/                     # Next.js application
│   └── src/
│       ├── app/                  # Pages (App Router)
│       │   ├── page.tsx          # Landing page
│       │   ├── messages/         # Private messaging
│       │   ├── people/           # Friends & user directory
│       │   ├── channels/         # Channel [channelId]
│       │   └── servers/          # Server [serverId]
│       ├── features/             # Feature modules
│       │   ├── auth/             # Auth hooks
│       │   ├── channel/          # Channel components
│       │   ├── friends/          # Friend system
│       │   ├── messages/         # Private & channel messaging
│       │   ├── modalAuth/        # Auth modal (login/register)
│       │   ├── notifications/    # OS notifications hook
│       │   ├── server/           # Server components
│       │   ├── shared/           # Layout, navbar, sidebar
│       │   └── voice/            # Voice channel (LiveKit)
│       ├── core/                 # Zustand stores
│       └── lib/                  # Utilities & clients
│
├── backend/                      # NestJS API
│   ├── src/
│   │   ├── auth/                 # Authentication
│   │   ├── user/                 # User management
│   │   ├── server/               # Servers
│   │   ├── canal/                # Channels
│   │   ├── message/              # Messages
│   │   ├── friends/              # Friend system
│   │   ├── realtime/             # WebSocket gateway + presence
│   │   ├── supabase/             # Storage service
│   │   ├── app.module.ts         # Root module
│   │   ├── main.ts               # Entry point
│   │   └── prisma.service.ts     # Database service
│   └── prisma/
│       └── schema.prisma         # Database schema
│
├── supabase/                     # Local Supabase config
├── pnpm-workspace.yaml           # Monorepo workspace
└── package.json                  # Root scripts
```

---

## `> netstat -realtime`

LiveHub runs on **Socket.io** — persistent WebSocket connections for zero-delay communication.

### Connection flow

```
 CLIENT                              SERVER
   │                                    │
   │──── WebSocket CONNECT ────────────>│
   │     (session cookies)              │
   │                                    │── validate session
   │<─── joined room user:{id} ────────│
   │                                    │── presence.increment()
   │                                    │── broadcast online to
   │                                    │   servers & friends
   │                                    │
   │── channel:subscribe ─────────────>│── join room channel:{id}
   │── server:subscribe ──────────────>│── join room server:{id}
   │                                    │
   │<── private-message:created ───────│  (DM received)
   │<── channel-message:created ───────│  (channel msg received)
   │<── server-member:joined ──────────│  (new member)
   │<── server-member:online ──────────│  (member came online)
   │<── server-member:offline ─────────│  (member went offline)
   │<── server-channel:created ────────│  (new channel)
   │<── user:online ───────────────────│  (friend came online)
   │<── user:offline ──────────────────│  (friend went offline)
   │                                    │
   │──── DISCONNECT ───────────────────>│
   │                                    │── presence.decrement()
   │                                    │── broadcast offline
```

### Event reference

| Event | Direction | Description |
|---|---|---|
| `channel:subscribe` | `CLIENT > SERVER` | Subscribe to a channel |
| `channel:unsubscribe` | `CLIENT > SERVER` | Unsubscribe from a channel |
| `channel:typing` | `CLIENT > SERVER` | Typing indicator |
| `channel:stop-typing` | `CLIENT > SERVER` | Stop typing indicator |
| `server:subscribe` | `CLIENT > SERVER` | Subscribe to a server |
| `server:unsubscribe` | `CLIENT > SERVER` | Unsubscribe from a server |
| `voice:join` | `CLIENT > SERVER` | Join a voice channel |
| `voice:leave` | `CLIENT > SERVER` | Leave a voice channel |
| `voice:mute` | `CLIENT > SERVER` | Toggle mute state |
| `private-message:created` | `SERVER > CLIENT` | New private message |
| `channel-message:created` | `SERVER > CLIENT` | New channel message |
| `server-channel:created` | `SERVER > CLIENT` | New channel created |
| `server-member:joined` | `SERVER > CLIENT` | New member joined server |
| `server-member:online` | `SERVER > CLIENT` | Server member came online |
| `server-member:offline` | `SERVER > CLIENT` | Server member went offline |
| `server-member:kicked` | `SERVER > CLIENT` | Member kicked from server |
| `server-member:banned` | `SERVER > CLIENT` | Member banned from server |
| `voice-channel:presence` | `SERVER > CLIENT` | Voice participants updated |
| `message:mention` | `SERVER > CLIENT` | Current user was mentioned |
| `user:online` | `SERVER > CLIENT` | Friend came online |
| `user:offline` | `SERVER > CLIENT` | Friend went offline |

---

## `> curl /api-endpoints`

Full API docs auto-generated at `http://localhost:4001/api` (Swagger).

### `AUTH`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/*` | Better Auth routes (login, register, OAuth) |

### `USERS`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users` | List all users |
| `GET` | `/users/:id` | Get user by ID |
| `PUT` | `/users/:id` | Update user |
| `POST` | `/users/:id/avatar` | Upload avatar |

### `PRIVATE MESSAGES`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/conversations/private` | List conversations |
| `GET` | `/messages/private/:peerId` | Message history with user |
| `POST` | `/messages/private/:peerId` | Send private message |
| `DELETE` | `/messages/:id` | Delete a message |

### `SERVERS`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/servers` | Create server |
| `GET` | `/servers` | My servers |
| `POST` | `/servers/:id/join` | Join server |
| `DELETE` | `/servers/:id/leave` | Leave server |
| `GET` | `/servers/:id/members` | List members |

### `CHANNELS`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/servers/:id/channels` | Create channel |
| `GET` | `/servers/:id/channels` | List channels |
| `GET` | `/channels/:id/messages` | Channel messages |
| `POST` | `/channels/:id/messages` | Send to channel |

### `FRIENDS`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/friends` | List friends |
| `GET` | `/friends/requests` | Pending requests |
| `POST` | `/friends/requests` | Send request |
| `POST` | `/friends/requests/:id/accept` | Accept request |
| `POST` | `/friends/requests/:id/decline` | Decline request |

---

## `> SELECT * FROM schema`

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │     │   Serveur    │     │    Canal     │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id           │     │ id           │     │ id           │
│ name         │<───┐│ nom          │────>│ serveurId    │
│ email        │    ││ createdAt    │     │ nom          │
│ avatar       │    │└──────────────┘     │ messages[]   │
└──────────────┘    │                     └──────────────┘
       │            │
       │            │ ┌───────────────┐
       │            └─│ MembreServeur │
       │              ├───────────────┤
       ├─────────────>│ userId        │
       │              │ serveurId     │
       │              │ role          │
       │              └───────────────┘
       │
       │  ┌──────────────┐    ┌──────────────────┐
       ├─>│ MessagePrive │    │  DemandeAmitie   │
       │  ├──────────────┤    ├──────────────────┤
       │  │ expediteurId │    │ fromUserId       │
       │  │ destinataireId   │ toUserId         │
       │  │ contenu      │    │ statut           │
       │  │ lu           │    └──────────────────┘
       │  └──────────────┘
       │
       └─>┌──────────────┐
          │   Amitie     │
          ├──────────────┤
          │ userAId      │
          │ userBId      │
          └──────────────┘
```

### Roles

| Role | Permissions |
|---|---|
| `PROPRIETAIRE` | Full access, delete server |
| `ADMINISTRATEUR` | Manage channels & members |
| `MEMBRE` | Read & send messages |

### Presence

```
Source of truth: PresenceService (in-memory Map)

  WebSocket connect   ──>  increment(userId)  ──>  broadcast online
  WebSocket disconnect ──>  decrement(userId)  ──>  broadcast offline
  API GET requests     ──>  isOnline(userId)   ──>  return status
```

No database writes for presence. Pure in-memory, zero latency.

---

## `> available-scripts`

```bash
# Development
pnpm run dev                 # Launch everything
pnpm run dev:frontend        # Frontend only
pnpm run dev:backend         # Backend only

# Build
pnpm run build               # Build frontend + backend

# Code quality
pnpm run lint                # Linter
pnpm run review:check        # Lint + full typecheck

# Database
pnpm run db:push             # Apply schema
pnpm run db:generate         # Generate Prisma client

# Supabase (local)
pnpm run supabase:start      # Start
pnpm run supabase:stop       # Stop
pnpm run supabase:reset      # Reset
```

---

## `> cat /security.conf`

```
[rate_limit]      10 req / 60s per IP
[sessions]        HTTP-only cookies, prefix "livehub", 7-day TTL
[cors]            Whitelisted origins only
[validation]      Zod (frontend) + class-validator (backend)
[auth_guard]      All protected routes
[authorization]   Role-based access control
[storage]         Signed URLs for avatars (Supabase)
```

---

## `> contributing`

```bash
git clone <fork>
git checkout -b feature/my-feature
git commit -m "add: my feature"
git push origin feature/my-feature
# Open Pull Request
```

---

<div align="center">

```
 ╔═══════════════════════════════════════╗
 ║   BUILT BY THE LIVEHUB TEAM          ║
 ║   STATUS: ONLINE                     ║
 ║   UPTIME: 99.9%                      ║
 ╚═══════════════════════════════════════╝
```

<img src="frontend/public/brand/Livehub_logo.png" alt="LiveHub" width="120"/>

</div>
