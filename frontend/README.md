# Frontend

This directory contains the React frontend for the PII Redaction Tool.

## Tech Stack
- React 18
- Vite
- TypeScript
- Tailwind CSS
- React Router DOM
- Axios
- Recharts (for analytics visualizations)
- Lucide React (for icons)

## Folder Structure
- `src/components/`: Reusable UI components.
- `src/pages/`: Main route pages (Upload, Results, Dashboard, Admin).
- `src/layouts/`: Global layouts (MainLayout with Sidebar).
- `src/services/`: API communication wrappers (`api.ts`).

## Authentication & Anonymous Mode
The application heavily utilizes local storage for tracking sessions. 
- Anonymous mode bypasses the need for a token, allowing the backend to generate temporary documents with a strict TTL.
- Authenticated mode allows the user to view history and analytics.

## Running Locally
```bash
npm install
npm run dev
```
The server will start on `http://localhost:5173`.
