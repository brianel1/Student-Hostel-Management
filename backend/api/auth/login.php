<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->username) || !isset($data->password)) {
    echo json_encode(["success" => false, "message" => "Username and password required"]);
    exit;
}

$username = strtoupper(trim($data->username));
$user = null;

// Try to find user by different identifiers based on role
// 1. Check if it's an admin (username)
$adminQuery = "SELECT u.*, a.username 
               FROM users u 
               JOIN admins a ON u.id = a.user_id 
               WHERE UPPER(a.username) = :username";
$adminStmt = $db->prepare($adminQuery);
$adminStmt->bindParam(":username", $username);
$adminStmt->execute();

if ($adminStmt->rowCount() > 0) {
    $user = $adminStmt->fetch(PDO::FETCH_ASSOC);
} else {
    // 2. Check if it's a warden (staff_id)
    $wardenQuery = "SELECT u.*, w.staff_id 
                    FROM users u 
                    JOIN wardens w ON u.id = w.user_id 
                    WHERE UPPER(w.staff_id) = :staff_id";
    $wardenStmt = $db->prepare($wardenQuery);
    $wardenStmt->bindParam(":staff_id", $username);
    $wardenStmt->execute();
    
    if ($wardenStmt->rowCount() > 0) {
        $user = $wardenStmt->fetch(PDO::FETCH_ASSOC);
    } else {
        // 3. Check if it's a student (matric_no)
        $studentQuery = "SELECT u.*, s.matric_no, s.room_id, s.id as student_id, s.semester, s.program,
                                r.block, r.room_no
                         FROM users u 
                         JOIN students s ON u.id = s.user_id 
                         LEFT JOIN rooms r ON s.room_id = r.id
                         WHERE UPPER(s.matric_no) = :matric_no";
        $studentStmt = $db->prepare($studentQuery);
        $studentStmt->bindParam(":matric_no", $username);
        $studentStmt->execute();
        
        if ($studentStmt->rowCount() > 0) {
            $user = $studentStmt->fetch(PDO::FETCH_ASSOC);
        }
    }
}

if ($user) {
    if (password_verify($data->password, $user['password'])) {
        if ($user['status'] === 'pending') {
            echo json_encode(["success" => false, "message" => "Account pending approval"]);
            exit;
        }
        if ($user['status'] === 'rejected') {
            echo json_encode(["success" => false, "message" => "Account has been rejected"]);
            exit;
        }
        
        unset($user['password']);
        echo json_encode(["success" => true, "user" => $user]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid password"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "User not found"]);
}
