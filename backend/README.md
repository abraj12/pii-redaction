# Backend API

This directory contains the Express.js backend for the PII Redaction Tool.

## Tech Stack
- Node.js & Express.js
- TypeScript
- MongoDB & Mongoose
- JWT (JSON Web Tokens) for auth
- Bcrypt for hashing
- Multer for file handling

## Architecture (MVC)
The backend uses a strict Model-View-Controller architecture, separating business logic into specific layers.
- `src/routes/`: Express routers linking HTTP endpoints to controllers.
- `src/controllers/`: Request orchestration and response formatting.
- `src/services/`: Core business logic (e.g., communicating with the Python microservice).
- `src/models/`: Mongoose schemas outlining MongoDB collections.
- `src/middleware/`: Reusable validation, auth checking, and file uploading logic.

## Security & Privacy
- Files uploaded by anonymous users are tagged with an `expiresAt` property to ensure they are cleaned up automatically.
- No PII is permanently stored inside the backend database in plain text.
- API is protected via `helmet` headers, and CORS is configured.
- Administrator routes are locked behind an `adminProtect` middleware that verifies the JWT role.

## Running Locally
Ensure MongoDB is running locally or via Docker.
```bash
npm install
npm run dev
```
Server starts on `http://localhost:5000`.
