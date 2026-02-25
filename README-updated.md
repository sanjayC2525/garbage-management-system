# 🗑️ Garbage Management System

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)
![React](https://img.shields.io/badge/React-18+-blue?style=flat-square&logo=react)
![Prisma](https://img.shields.io/badge/Prisma-5+-purple?style=flat-square&logo=prisma)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)
![Status](https://img.shields.io/badge/Status-Prototype-orange?style=flat-square)

*A full-stack web application prototype for managing garbage collection requests with role-based workflow and real-time updates.*

</div>

---

## 📋 Table of Contents
- [Project Status](#-project-status)
- [Features](#-features)
- [Security & Privacy](#-security--privacy)
- [Quick Start](#-quick-start)
- [Known Issues](#-known-issues)
- [Tech Stack](#-tech-stack)
- [Contributing](#-contributing)

---

## 🎯 Project Status

**Status: Prototype / In Development**  
**Not Production-Ready**

This is a functional prototype demonstrating core garbage management workflows. While all major features work, the system requires security hardening and production configuration before deployment.

---

## ✨ Features

### 🟢 Working Features
- **🔐 Authentication**: JWT-based login/logout with role-based access control
- **👥 Role Management**: Admin, Worker, and Citizen roles with distinct interfaces
- **📝 Report Submission**: Citizens submit garbage reports with photos and GPS location
- **📊 Admin Dashboard**: Complete management interface with analytics
- **👷 Worker Workflow**: Accept → In Progress → Complete task lifecycle
- **✅ Task Management**: Workers can accept, update, and complete assigned tasks
- **📸 Proof of Work**: Workers upload before/after photos as completion proof
- **💬 Feedback System**: Citizens submit feedback/issues with admin replies
- **🔄 Status Updates**: Real-time status synchronization across all roles
- **📱 Responsive Design**: Works on desktop and mobile devices
- **📋 Audit Logs**: Complete system activity tracking
- **👤 Worker Performance**: Individual workload and performance metrics
- **⚠️ Issue Resolution**: Dispute resolution workflow with single-reply constraint
- **🔔 Notifications**: System notifications for all events

### 🟡 Partially Working / In Development
- **📈 Analytics**: Basic statistics implemented (advanced analytics in progress)
- **🔄 Real-time Updates**: Polling-based notifications (WebSocket integration planned)
- **🗺️ Location Services**: Basic GPS integration (route optimization not implemented)

### 🔴 Not Implemented
- **🚀 WebSocket Integration**: Real-time notifications use polling
- **🗺️ Route Optimization**: Basic GPS only, no advanced routing
- **🤖 AI Analytics**: Manual assignment only
- **📱 Mobile App**: Web app only (mobile-responsive)

---

## 👥 Role-wise Features

### 👤 Citizen Features
- **📝 Report Submission**: Submit garbage reports with photos and GPS
- **📊 Report History**: View all submitted reports with status tracking
- **💬 Feedback System**: Submit complaints and suggestions with admin replies
- **⚠️ Issue Reporting**: File disputes with resolution tracking
- **🔔 Notifications**: Real-time updates on report status
- **📱 Mobile Friendly**: Responsive design for mobile devices

### 👷 Worker Features
- **📋 Task Management**: View assigned tasks with detailed information
- **✅ Task Workflow**: Accept → In Progress → Complete lifecycle
- **📸 Proof Upload**: Upload before/after photos as completion proof
- **📊 Performance Metrics**: Track personal efficiency and completion rates
- **🗺️ Location Services**: View task locations with map integration
- **🔔 Notifications**: Real-time task assignments and updates

### 👑 Admin Features
- **📊 Analytics Dashboard**: System analytics with KPIs and trends
- **👥 User Management**: Create and manage user accounts
- **📝 Report Management**: Review, approve, reject, and assign reports
- **👤 Worker Performance**: Monitor individual and team performance
- **💬 Feedback Management**: Handle citizen feedback with single-reply constraint
- **⚠️ Issue Resolution**: Manage disputes with resolution tracking
- **📋 Audit Logs**: Complete system activity tracking
- **🔄 Task Reassignment**: Handle unable tasks and reassign workers
- **📊 Proof Review**: Review worker proof of work submissions

---

## 🛡️ Security & Privacy

### 🔒 Security Measures Implemented
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions by user role
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Server-side validation and sanitization
- **File Upload Security**: Image validation and size limits
- **Audit Logging**: Complete activity tracking

### ⚠️ Security Considerations
- **Demo Credentials**: Uses hardcoded demo passwords (development only)
- **Development CORS**: CORS configured for localhost only
- **SQLite Database**: Development database (migrate to PostgreSQL for production)
- **Environment Variables**: Requires proper environment configuration

> 🚨 **Production Setup Required**: This prototype needs security hardening before production deployment.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd garbage-management-system
npm install
cd backend && npm install
cd ../frontend && npm install

# 2. Setup environment variables
cd backend
cp .env.example .env
# Edit .env with your configuration:
# - JWT_SECRET (generate a secure random string)
# - DATABASE_URL (sqlite for development)

# 3. Setup database
cd backend
npx prisma migrate dev
npx prisma db:seed

# 4. Start development servers
cd ..
npm run dev
```

### Access Points
- 🌐 **Frontend**: http://localhost:5173
- 🔌 **Backend**: http://localhost:5001

### Demo Accounts
- 👑 **Admin**: `admin@example.com` / `admin123`
- 👷 **Worker**: `worker1@example.com` / `password`
- 👤 **Citizen**: `citizen@example.com` / `password`

---

## ⚠️ Known Issues

### Current Limitations
- **Database Reset**: Running seeds will delete all existing data
- **Port Conflicts**: May need to kill processes on ports 5001/5173
- **File Uploads**: Local filesystem only (no cloud storage)
- **Real-time Updates**: Uses polling instead of WebSockets
- **Mobile Experience**: Responsive but not optimized for mobile browsers

### Development Issues
- **Hot Reload**: Occasionally requires manual refresh after changes
- **Error Handling**: Some edge cases may show generic error messages
- **Performance**: Not optimized for large datasets

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

### Development Tools
- **Package Manager**: npm
- **Code Quality**: ESLint (configured)
- **Database Migrations**: Prisma Migrate
- **Environment**: dotenv

---

## 📏 Limitations

### Technical Limitations
- **Database**: SQLite for development (migratable to PostgreSQL)
- **Testing**: Manual testing only (no automated tests)
- **Real-time**: Polling-based notifications
- **Analytics**: Basic statistics only
- **Deployment**: Requires environment configuration
- **Scalability**: Not optimized for high traffic

### Feature Limitations
- **Mobile**: Web app only (no native mobile app)
- **Route Optimization**: Basic GPS only
- **AI Features**: Manual assignment only
- **Advanced Analytics**: Basic metrics only
- **Multi-tenant**: Single organization only

---

## 🏗️ System Architecture

### Database Schema
- **Users**: Authentication and role management
- **GarbageReports**: Citizen reports with status tracking
- **Tasks**: Worker assignments with workflow states
- **Feedback**: Citizen feedback with admin replies
- **Issues**: Disputes and service issues
- **Notifications**: System notifications
- **AuditLogs**: Activity tracking
- **Workers**: Worker profiles and performance data

### Workflow States
- **Reports**: REPORTED → APPROVED → ASSIGNED → IN_PROGRESS → COMPLETED
- **Tasks**: ASSIGNED → ACCEPTED → IN_PROGRESS → COMPLETED/UNABLE
- **Feedback**: OPEN → IN_PROGRESS → RESOLVED/REJECTED (single reply constraint)
- **Issues**: PENDING → IN_REVIEW → RESOLVED/REJECTED (single reply constraint)

---

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Guidelines
- Follow existing code style
- Add error handling for new features
- Update documentation for API changes
- Test all role-based functionality

### Areas for Contribution
- **Automated Testing**: Unit and integration tests
- **WebSocket Integration**: Real-time notifications
- **Advanced Analytics**: Enhanced reporting
- **Mobile Optimization**: Better mobile experience
- **Route Optimization**: Smart routing algorithms
- **Security Hardening**: Production security measures

---

## 📝 Development Notes

> 💡 **Database Reset**: Running `npx prisma db:seed` will delete all data. Use with caution in development.

> ⚠️ **Security**: This is a prototype. Never use demo credentials in production!

> 🔧 **Port Issues**: If you encounter EADDRINUSE errors, kill processes on ports 5001 and 5173.

> 📱 **Mobile Testing**: Test on actual mobile devices for best results.

---

<div align="center">

**Built with ❤️ using React, Node.js, and Prisma**

*Prototype Status - Not Production-Ready*

</div>
