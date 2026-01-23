# Garbage Management System

A full-stack web application for managing garbage pickup requests with role-based authentication.

## Features

- **Authentication**: JWT-based login with role-based access (Admin, Worker, Citizen)
- **Citizen Module**: Submit pickup requests, view request status, report garbage with photo and location
- **Worker Module**: View assigned requests, update status, view daily routes, view AI-assigned tasks
- **Admin Module**: Dashboard with statistics, assign workers, manage users, verify garbage reports
- **AI Assignment Engine**: Rule-based task assignment with workload balancing

## Tech Stack

- **Frontend**: React + Vite, Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT

## Setup Instructions

1. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

2. **Set up the database**:
   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed
   cd ..
   ```

3. **Start the development servers**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001

## Demo Accounts

- **Admin**: admin@example.com / admin123
- **Worker**: worker@example.com / worker123
- **Citizen**: citizen@example.com / citizen123

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Pickup Requests
- `GET /api/pickup-requests` - Get requests (filtered by role)
- `POST /api/pickup-requests` - Create request (Citizen only)
- `PATCH /api/pickup-requests/:id/status` - Update status (Worker only)
- `PATCH /api/pickup-requests/:id/assign` - Assign worker (Admin only)
- `GET /api/pickup-requests/stats` - Get statistics (Admin only)

### Garbage Reports
- `POST /api/garbage-reports` - Submit garbage report with photo (Citizen only)
- `GET /api/garbage-reports` - Get all reports (Admin only)
- `PUT /api/garbage-reports/:id` - Approve/Reject report (Admin only)

### Tasks
- `GET /api/tasks` - Get assigned tasks (Worker only)
- `PUT /api/tasks/:id/collect` - Mark task as collected (Worker only)

## AI Assignment Engine

The system includes a rule-based AI assignment engine for automatically assigning garbage collection tasks to workers based on photo-based citizen reports.

### How It Works

1. **Citizen Reports**: Citizens can submit garbage reports with photos and GPS coordinates using the HTML5 Geolocation API.

2. **Admin Verification**: Admins review submitted reports and can approve or reject them.

3. **AI Assignment**: Upon approval, the AI engine automatically assigns the task to the least-loaded worker.

4. **Task Execution**: Workers receive tasks with photo, location, and scheduled time, and can mark them as collected.

### Assignment Rules

- **Workload Balancing**: Tasks are assigned to the worker with the current lowest workload.
- **Capacity Limits**: 
  - Maximum 10 workers in the system
  - Maximum 10 concurrent tasks per worker
- **Time Randomization**: Scheduled times are randomized within the next 7 days
- **Location Randomization**: Task locations are randomized within Karnataka state bounds (lat: 11.5-18.5, lng: 74.0-78.5)
- **Deterministic Logic**: Uses rule-based logic with controlled randomness for explainable decisions
- **Decision Logging**: All AI decisions are logged with reasons for transparency

### Limits & Constraints

- No ML libraries or external APIs used
- Pure rule-based system with seeded randomness
- All operations run locally on localhost
- Workers are pre-seeded (10 workers available)
- System prevents over-assignment beyond capacity limits

```
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
├── .env.example
└── README.md
```