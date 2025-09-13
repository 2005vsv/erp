# ERP-based Integrated Student Management System

A comprehensive ERP solution for educational institutions that integrates admissions, fee collection, hostel allocation, and examination records into a unified platform.

## Features

- **Unified Data Management**: Central database for all student information
- **Streamlined Admission Process**: Online forms and automated data entry
- **Fee Management**: Automated receipting and payment tracking
- **Hostel Management**: Live occupancy tracking and allocation
- **Examination Records**: Centralized grade management
- **Course & Subject Management**: Curriculum design and academic planning
- **Administrative Dashboard**: Real-time metrics and reporting
- **Role-based Access Control**: Secure, permission-based system access
- **Data Security**: Built-in security features with XSS protection, rate limiting, and data sanitization
- **Automated Backups**: Scheduled database backups with restoration capabilities

## Technology Stack

- **MongoDB**: NoSQL database for flexible data storage
- **Express.js**: Backend web application framework
- **React.js**: Frontend user interface library
- **Node.js**: JavaScript runtime environment

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```
4. Set up environment variables (see .env.example files)
5. Start the development servers:
   - Backend: `npm run dev` in the backend directory
   - Frontend: `npm start` in the frontend directory

## Project Structure

```
/
├── backend/           # Node.js and Express.js server
│   ├── controllers/   # Request handlers
│   │   ├── auth.controller.js       # Authentication logic
│   │   ├── user.controller.js       # User management
│   │   ├── student.controller.js    # Student operations
│   │   ├── admission.controller.js  # Admission processing
│   │   ├── fee.controller.js        # Fee management
│   │   ├── hostel.controller.js     # Hostel allocation
│   │   ├── exam.controller.js       # Examination system
│   │   ├── course.controller.js     # Course management
│   │   ├── subject.controller.js    # Subject management
│   │   └── backup.controller.js     # Data backup operations
│   ├── middleware/    # Express middleware
│   │   ├── auth.js                  # Authentication middleware
│   │   ├── error.js                 # Error handling
│   │   └── security.js              # Security features
│   ├── models/        # MongoDB models
│   │   ├── User.js                  # User model
│   │   ├── Student.js               # Student model
│   │   ├── Admission.js             # Admission model
│   │   ├── Fee.js                   # Fee model
│   │   ├── Hostel.js                # Hostel model
│   │   ├── Exam.js                  # Exam model
│   │   ├── Course.js                # Course model
│   │   ├── Subject.js               # Subject model
│   │   └── Backup.js                # Backup model
│   ├── routes/        # API routes
│   │   ├── auth.routes.js           # Authentication routes
│   │   ├── user.routes.js           # User routes
│   │   ├── student.routes.js        # Student routes
│   │   ├── admission.routes.js      # Admission routes
│   │   ├── fee.routes.js            # Fee routes
│   │   ├── hostel.routes.js         # Hostel routes
│   │   ├── exam.routes.js           # Exam routes
│   │   ├── course.routes.js         # Course routes
│   │   ├── subject.routes.js        # Subject routes
│   │   └── backup.routes.js         # Backup routes
│   └── server.js      # Main server file
├── frontend/          # React.js client (to be implemented)
│   ├── public/        # Static files
│   └── src/           # React source code
│       ├── assets/    # Images, fonts, etc.
│       ├── components/# Reusable components
│       ├── contexts/  # React contexts
│       ├── pages/     # Page components
│       ├── services/  # API service integrations
│       └── utils/     # Utility functions
├── package.json       # Project dependencies
└── README.md          # Project documentation
```

## API Endpoints

The API is organized by resource:

- `/api/auth` - Authentication (login, register, password reset)
- `/api/users` - User management
- `/api/students` - Student management
- `/api/admissions` - Admission processing
- `/api/fees` - Fee management
- `/api/courses` - Course management
- `/api/subjects` - Subject management
- `/api/exams` - Examination system
- `/api/hostels` - Hostel management
- `/api/backups` - Data backup and restoration

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting to prevent brute force attacks
- XSS protection
- NoSQL injection prevention
- Security headers with Helmet
- HTTP parameter pollution prevention

## License

This project is licensed under the MIT License - see the LICENSE file for details.