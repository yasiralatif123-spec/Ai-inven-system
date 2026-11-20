# Backend (Express + MongoDB)

Basic backend structure for Inventory System.

## Stack
- Express.js
- MongoDB + Mongoose
- JWT (access/refresh tokens)
- Cookie-based auth (`cookie-parser`)
- Session support (`express-session`)

## Setup
1. Copy `.env.example` to `.env` and update values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

## Structure
```text
src/
  config/        # DB and app configuration
  controllers/   # Request handlers
  middlewares/   # Auth/error middlewares
  models/        # Mongoose models
  routes/        # API route definitions
  utils/         # Helpers (tokens, etc.)
  app.js         # Express app setup
  server.js      # Server bootstrap
```

## Notes
- Auth is scaffolded with JWT + cookies + session. Adjust flow (e.g. refresh rotation, session store, CSRF protection) based on your security requirements.
- For production, configure a persistent session store instead of the default in-memory store.
