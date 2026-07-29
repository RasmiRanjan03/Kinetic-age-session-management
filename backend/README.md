# Session & Subscription Management System - Backend API

This is the backend API for the KineticAge Session & Subscription Management System.

## Tech Stack
- Node.js
- Express
- MongoDB
- Mongoose
- ES Modules

## File Structure
- `src/config/`: Configuration setup (db, cloudinary)
- `src/controllers/`: Route handlers
- `src/middleware/`: Express middlewares (authentication, errors, request validations)
- `src/models/`: Database schemas
- `src/routes/`: Route bindings
- `src/services/`: Auxiliary business services
- `src/utils/`: Common utilities (tokens, async handlers, constants)
- `src/validations/`: Data schema check configurations

## Local Setup
1. Configure `.env` from `.env.example`.
2. Start server locally:
   ```bash
   npm run dev
   ```
3. API is available at `http://localhost:5001/api`.
