# Inrerv – Real‑time Collaborative Project Management Platform

## 📖 Overview
Inrerv is a modern **MERN‑stack** web app for collaborative project and task management. It uses:
- **RTK Query** for server‑state handling (caching, optimistic updates)
- **Zustand** for lightweight UI state (auth, socket, UI toggles)
- **Socket.io** for real‑time updates
- **React Hook Form + Zod** for type‑safe form validation
- A premium UI built with vanilla CSS, custom design tokens, micro‑animations and dark‑mode support.

The app is designed to handle **10 000 concurrent users**.

---

## ⚙️ Setup
1. **Clone the repo**
   ```bash
   git clone https://github.com/your-org/inrerv.git
   cd inrerv
   ```
2. **Create an environment file**
   ```bash
   cp .env.example .env
   # edit .env with your values (see the "Environment Variables" section below)
   ```
3. **Install dependencies**
   ```bash
   cd client
   npm ci   # installs front‑end deps
   ```
   If you have a back‑end in the repo, install its deps as well:
   ```bash
   cd ../server   # optional
   npm ci
   ```

---

## 📦 Build & Run (no Docker)
### Development
```bash
npm run dev        # Vite dev server – hot‑module reloading (http://localhost:5173)
```
### Production build
```bash
npm run build      # creates an optimized static bundle in ./dist
```
### Serve the built files
You can serve the `dist` folder with any static‑file server. Two common options:
- **Vite preview** (quick, zero‑config):
  ```bash
  npm run preview   # serves ./dist on http://localhost:4173
  ```
- **serve** (npm package) – install globally once:
  ```bash
  npm i -g serve
  serve -s dist -l 3000   # serves on http://localhost:3000
  ```
Both approaches work without Docker and are suitable for a production‑ready static host (e.g., Netlify, Vercel, AWS S3 + CloudFront, or a simple Nginx config).

---

## 🌐 Environment Variables (`.env.example`)
```dotenv
# Base URL of the back‑end API (used by Vite via import.meta.env.VITE_API_URL)
VITE_API_URL=https://api.your-domain.com

# JWT secret – only needed by the back‑end
JWT_SECRET=your‑jwt‑secret

# Socket.io endpoint (defaults to same host as API)
SOCKET_URL=wss://api.your-domain.com

# Optional: change the Vite dev server port
VITE_PORT=5173
```
Copy this file to `.env` and adjust the values for your environment.

---

## 📚 API Documentation
- **Auth**: `/auth/register`, `/auth/login`, `/auth/logout`
- **Projects**: CRUD endpoints plus `/projects/:id/invite`
- **Tasks**: CRUD endpoints, filter by `projectId`
All protected routes require an `Authorization: Bearer <token>` header.

A full OpenAPI spec is provided in `swagger.json`. You can serve it with `swagger-ui-express` on the back‑end or upload it to services like SwaggerHub.

---

## 🧩 Code Comments for Complex Logic
- **`useRealtimeUpdates` hook** – subscribes to Socket.io events and updates RTK Query caches.
- **Optimistic updates** – defined in `projectsApi.js` and `tasksApi.js` via `onQueryStarted`.
- **Form validation schemas** – located in `src/lib/validationSchemas.js`. They use Zod’s `refine` for cross‑field checks (e.g., end date after start date).
- **Cache invalidation tags** – each API slice declares `providesTags` / `invalidatesTags` to keep related queries in sync.

---

## 📄 Swagger/OpenAPI (`swagger.json`)
A minimal OpenAPI 3.0 spec lives at the repository root. It can be served with:
```js
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../swagger.json';
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```
This gives you interactive API docs for developers and testers.

---

## 🚀 Quick Production Checklist (no Docker)
1. Set real values in `.env` and ensure the back‑end is reachable.
2. Run `npm run build`.
3. Deploy the `dist` folder to your static host (Netlify, Vercel, S3 + CloudFront, or an Nginx server).
4. Verify the API URL is correctly injected (check the network tab).
5. Open `/api-docs` on the back‑end to confirm Swagger UI works.
6. Run a few manual end‑to‑end tests (create a project, add tasks, invite members) to ensure real‑time updates flow.

That’s it – you now have a production‑ready front‑end without Docker! 🎉
