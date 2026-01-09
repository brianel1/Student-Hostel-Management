# Panduan Pemasangan KKTM-Ledang Hostel Management System

## Keperluan Sistem

- XAMPP (Apache + MySQL + PHP)
- Node.js (versi 16 ke atas)


## Langkah 1: Setup Database

1. Buka XAMPP dan start Apache dengan MySQL
2. Pergi ke phpMyAdmin (http://localhost/phpmyadmin)
3. Import file backend/database/schema.sql untuk database kosong dengan admin sahaja


## Langkah 2: Setup Backend

1. Copy folder backend ke dalam htdocs XAMPP
2. Pastikan folder uploads ada permission untuk write
3. Backend akan jalan di http://localhost:8000


## Langkah 3: Setup Frontend

1. Buka terminal/command prompt
2. Masuk ke folder frontend
3. Run: npm install
4. Run: npm start
5. Frontend akan buka di http://localhost:3000


## Login Credentials

SuperAdmin:
- Username: admin
- Password: password

Warden: 
- Username: Staff ID
- Password: password

Student:
- Username: No Matrik masing-masing
- Password: No Matrik (default)

