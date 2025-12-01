# DiaryGarden Backend API

Backend API for DiaryGarden application built with NestJS, PostgreSQL, and Prisma, featuring AI-powered emotion analysis for diary entries.

## 🚀 Technologies

- **Framework**: NestJS 10
- **Database**: PostgreSQL with Prisma ORM 4.16.2
- **Authentication**: JWT (Access + Refresh tokens)
- **Password Hashing**: bcrypt
- **AI Integration**: FastAPI emotion analysis server
- **Validation**: class-validator, class-transformer

## 📋 Prerequisites

- Node.js (v20.16.0 or higher)
- PostgreSQL database
- FastAPI AI server running at `localhost:8000/emotions`

## 🛠️ Installation

1. Clone the repository
```bash
cd DiaryGarden_BE
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
- Copy `.env.example` to `.env`
- Update `DATABASE_URL` with your PostgreSQL connection string
- Update `JWT_SECRET` with a secure random string

4. Generate Prisma client
```bash
npx prisma generate
```

5. Run database migrations
```bash
npx prisma migrate dev --name init
```

## 🏃 Running the App

```bash
# Development mode with hot-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user (username, password, displayName)
- `POST /api/auth/login` - Login user (username, password)
- `POST /api/auth/verify` - Verify JWT token
- `GET /api/auth/user` - Get current user info (requires auth)
- `POST /api/auth/refresh` - Refresh access token

### Diaries

- `POST /api/diaries` - Create diary entry (requires auth)
  - Body: `{ treeId, content }`
  - Automatically analyzes emotions via AI and stores results
  
- `GET /api/diaries/:id` - Get single diary entry
  - Optional authentication
  
- `GET /api/diaries` - Get user's diary entries (requires auth)
  - Query params: `limit` (optional), `lastDocId` (optional for pagination)

## 🗄️ Database Schema

### User
- id, uid, username, password (hashed), displayName, nickname
- Relations: RefreshTokens, Trees, Diaries

### RefreshToken
- id, userId, token, expiresAt
- Relation: User

### Tree
- id, userId, name
- Relations: User, Diaries
- Default tree created on user registration

### Diary
- id, userId, treeId, content, emotionScores (JSON), dominantEmotion, writtenDate
- Relations: User, Tree

## 🤖 AI Integration

The API integrates with an external FastAPI server for emotion analysis:

- **Endpoint**: `POST localhost:8000/emotions`
- **Request**: `{ text: string, title?: string }`
- **Response**: `{ emotionScores: Record<string, number>, dominantEmotion: string }`
- **Fallback**: Returns neutral emotion if AI service is unavailable

## 🔐 Authentication Flow

1. User registers or logs in
2. Server returns `AuthSession` with `token` (access token) and `refreshToken`
3. Client stores both tokens
4. Client includes access token in `Authorization: Bearer <token>` header for protected routes
5. When access token expires, client uses refresh token to get a new access token

## 📝 Response Format

All API responses follow this format:

**Success**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "message": "Error description"
}
```

##  Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/diarygarden?schema=public
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
AI_SERVICE_URL=http://localhost:8000/emotions
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5000
```

## next Steps

1. Set up your PostgreSQL database
2. Update `.env` file with your database connection string
3. Run migrations: `npx prisma migrate dev`
4. Ensure your FastAPI AI server is running
5. Start the development server: `npm run start:dev`
6. Test endpoints using your Flutter app or API client

## 📦 Project Structure

```
src/
├── auth/           # Authentication module (JWT, guards, strategies)
├── diary/          # Diary CRUD operations
├── ai/             # FastAPI integration for emotion analysis  
├── prisma/         # Prisma service (global database access)
├── common/         # Shared filters, interceptors, decorators
├── app.module.ts   # Root module
└── main.ts         # Application entry point
```

## 🔧 Development Notes

- Swagger documentation was removed for stability
- Uses classic NestJS module structure (all files in module directory)
- Prisma 4.16.2 used for better stability with NestJS 10
- Tree model implemented in backend with default tree creation on registration
- Cursor-based pagination implemented for diary listing

## ⚠️ Important

- Change `JWT_SECRET` in production
- Set up proper CORS origins
- Configure PostgreSQL connection string
- Ensure AI service is running before creating diaries
