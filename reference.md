# Rujukan Projek - Sistem Pengurusan Hostel KKTM-Ledang


## 1. Pengenalan Sistem

Sistem Pengurusan Hostel KKTM-Ledang adalah satu aplikasi web yang dibangunkan untuk memudahkan pengurusan hostel di Kolej Kemahiran Tinggi MARA Ledang. Sistem ini menggabungkan teknologi moden untuk memberikan pengalaman pengguna yang lancar dan efisien.


## 2. Objektif Sistem

- Memudahkan pengurusan bilik dan penempatan pelajar
- Membolehkan pelajar membuat aduan secara dalam talian
- Memudahkan warden memantau dan menguruskan aduan
- Menyediakan dashboard untuk melihat statistik hostel
- Mengurangkan penggunaan kertas dalam pengurusan hostel


## 3. Pengguna Sistem

Sistem ini mempunyai 3 jenis pengguna:

SuperAdmin
- Mempunyai akses penuh kepada semua fungsi sistem
- Boleh menguruskan pelajar, bilik, warden dan aduan
- Boleh meluluskan atau menolak pendaftaran warden
- Boleh import data pelajar dari fail Excel

Warden
- Boleh melihat dan menguruskan aduan pelajar
- Boleh menukar status aduan
- Boleh memberi komen pada aduan
- Perlu kelulusan SuperAdmin untuk mengaktifkan akaun

Pelajar
- Boleh membuat aduan berkaitan bilik
- Boleh melihat status aduan sendiri
- Boleh mengemaskini profil peribadi
- Boleh melihat maklumat bilik yang ditetapkan


## 4. Modul-Modul Sistem

Modul Pengesahan (Authentication)
- Login menggunakan username (No Matrik untuk pelajar, Staff ID untuk warden, admin untuk SuperAdmin)
- Pendaftaran pelajar dan warden
- Pengurusan kata laluan
- Session management menggunakan localStorage

Modul Pengurusan Pelajar
- Paparan senarai pelajar dengan pagination
- Carian dan penapis mengikut blok, semester, status bilik
- Penetapan bilik kepada pelajar
- Import data pelajar dari fail Excel (.xlsx)
- Eksport data pelajar ke fail CSV
- Padam rekod pelajar

Modul Pengurusan Bilik
- Tambah, edit dan padam bilik
- Tetapan kapasiti bilik
- Status bilik automatik (Available, Full, Maintenance)
- Paparan bilangan penghuni semasa

Modul Pengurusan Aduan
- Pelajar boleh buat aduan dengan kategori (Elektrik, Air, Perabot, Internet, Lain-lain)
- Tetapan keutamaan aduan (Rendah, Sederhana, Tinggi)
- Muat naik gambar sebagai bukti
- Sistem komen untuk komunikasi
- Status aduan (Submitted, In Review, In Progress, Resolved, Rejected)
- **BARU**: Rekod tarikh dan masa penyelesaian aduan
- **BARU**: Rekod siapa yang menyelesaikan aduan
- **BARU**: Warden boleh muat naik gambar bukti penyelesaian
- **BARU**: Pelajar boleh lihat gambar bukti penyelesaian dari warden

Modul Pengurusan Warden
- Paparan senarai warden
- Kelulusan pendaftaran warden baru
- Aktif/Nyahaktif akaun warden

Modul Dashboard
- Statistik ringkas untuk setiap jenis pengguna
- Bilangan pelajar, bilik, aduan
- Aduan terkini dan status


## 5. Seni Bina Sistem

Frontend (Bahagian Hadapan)
- Dibangunkan menggunakan React.js
- Single Page Application (SPA)
- Responsive design untuk semua saiz skrin
- Komponen boleh guna semula

Backend (Bahagian Belakang)
- Dibangunkan menggunakan PHP
- RESTful API architecture
- Endpoint untuk setiap operasi CRUD

Pangkalan Data
- MySQL sebagai sistem pengurusan pangkalan data
- Jadual utama: users, students, wardens, admins, rooms, complaints, notifications
- Trigger automatik untuk kemaskini status bilik


## 6. Aliran Kerja Sistem

Aliran Pendaftaran Pelajar
1. Pelajar mendaftar dengan memasukkan nama, no matrik, telefon dan kata laluan
2. Akaun terus aktif dan pelajar boleh login
3. Pelajar perlu lengkapkan profil selepas login pertama
4. SuperAdmin boleh tetapkan bilik kepada pelajar

Aliran Pendaftaran Warden
1. Warden mendaftar dengan memasukkan nama, staff ID, telefon dan kata laluan
2. Akaun dalam status pending
3. SuperAdmin menerima notifikasi pendaftaran baru
4. SuperAdmin meluluskan atau menolak pendaftaran
5. Warden menerima notifikasi keputusan

Aliran Aduan
1. Pelajar login dan pergi ke halaman aduan
2. Pelajar isi borang aduan dengan kategori, keutamaan dan penerangan
3. Pelajar boleh muat naik gambar sebagai bukti
4. Aduan dihantar dan status menjadi Submitted
5. Warden atau SuperAdmin melihat aduan
6. Status dikemaskini mengikut tindakan yang diambil
7. Komen boleh ditambah untuk komunikasi
8. **BARU**: Warden muat naik gambar bukti penyelesaian sebelum tutup aduan
9. **BARU**: Warden tukar status kepada Resolved
10. **BARU**: Sistem automatik rekod tarikh, masa dan siapa yang selesaikan
11. **BARU**: Pelajar boleh lihat gambar bukti penyelesaian dan tarikh diselesaikan

Aliran Import Pelajar
1. SuperAdmin pergi ke halaman Import Students
2. Muat naik fail Excel dengan format yang betul
3. Sistem membaca dan memaparkan data untuk semakan
4. SuperAdmin sahkan untuk import
5. Akaun pelajar dicipta dengan kata laluan default (No Matrik)
6. Bilik ditetapkan secara automatik jika ada dalam Excel


## 7. Keselamatan Sistem

- Kata laluan disimpan dalam bentuk hash menggunakan bcrypt
- Validasi input di bahagian frontend dan backend
- Prepared statements untuk elak SQL injection
- Session timeout untuk keselamatan
- HTTPS untuk enkripsi data dalam transit


## 8. Teknologi dan Framework

React.js (2024). React - A JavaScript library for building user interfaces. Diakses dari https://react.dev/

PHP Group (2024). PHP: Hypertext Preprocessor. Diakses dari https://www.php.net/

MySQL (2024). MySQL Database Management System. Oracle Corporation. Diakses dari https://www.mysql.com/

Axios (2024). Promise based HTTP client for the browser and node.js. Diakses dari https://axios-http.com/

SheetJS (2024). XLSX - Parser and writer for spreadsheet formats. Diakses dari https://sheetjs.com/


## 9. Dokumentasi Teknikal

Mozilla Developer Network (2024). JavaScript Guide. Diakses dari https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide

W3Schools (2024). PHP Tutorial. Diakses dari https://www.w3schools.com/php/

React Router (2024). Declarative routing for React. Diakses dari https://reactrouter.com/


## 10. Keselamatan Web

OWASP Foundation (2024). OWASP Top Ten Web Application Security Risks. Diakses dari https://owasp.org/www-project-top-ten/

PHP Manual (2024). Password Hashing Functions. Diakses dari https://www.php.net/manual/en/function.password-hash.php


## 11. Reka Bentuk Antaramuka

Nielsen, J. (2020). 10 Usability Heuristics for User Interface Design. Nielsen Norman Group. Diakses dari https://www.nngroup.com/articles/ten-usability-heuristics/

Google Fonts (2024). Inter Font Family. Diakses dari https://fonts.google.com/specimen/Inter


## 12. Deployment dan Hosting

Nginx (2024). Nginx HTTP Server Documentation. Diakses dari https://nginx.org/en/docs/

Let's Encrypt (2024). Free SSL/TLS Certificates. Diakses dari https://letsencrypt.org/

DigitalOcean (2024). How To Install Linux, Nginx, MySQL, PHP (LEMP stack) on Ubuntu. Diakses dari https://www.digitalocean.com/community/tutorials/how-to-install-linux-nginx-mysql-php-lemp-stack-on-ubuntu


## 13. Pengurusan Pangkalan Data

MySQL Documentation (2024). MySQL 8.0 Reference Manual. Oracle Corporation. Diakses dari https://dev.mysql.com/doc/refman/8.0/en/

PDO PHP Manual (2024). PHP Data Objects. Diakses dari https://www.php.net/manual/en/book.pdo.php


## 14. Rujukan Tambahan


Node.js (2024). Node.js Documentation. Diakses dari https://nodejs.org/en/docs/

npm (2024). npm Documentation. Diakses dari https://docs.npmjs.com/
