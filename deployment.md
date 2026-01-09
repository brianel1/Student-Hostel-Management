# Panduan Deploy VPS - KKTM Hostel Management

Domain: hostelmanagement.echomedia.my
Path: /var/www/Student-Hostel-Management


## Langkah 1: Update API URL untuk Production

Sebelum build, tukar API URL dalam frontend/src/services/api.js:

const API_URL = 'https://hostelmanagement.echomedia.my/api';


## Langkah 2: Build Frontend (Local Machine)

Buka terminal dalam folder frontend:

npm install
npm run build

Folder "build" akan terhasil.


## Langkah 3: Setup VPS

SSH ke VPS dan install dependencies:

sudo apt update
sudo apt install nginx php8.1-fpm php8.1-mysql mysql-server certbot python3-certbot-nginx git -y


## Langkah 4: Clone Repository

cd /var/www
sudo git clone https://github.com/brianel1/Student-Hostel-Management.git
sudo chown -R www-data:www-data Student-Hostel-Management
sudo chmod -R 755 Student-Hostel-Management


## Langkah 5: Upload Build Folder

Dari local machine, upload build folder ke VPS:

scp -r frontend/build/* user@your-vps-ip:/var/www/Student-Hostel-Management/frontend/build/

Atau guna FileZilla untuk upload.


## Langkah 6: Setup Database

sudo mysql -u root -p

Dalam MySQL:

CREATE USER 'hosteluser'@'localhost' IDENTIFIED BY 'Hostel@1337';
GRANT ALL PRIVILEGES ON kktm_ledang_hostel.* TO 'hosteluser'@'localhost';
FLUSH PRIVILEGES;
EXIT;

Import schema:

sudo mysql -u hosteluser -p < /var/www/Student-Hostel-Management/backend/database/schema.sql

Masukkan password: Hostel@1337


## Langkah 7: Update Database Config

Edit file backend/config/database.php:

sudo nano /var/www/Student-Hostel-Management/backend/config/database.php

Tukar kepada:

private $host = "localhost";
private $db_name = "kktm_ledang_hostel";
private $username = "hosteluser";
private $password = "Hostel@1337";


## Langkah 8: Create Nginx Config

sudo nano /etc/nginx/sites-available/hostelmanagement

Paste config ini:

server {
    listen 80;
    server_name hostelmanagement.echomedia.my www.hostelmanagement.echomedia.my;
    root /var/www/Student-Hostel-Management/frontend/build;
    index index.html;

    # Frontend React App
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend PHP API
    location /api {
        alias /var/www/Student-Hostel-Management/backend/api;
        index index.php;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }

    # Uploads folder
    location /uploads {
        alias /var/www/Student-Hostel-Management/backend/uploads;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}


## Langkah 9: Enable Site

sudo ln -s /etc/nginx/sites-available/hostelmanagement /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx


## Langkah 10: Setup SSL Certificate

sudo certbot --nginx -d hostelmanagement.echomedia.my -d www.hostelmanagement.echomedia.my

Ikut arahan certbot. Pilih redirect HTTP ke HTTPS.


## Langkah 11: Create Uploads Folder

sudo mkdir -p /var/www/Student-Hostel-Management/backend/uploads
sudo chown -R www-data:www-data /var/www/Student-Hostel-Management/backend/uploads
sudo chmod -R 755 /var/www/Student-Hostel-Management/backend/uploads


## Langkah 12: Test

Buka browser dan pergi ke:
https://hostelmanagement.echomedia.my

Login dengan:
- Username: admin
- Password: password


## Troubleshooting

Kalau ada error, check log:

sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/php8.1-fpm.log

Kalau permission error:

sudo chown -R www-data:www-data /var/www/Student-Hostel-Management
sudo chmod -R 755 /var/www/Student-Hostel-Management

Kalau PHP error:

sudo systemctl restart php8.1-fpm
sudo systemctl restart nginx
