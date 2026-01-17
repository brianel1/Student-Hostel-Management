-- KKTM-Ledang Hostel Management Database Schema
DROP DATABASE IF EXISTS kktm_ledang_hostel;
CREATE DATABASE kktm_ledang_hostel;
USE kktm_ledang_hostel;

-- Users table (base table for all users)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'warden', 'student') NOT NULL,
    status ENUM('active', 'pending', 'rejected') DEFAULT 'active',
    profile_completed TINYINT(1) DEFAULT 0,
    avatar VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admin table (for superadmin login with username)
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Rooms table
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    block VARCHAR(10) NOT NULL,
    room_no VARCHAR(20) NOT NULL,
    capacity INT DEFAULT 4,
    status ENUM('available', 'full', 'maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_room (block, room_no)
);

-- Students table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    matric_no VARCHAR(50) UNIQUE NOT NULL,
    room_id INT,
    semester INT DEFAULT 1,
    program VARCHAR(100),
    ic_number VARCHAR(20),
    address TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

-- Wardens table
CREATE TABLE wardens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    staff_id VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Complaints table
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    room_id INT,
    category ENUM('electric', 'water', 'furniture', 'internet', 'other') NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('submitted', 'in_review', 'in_progress', 'resolved', 'rejected') DEFAULT 'submitted',
    description TEXT NOT NULL,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    resolved_by INT NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Complaint images table
CREATE TABLE complaint_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    uploaded_by ENUM('student', 'warden') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

-- Complaint comments table
CREATE TABLE complaint_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('complaint', 'warden', 'room', 'system') DEFAULT 'system',
    reference_id INT DEFAULT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- TRIGGERS FOR AUTO-UPDATE ROOM STATUS
-- =============================================
DELIMITER //
CREATE TRIGGER update_room_status_after_student_insert
AFTER INSERT ON students
FOR EACH ROW
BEGIN
    IF NEW.room_id IS NOT NULL THEN
        UPDATE rooms SET status = 
            CASE 
                WHEN (SELECT COUNT(*) FROM students WHERE room_id = NEW.room_id) >= capacity THEN 'full'
                ELSE 'available'
            END
        WHERE id = NEW.room_id AND status != 'maintenance';
    END IF;
END//

CREATE TRIGGER update_room_status_after_student_update
AFTER UPDATE ON students
FOR EACH ROW
BEGIN
    IF OLD.room_id IS NOT NULL AND (OLD.room_id != NEW.room_id OR NEW.room_id IS NULL) THEN
        UPDATE rooms SET status = 
            CASE 
                WHEN (SELECT COUNT(*) FROM students WHERE room_id = OLD.room_id) >= capacity THEN 'full'
                ELSE 'available'
            END
        WHERE id = OLD.room_id AND status != 'maintenance';
    END IF;
    IF NEW.room_id IS NOT NULL THEN
        UPDATE rooms SET status = 
            CASE 
                WHEN (SELECT COUNT(*) FROM students WHERE room_id = NEW.room_id) >= capacity THEN 'full'
                ELSE 'available'
            END
        WHERE id = NEW.room_id AND status != 'maintenance';
    END IF;
END//

CREATE TRIGGER update_room_status_after_student_delete
AFTER DELETE ON students
FOR EACH ROW
BEGIN
    IF OLD.room_id IS NOT NULL THEN
        UPDATE rooms SET status = 'available'
        WHERE id = OLD.room_id AND status != 'maintenance';
    END IF;
END//
DELIMITER ;

-- =============================================
-- INSERT DEFAULT SUPERADMIN
-- =============================================
-- SuperAdmin (username: admin, password: password)
INSERT INTO users (id, name, phone, password, role, status, profile_completed) VALUES
(1, 'Super Admin', '0123456789', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin', 'active', 1);

INSERT INTO admins (user_id, username) VALUES (1, 'admin');
