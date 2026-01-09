# KKTM-Ledang Hostel Management System

## Setup Instructions

### 1. Database Setup
1. Make sure MySQL is running (via XAMPP or standalone)
2. Open phpMyAdmin (http://localhost/phpmyadmin) or MySQL CLI
3. Import `backend/database/schema.sql` to create the database and tables

### 2. Backend Setup (PHP Built-in Server)
```bash
cd backend
php -S localhost:8000 router.php
```
The API will be accessible at `http://localhost:8000/api/`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
The React app will run at `http://localhost:3000`

## Default Login
- **SuperAdmin**: admin@kktm-ledang.edu.my / password

## Features
- Student & Warden Registration
- Warden Approval System (SuperAdmin)
- Room Management
- Student Room Assignment
- Complaint Management with Categories & Priorities
- Image Upload for Complaints
- Comment System
- Dashboard Statistics

## User Roles
1. **SuperAdmin** - Approve wardens, full system access
2. **Warden** - Manage students, rooms, complaints
3. **Student** - Submit and track complaints
