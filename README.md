# SmartTime

Intelligent Timesheet & Productivity Platform

## Problem

Traditional timesheets are manual, time-consuming and difficult to analyze.

## Solution

SmartTime simplifies time tracking through a start/stop timer, project and task-based timesheets, analytics, manager approval and AI-assisted timesheet creation.

## Features

- Authentication
- Employee and Manager roles
- Start/Stop timer
- Timesheet management
- Projects and Tasks
- Manager approval/rejection
- Analytics dashboard
- AI Timesheet Assistant
- AI Weekly Work Summary

## Tech Stack

- React.js
- Vite
- Tailwind CSS
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Recharts
- AI API

## Architecture

```text
React → Express → MongoDB
              ↓
            AI API
```

The AI API is accessed only by the backend. The AI API key is never exposed to the React client.

## Local Setup

Clone the repository using your Git provider, then enter the project directory:

```bash
cd smarttime
```

Do not commit credentials or environment files.

### Server

Create the server environment file from the example and set your local values:

```powershell
cd server
copy .env.example .env
npm install
npm run dev
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`.

### Client

Open a second terminal and create the client environment file:

```powershell
cd client
copy .env.example .env
npm install
npm run dev
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`.

The client development server uses the Vite development port. The server port and client API URL are controlled by environment variables.

## Environment Variables

### Server environment

Configure these variables in `server/.env`:

- `PORT`: Port used by the Express server.
- `MONGO_URI`: MongoDB connection string for the local database or MongoDB Atlas.
- `JWT_SECRET`: A strong private secret used to sign authentication tokens.
- `CLIENT_URL`: The frontend origin allowed by the backend CORS configuration.
- `AI_API_KEY`: Private API key for the configured AI provider.
- `AI_API_URL`: AI provider chat-completions endpoint, when using a custom provider.
- `AI_MODEL`: AI model name used by the backend AI service.
- `NODE_ENV`: Use `development` locally and `production` when deployed.

Use [server/.env.example](server/.env.example) as the template. Never commit `server/.env`, JWT secrets, MongoDB credentials or AI API keys.

### Client environment

Configure this variable in `client/.env`:

- `VITE_API_URL`: The backend API base URL ending with `/api`. For local development, use the local server API URL. For deployment, use the actual Render API URL.

Use [client/.env.example](client/.env.example) as the template. Do not put private credentials in Vite environment variables.

## Deployment

### Frontend: Vercel

Deploy the `client` directory as the Vercel project root.

- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` to the actual deployed Render API base URL.

The [client/vercel.json](client/vercel.json) configuration keeps React Router routes working after a browser refresh.

### Backend: Render

Deploy the `server` directory as a Render Web Service.

- Build command: `npm install`
- Start command: `npm start`

Configure `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `AI_API_KEY`, `AI_API_URL`, `AI_MODEL` and `NODE_ENV` in the Render environment settings. Use the actual Vercel origin for `CLIENT_URL`.

### Database: MongoDB Atlas

Create a MongoDB Atlas cluster and database user, configure Network Access for the Render service, and store the Atlas connection string in Render as `MONGO_URI`. Never place the connection string in source code or commit it to Git.

## Health Check

The backend exposes:

```text
GET /api/health
```

It returns:

```json
{
  "success": true,
  "message": "SmartTime API is running"
}
```

## Security

- Passwords are hashed by the backend.
- JWTs are stored in httpOnly cookies and are not exposed to frontend JavaScript.
- AI requests are made only by the backend.
- CORS is restricted to the configured frontend origin.
- Manager APIs enforce server-side role authorization.
- `.env` files, secrets, logs, build output and dependencies are ignored by Git.
