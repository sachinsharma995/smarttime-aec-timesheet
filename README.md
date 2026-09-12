# SmartTime

**Intelligent Timesheet & Productivity Platform for AEC teams**

Built for the **ArchScale Guild Hackathon** — Problem Statement **AS-04: Reinvent the Timesheet**.

## Overview

SmartTime is an intelligent timesheet and productivity platform designed for Architecture, Engineering, and Construction (AEC) teams. It helps employees track time, manage project tasks, and create structured timesheets with AI assistance. Managers can review submissions, provide feedback, and understand team and project activity through analytics.

## Problem

Traditional timesheets are often manual, repetitive, and difficult to analyze. Employees spend time re-entering work details, while managers have limited visibility into team hours, project effort, and productivity. This makes timesheet review slower and project-level decision-making harder.

## Solution

SmartTime streamlines the workflow with:

- A start/stop timer for active work tracking.
- Project- and task-based time entries.
- An AI Timesheet Assistant for structuring work descriptions.
- A timesheet submission workflow.
- Manager approval or rejection with comments.
- An analytics dashboard for time visibility.
- AI-generated weekly work summaries.

## Key Features

- JWT authentication
- Employee and Manager roles
- Secure httpOnly cookie authentication
- Project management
- Task management
- Start/Stop timer
- Manual timesheet entries
- AI Timesheet Assistant
- Timesheet submission
- Manager approval/rejection with comments
- Analytics dashboard
- Weekly work summary
- Responsive UI

## Employee Workflow

```text
Register/Login
  → Select Project & Task
  → Start Timer or Add Timesheet
  → Use AI Assistant if needed
  → Save Timesheet
  → Submit Timesheet
  → Manager Review
```

## Manager Workflow

```text
Manager Login
  → Manager Dashboard
  → Review Submitted Timesheets
  → Approve or Reject
  → Monitor Team Hours
  → View Analytics
```

## AI Integration

SmartTime uses Google Gemini to help structure timesheet entries and generate weekly work summaries. AI requests are made only by the Express backend. The Gemini API key is stored in server environment variables and is never exposed to the React client.

## Tech Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts

### Backend

- Node.js
- Express.js
- Mongoose
- JWT
- bcryptjs
- cookie-parser

### Database

- MongoDB Atlas

### AI

- Google Gemini API

### Deployment

- Vercel
- Render
- MongoDB Atlas

## Architecture

```text
React Client
      ↓
Express REST API
      ↓
MongoDB Atlas

Express Backend
      ↓
Google Gemini API
```

Gemini is accessed only from the Express backend.

## Project Structure

```text
smarttime/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── README.md
```

## Live Demo

- Frontend: [smarttime-aec-timesheet.vercel.app](https://smarttime-aec-timesheet.vercel.app)
- Backend health check: [smarttime-aec-timesheet.onrender.com/api/health](https://smarttime-aec-timesheet.onrender.com/api/health)
- GitHub: [sachinsharma995/smarttime-aec-timesheet](https://github.com/sachinsharma995/smarttime-aec-timesheet)

## Demo Video

Demo video: [Add your 3–5 minute walkthrough video link here]

## Screenshots

<!-- Add Dashboard screenshot here. -->

<!-- Add AI Timesheet Assistant screenshot here. -->

<!-- Add Timesheet screenshot here. -->

<!-- Add Projects screenshot here. -->

<!-- Add Tasks screenshot here. -->

<!-- Add Manager Approval screenshot here. -->

<!-- Add Analytics screenshot here. -->

## Local Setup

Clone the repository, then open the project directory:

```bash
cd smarttime
```

Do not commit credentials or environment files.

### Server

Create the server environment file from the example, set local values, and start the API.

**Windows (PowerShell)**

```powershell
cd server
copy .env.example .env
npm install
npm run dev
```

**macOS/Linux**

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### Client

Open a second terminal, create the client environment file, and start Vite.

**Windows (PowerShell)**

```powershell
cd client
copy .env.example .env
npm install
npm run dev
```

**macOS/Linux**

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

The client development server uses Vite's development port. The server port and client API URL are controlled by environment variables.

## Environment Variables

### Server environment

Configure these values in `server/.env`. Start with [server/.env.example](server/.env.example).

- `PORT`: Port used by the Express server.
- `MONGO_URI`: MongoDB connection string for a local database or MongoDB Atlas.
- `JWT_SECRET`: Strong private secret used to sign authentication tokens.
- `CLIENT_URL`: Frontend origin allowed by the backend CORS configuration.
- `AI_API_KEY`: Private Google Gemini API key used by the backend.
- `AI_MODEL`: Gemini model name used by the backend (for example, `gemini-2.5-flash`).
- `AI_API_URL`: Optional provider URL retained in the environment template; the current Gemini SDK integration uses `AI_API_KEY` and `AI_MODEL` and does not require a separate URL.
- `NODE_ENV`: Use `development` locally and `production` when deployed.
- `MANAGER_EMAIL` and `MANAGER_PASSWORD`: Credentials used by the optional manager seed script.

Never commit `server/.env`, JWT secrets, MongoDB credentials, manager credentials, or AI API keys.

### Client environment

Configure this value in `client/.env`. Start with [client/.env.example](client/.env.example).

- `VITE_API_URL`: Backend API base URL ending with `/api`. Use the local API URL during development and the deployed Render API URL in production.

Do not put private credentials in Vite environment variables.

## Deployment

### Frontend: Vercel

Deploy the `client` directory as the Vercel project root.

- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` to the deployed Render API base URL.

[client/vercel.json](client/vercel.json) preserves React Router routes on browser refresh.

### Backend: Render

Deploy the `server` directory as a Render Web Service.

- Build command: `npm install`
- Start command: `npm start`

Configure `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `AI_API_KEY`, `AI_MODEL`, and `NODE_ENV` in Render. Set `CLIENT_URL` to the deployed Vercel origin.

### Database: MongoDB Atlas

Create an Atlas cluster and database user, allow Render through Network Access, and set the Atlas connection string as `MONGO_URI` in Render. Never place the connection string in source code or commit it to Git.

## Security

- Passwords are hashed by the backend with bcryptjs.
- JWTs are stored in httpOnly cookies and are not exposed to frontend JavaScript.
- Gemini API requests and credentials remain backend-only.
- CORS is restricted to the configured frontend origin.
- Project, task, and timesheet management permissions are enforced with server-side manager authorization.
- Environment secrets are excluded from Git.

## Hackathon Value / Why SmartTime

SmartTime gives AEC teams better visibility into time spent across projects while reducing repetitive timesheet work. Structured entries, faster manager review, project-level productivity visibility, and AI-assisted reporting make day-to-day reporting more practical for teams.

## Future Improvements

- Attendance integration
- Notifications and reminders
- Advanced team productivity insights
- Payroll integration
- Mobile application
