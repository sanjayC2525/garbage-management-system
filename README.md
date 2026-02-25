# 🗑️ Garbage Management System

A prototype web application for managing garbage collection requests with role-based workflow and status tracking.

## Project Status

**Status: Prototype / In Development**  
**Not Production-Ready**

This is a functional prototype demonstrating core garbage management workflows. The system contains bugs, incomplete features, and requires significant development before production use.

## Features

### ✅ Working Features
- User authentication with JWT tokens and role-based access control
- Citizens can submit garbage reports with photos and GPS location
- Admin dashboard for reviewing and managing reports
- Worker task assignment and basic workflow management
- Feedback and issue submission system with single-reply constraint
- File upload functionality for report photos and proof of work
- Basic analytics and reporting for admin users
- Mobile-responsive web interface

### 🟡 Partially Working / Buggy Features
- Admin dashboard: Some views show blank data or fail to load
- Feedback system: Admin replies may not reflect immediately in UI
- Worker statistics: Performance metrics do not update in real-time
- Status synchronization: Pending states may not refresh across sessions
- Real-time notifications: Implemented with polling, not WebSocket
- Location services: Basic GPS integration without route optimization

### ❌ Not Implemented
- WebSocket real-time updates
- Advanced analytics and AI-powered assignment
- Route optimization for workers
- Mobile native applications
- Email notifications system
- Multi-tenant support
- Advanced reporting and export features

## 👥 Role-wise Features

### 👤 Citizen Features
- Submit garbage reports with photos and location
- View report history and status updates
- Submit feedback and issues to administrators
- Receive notifications about report status changes

### 👷 Worker Features
- View assigned tasks and work orders
- Update task status (accept, in-progress, complete)
- Upload before/after photos as proof of work
- View basic performance metrics

### 👑 Admin Features
- Review and approve/reject citizen reports
- Assign workers to reports and tasks
- Monitor system analytics and statistics
- Manage user accounts and permissions
- Handle citizen feedback and issues
- View audit logs and system activity

## 🔒 Security & Privacy

### Known Security Risks
- Demo credentials: Hardcoded passwords in development seed file
- User data logging: Console logs may contain emails, IDs, and request data
- Development CORS: Open localhost configuration only
- Token storage: Uses localStorage without secure HttpOnly cookies
- Uploads directory: User-generated files stored locally
- Authentication: Basic JWT implementation without refresh tokens

### Privacy Considerations
- User data logged in development mode
- File uploads stored without encryption
- No data anonymization or retention policies
- Basic audit logging without privacy controls

### ⚠️ Known Issues

### 🐛 Current Bugs
- Admin dashboard displays blank views in some sections
- Feedback replies do not immediately reflect in the interface
- Worker statistics fail to update in real-time
- Pending report states do not refresh across browser sessions
- Status synchronization issues between different user roles
- Mobile responsive layout breaks on some screen sizes
- File upload validation is incomplete

### 📏 Limitations
- SQLite database not suitable for production scale
- No automated tests or error handling
- Limited concurrent user support
- Basic error messages without user guidance
- No backup or recovery mechanisms

## 🛠️ Setup (Development Only)

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/sanjayC2525/garbage-management-system.git
cd garbage-management-system

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# Setup environment
cd backend
cp .env.example .env
# Edit .env with your configuration (see .env.example for variables)

# Setup database
npx prisma migrate dev
npx prisma db:seed

# Start development servers
cd ..
npm run dev
```

### Access Points
- Frontend: http://localhost:5173
- Backend: http://localhost:5001

### Demo Accounts
- Admin: admin@example.com
- Workers: worker1@example.com, worker2@example.com, worker3@example.com
- Citizen: citizen@example.com

Note: Check your .env file for actual demo passwords.

## Repository Safety Notes

### Files That Must NOT Be Committed
- `.env` files (contain secrets and credentials)
- `backend/uploads/` directory (user-generated files)
- `backend/prisma/dev.db` (development database)
- Any files with secrets, tokens, or private keys

### Security Practices
- Never commit credentials or API keys
- Use environment variables for all configuration
- Exclude user-generated content from version control
- Review all code changes for sensitive data exposure

## 🔧 Tech Stack

### ⚙️ Backend
- Node.js with Express.js
- Prisma ORM with SQLite database
- JWT authentication with bcrypt
- Multer for file uploads

### 🎨 Frontend
- React with Vite build tool
- TailwindCSS for styling
- Axios for HTTP requests
- React Hot Toast for notifications

### 🛠️ Development Tools
- npm for package management
- Prisma Migrate for database changes
- Concurrently for running multiple processes

## 🗄️ Database Schema

- Users: Authentication and role management
- GarbageReports: Citizen reports with status tracking
- Tasks: Worker assignments with workflow states
- Feedback: Citizen feedback with admin replies
- Issues: Disputes and service issues
- Notifications: System notifications
- AuditLogs: Activity tracking
- Workers: Worker profiles and performance data

## 🤝 Contributing

### 📝 Development Guidelines
- Follow existing code style and patterns
- Add error handling for new features
- Test all role-based functionality
- Update documentation for API changes

### 🎯 Areas for Contribution
- Automated testing implementation
- WebSocket real-time updates
- Advanced analytics features
- Mobile optimization
- Security hardening
- Performance optimization

## 🏗️ Architecture Notes

### 🔄 Workflow States
- Reports: REPORTED → APPROVED → ASSIGNED → IN_PROGRESS → COMPLETED
- Tasks: ASSIGNED → ACCEPTED → IN_PROGRESS → COMPLETED/UNABLE
- Feedback: OPEN → IN_PROGRESS → RESOLVED/REJECTED
- Issues: PENDING → IN_REVIEW → RESOLVED/REJECTED

### 📋 Current Limitations
- Single-organization deployment only
- Limited scalability with SQLite
- No multi-language support
- Basic error handling and logging
- Development-focused configuration

---

❤️ Built with React, Node.js, and Prisma for demonstration purposes.