<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->students) || !is_array($data->students)) {
    echo json_encode(["success" => false, "message" => "Invalid data format"]);
    exit;
}

$imported = 0;
$skipped = 0;
$errors = [];

try {
    $db->beginTransaction();
    
    foreach ($data->students as $student) {
        // Validate required fields
        if (empty($student->name) || empty($student->matric_no)) {
            $errors[] = "Missing required fields for student";
            continue;
        }
        
        $matricNo = strtoupper(trim($student->matric_no));
        
        // Check if student already exists
        $checkQuery = "SELECT id FROM students WHERE matric_no = :matric_no";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":matric_no", $matricNo);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            $skipped++;
            continue;
        }

        // Create user account with matric_no as password
        $hashedPassword = password_hash($matricNo, PASSWORD_DEFAULT);
        $name = trim($student->name);
        
        // Process phone number - add "0" prefix if starts with "1" (Malaysia format)
        $phone = isset($student->phone) ? trim($student->phone) : null;
        if ($phone) {
            // Remove any non-numeric characters first
            $phone = preg_replace('/[^0-9]/', '', $phone);
            // Add "0" prefix if starts with "1"
            if (substr($phone, 0, 1) === '1') {
                $phone = '0' . $phone;
            }
        }
        
        $userQuery = "INSERT INTO users (name, phone, password, role, status, profile_completed) 
                      VALUES (:name, :phone, :password, 'student', 'active', 0)";
        $userStmt = $db->prepare($userQuery);
        $userStmt->bindParam(":name", $name);
        $userStmt->bindParam(":phone", $phone);
        $userStmt->bindParam(":password", $hashedPassword);
        $userStmt->execute();
        
        $userId = $db->lastInsertId();
        
        // Find or create room if room data provided
        $roomId = null;
        if (!empty($student->room_block) && !empty($student->room_no)) {
            $roomBlock = trim($student->room_block);
            $roomNo = trim($student->room_no);
            
            // Check if room exists
            $roomQuery = "SELECT id FROM rooms WHERE block = :block AND room_no = :room_no";
            $roomStmt = $db->prepare($roomQuery);
            $roomStmt->bindParam(":block", $roomBlock);
            $roomStmt->bindParam(":room_no", $roomNo);
            $roomStmt->execute();
            
            if ($roomStmt->rowCount() > 0) {
                $roomId = $roomStmt->fetch(PDO::FETCH_ASSOC)['id'];
            } else {
                // Create room if it doesn't exist
                $createRoomQuery = "INSERT INTO rooms (block, room_no, capacity, status) VALUES (:block, :room_no, 4, 'available')";
                $createRoomStmt = $db->prepare($createRoomQuery);
                $createRoomStmt->bindParam(":block", $roomBlock);
                $createRoomStmt->bindParam(":room_no", $roomNo);
                $createRoomStmt->execute();
                $roomId = $db->lastInsertId();
            }
        }
        
        // Create student record
        $semester = isset($student->semester) ? intval($student->semester) : 1;
        
        $studentQuery = "INSERT INTO students (user_id, matric_no, room_id, semester) 
                         VALUES (:user_id, :matric_no, :room_id, :semester)";
        $studentStmt = $db->prepare($studentQuery);
        $studentStmt->bindParam(":user_id", $userId);
        $studentStmt->bindParam(":matric_no", $matricNo);
        $studentStmt->bindParam(":room_id", $roomId);
        $studentStmt->bindParam(":semester", $semester);
        $studentStmt->execute();
        
        $imported++;
    }
    
    $db->commit();
    
    // Update all room statuses based on actual occupancy
    $updateRoomsQuery = "UPDATE rooms r SET status = 
        CASE 
            WHEN (SELECT COUNT(*) FROM students WHERE room_id = r.id) >= r.capacity THEN 'full'
            WHEN (SELECT COUNT(*) FROM students WHERE room_id = r.id) > 0 THEN 'available'
            ELSE 'available'
        END
        WHERE r.status != 'maintenance'";
    $db->exec($updateRoomsQuery);
    
    echo json_encode([
        "success" => true,
        "message" => "Import completed",
        "imported" => $imported,
        "skipped" => $skipped,
        "errors" => $errors
    ]);
    
} catch (Exception $e) {
    $db->rollBack();
    echo json_encode([
        "success" => false,
        "message" => "Import failed: " . $e->getMessage()
    ]);
}
