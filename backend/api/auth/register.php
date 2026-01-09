<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->name) || !isset($data->password) || !isset($data->role)) {
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit;
}

// Check matric_no for students
if ($data->role === 'student') {
    if (!isset($data->matric_no) || empty($data->matric_no)) {
        echo json_encode(["success" => false, "message" => "Matric number is required"]);
        exit;
    }
    $checkMatric = "SELECT id FROM students WHERE matric_no = :matric_no";
    $checkMatricStmt = $db->prepare($checkMatric);
    $checkMatricStmt->bindParam(":matric_no", $data->matric_no);
    $checkMatricStmt->execute();
    if ($checkMatricStmt->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "Matric number already registered"]);
        exit;
    }
}

// Check staff_id for wardens
if ($data->role === 'warden') {
    if (!isset($data->staff_id) || empty($data->staff_id)) {
        echo json_encode(["success" => false, "message" => "Staff ID is required"]);
        exit;
    }
    $checkStaff = "SELECT id FROM wardens WHERE staff_id = :staff_id";
    $checkStaffStmt = $db->prepare($checkStaff);
    $checkStaffStmt->bindParam(":staff_id", $data->staff_id);
    $checkStaffStmt->execute();
    if ($checkStaffStmt->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "Staff ID already registered"]);
        exit;
    }
}

try {
    $db->beginTransaction();
    
    $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);
    $status = ($data->role === 'warden') ? 'pending' : 'active';
    
    // Process phone number - add "0" prefix if starts with "1" (Malaysia format)
    $phone = isset($data->phone) ? trim($data->phone) : null;
    if ($phone) {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (substr($phone, 0, 1) === '1') {
            $phone = '0' . $phone;
        }
    }
    
    $query = "INSERT INTO users (name, phone, password, role, status) VALUES (:name, :phone, :password, :role, :status)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":name", $data->name);
    $stmt->bindParam(":phone", $phone);
    $stmt->bindParam(":password", $hashedPassword);
    $stmt->bindParam(":role", $data->role);
    $stmt->bindParam(":status", $status);
    $stmt->execute();
    
    $userId = $db->lastInsertId();
    
    if ($data->role === 'student') {
        $studentQuery = "INSERT INTO students (user_id, matric_no) VALUES (:user_id, :matric_no)";
        $studentStmt = $db->prepare($studentQuery);
        $studentStmt->bindParam(":user_id", $userId);
        $studentStmt->bindParam(":matric_no", $data->matric_no);
        $studentStmt->execute();
    } elseif ($data->role === 'warden') {
        $wardenQuery = "INSERT INTO wardens (user_id, staff_id) VALUES (:user_id, :staff_id)";
        $wardenStmt = $db->prepare($wardenQuery);
        $wardenStmt->bindParam(":user_id", $userId);
        $wardenStmt->bindParam(":staff_id", $data->staff_id);
        $wardenStmt->execute();
        
        // Notify all superadmins about new warden registration
        $adminQuery = "SELECT id FROM users WHERE role = 'superadmin' AND status = 'active'";
        $adminStmt = $db->query($adminQuery);
        $admins = $adminStmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($admins as $admin) {
            $notifQuery = "INSERT INTO notifications (user_id, title, message, type, reference_id) 
                          VALUES (:user_id, :title, :message, 'warden', :reference_id)";
            $notifStmt = $db->prepare($notifQuery);
            $notifStmt->bindParam(":user_id", $admin['id']);
            $title = "New Warden Registration";
            $notifStmt->bindParam(":title", $title);
            $message = $data->name . " has registered as warden and is pending approval.";
            $notifStmt->bindParam(":message", $message);
            $notifStmt->bindParam(":reference_id", $userId);
            $notifStmt->execute();
        }
    }
    
    $db->commit();
    
    $message = ($data->role === 'warden') 
        ? "Registration successful. Please wait for admin approval." 
        : "Registration successful. You can now login.";
    
    echo json_encode(["success" => true, "message" => $message]);
    
} catch (Exception $e) {
    $db->rollBack();
    echo json_encode(["success" => false, "message" => "Registration failed: " . $e->getMessage()]);
}
