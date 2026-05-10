
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RitoMovie is a Netflix-inspired movie streaming web app. It is a monorepo with two independent packages:
- `backend/` — Express.js + TypeScript REST API on port 5000
- `frontend/` — React 18 + Vite + TypeScript SPA on port 5173

## Commands

Run all commands from the respective subdirectory (`backend/` or `frontend/`).

### Backend
```bash
cd backend
npm run dev       # Development server (nodemon + ts-node)
npm run build     # Compile TypeScript to dist/
npm start         # Run compiled build
npm run lint      # ESLint for .ts files
npm run format    # Prettier format src/**/*.ts
```

### Frontend
```bash
cd frontend
npm run dev       # Vite dev server (port 5173)
npm run build     # Type-check + Vite production build
npm run lint      # ESLint with zero warnings
npm run preview   # Preview production build locally
```

There are currently no automated tests.

## Environment Variables

Both packages require `.env` files (not committed).

**backend/.env** needs:
- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — JWT signing secret
- `TMDB_API_KEY` — The Movie Database API key
- `PHIM_API_BASE_URL` — Vietnamese movie API base URL (default: `https://phimapi.com`)
- `PORT` — Server port (default: 5000)
- `NODE_ENV` — `development` or `production`
- `FRONTEND_URL` — Allowed CORS origin
- `EMAIL_*` — Nodemailer SMTP settings (for password reset / email verification)
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `ENABLE_CACHE_WARMUP` — Set to `false` to skip startup cache warming

**frontend/.env** needs:
- `VITE_API_BASE_URL` — API base URL (defaults to `/api`, proxied to port 5000 in dev)
- `VITE_TMDB_IMAGE_BASE_URL` — TMDB image CDN (default: `https://image.tmdb.org/t/p`)
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID

## Architecture

### Data Flow

1. **Frontend → Backend**: The Vite dev server proxies `/api/*` to `http://localhost:5000`. The custom axios instance in `frontend/src/lib/axios.ts` auto-attaches the JWT `Authorization` header and the `Accept-Language` header for i18n. Its response interceptor unwraps `response.data`, so all service functions receive `{ success, data, message }` directly — not an `AxiosResponse` wrapper.

2. **Backend response format**: All API responses follow `{ success: boolean, data: T, message: string }`. Errors use `ApiError` class (`backend/src/utils/ApiError.ts`) and are caught by the global error handler (`backend/src/middleware/errorHandler.ts`). Async controllers are wrapped with `asyncHandler` to avoid boilerplate try/catch.

3. **Movie data sources**: The backend aggregates from two external APIs:
   - **TMDB** (`tmdbService.ts`) — primary source for English content
   - **PhimAPI** (`phimApiService.ts`) — Vietnamese movie data from `phimapi.com`
   - Both are served through a shared in-memory cache (`backend/src/utils/cache.ts`) with TTL-based expiry. The cache is warmed at startup (2 s delay) via `cacheService.warmHomeCache(['en', 'vi'])`.

### Backend Structure

```
backend/src/
├── config/        # database.ts (Mongoose), i18n.ts
├── controllers/   # Route handlers; admin/ has sub-controllers
├── middleware/    # auth.ts (protect/authorize), errorHandler, validate, settings
├── models/        # User, Movie, WatchHistory, Rating (Mongoose schemas)
├── routes/        # auth, movies, phim, users, videos, comments, home, admin
├── services/      # tmdbService, phimApiService, cacheService, videoService, emailService, settingsService
└── utils/         # ApiError, asyncHandler, cache (MemoryCache class)
```

**Authentication** (`middleware/auth.ts`): `protect` verifies the JWT from the `Authorization: Bearer <token>` header and attaches `req.user`. `authorize(...roles)` restricts to specific roles (e.g., `'admin'`).

**Admin routes** (`/api/admin`) cover dashboard analytics, user management, movie management, comments, reports, audit logs, and app settings. Settings (e.g., maintenance mode) are loaded from MongoDB at startup and kept in memory by `settingsService`.

**Video streaming** (`routes/videos.ts`): Uploaded files are stored in `backend/uploads/videos/`. The stream endpoint supports HTTP range requests. HLS conversion is structured but not fully implemented — playback currently uses YouTube trailer embeds.

### Frontend Structure

```
frontend/src/
├── admin/         # Self-contained admin panel (components, pages, routes, services, store)
├── components/    # common/, layout/, movie/
├── hooks/         # useAuth.ts, useMovies.ts
├── i18n/          # i18next setup
├── lib/           # axios.ts (configured instance with interceptors)
├── pages/         # One file per route
├── routes/        # index.tsx — React Router v6 config with lazy loading
├── services/      # authService, movieService, userService (call backend via axios)
├── store/         # authStore.ts (Zustand + persist), movieStore.ts
├── types/         # index.ts — shared TypeScript types
└── utils/         # constants.ts (API_BASE_URL, ROUTES, GENRES), helpers.ts
```

**Routing** (`routes/index.tsx`): All pages except `Home` are lazy-loaded. Public routes: login, register, forgot/reset-password, verify-email. Protected routes (`ProtectedRoute`): my-list, profile. Admin panel is at `/admin/*` (lazy-loaded `AdminRoutes`).

**Auth state** (`store/authStore.ts`): Zustand store with `persist` middleware. "Remember me" sessions write to `localStorage` (`auth-storage`); non-remember sessions write token/user to `sessionStorage` only and skip the persist layer. The axios interceptor reads from both storages to attach the token.

**i18n**: Both frontend and backend support English (`en`) and Vietnamese (`vi`). The frontend sends `Accept-Language` with every request; the backend uses `i18next-http-middleware` to respond accordingly.

**Path alias**: `@/` maps to `frontend/src/` (configured in `vite.config.ts` and `tsconfig.json`).
