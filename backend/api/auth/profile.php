<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;
        if (!$userId) {
            echo json_encode(["success" => false, "message" => "User ID required"]);
            exit;
        }
        
        $query = "SELECT u.*, s.matric_no, s.semester, s.program, s.ic_number, s.address, 
                         s.emergency_contact, s.emergency_phone, s.room_id, s.id as student_id,
                         r.block, r.room_no
                  FROM users u 
                  LEFT JOIN students s ON u.id = s.user_id 
                  LEFT JOIN rooms r ON s.room_id = r.id
                  WHERE u.id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user) {
            unset($user['password']);
            echo json_encode(["success" => true, "data" => $user]);
        } else {
            echo json_encode(["success" => false, "message" => "User not found"]);
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data || !isset($data->user_id)) {
            echo json_encode(["success" => false, "message" => "User ID required"]);
            exit;
        }
        
        try {
            $db->beginTransaction();
            
            // Update users table
            $userFields = [];
            $userParams = [":user_id" => $data->user_id];
            
            if (isset($data->name)) { $userFields[] = "name = :name"; $userParams[":name"] = $data->name; }
            if (isset($data->phone)) { $userFields[] = "phone = :phone"; $userParams[":phone"] = $data->phone; }
            if (isset($data->profile_completed)) { $userFields[] = "profile_completed = :profile_completed"; $userParams[":profile_completed"] = $data->profile_completed; }
            
            if (!empty($userFields)) {
                $query = "UPDATE users SET " . implode(", ", $userFields) . " WHERE id = :user_id";
                $stmt = $db->prepare($query);
                $stmt->execute($userParams);
            }
            
            // Update students table if student data provided
            if (isset($data->student_id)) {
                $studentFields = [];
                $studentParams = [":student_id" => $data->student_id];
                
                if (isset($data->semester)) { $studentFields[] = "semester = :semester"; $studentParams[":semester"] = $data->semester; }
                if (isset($data->program)) { $studentFields[] = "program = :program"; $studentParams[":program"] = $data->program; }
                if (isset($data->ic_number)) { $studentFields[] = "ic_number = :ic_number"; $studentParams[":ic_number"] = $data->ic_number; }
                if (isset($data->address)) { $studentFields[] = "address = :address"; $studentParams[":address"] = $data->address; }
                if (isset($data->emergency_contact)) { $studentFields[] = "emergency_contact = :emergency_contact"; $studentParams[":emergency_contact"] = $data->emergency_contact; }
                if (isset($data->emergency_phone)) { $studentFields[] = "emergency_phone = :emergency_phone"; $studentParams[":emergency_phone"] = $data->emergency_phone; }
                
                if (!empty($studentFields)) {
                    $query = "UPDATE students SET " . implode(", ", $studentFields) . " WHERE id = :student_id";
                    $stmt = $db->prepare($query);
                    $stmt->execute($studentParams);
                }
            }
            
            $db->commit();
            echo json_encode(["success" => true, "message" => "Profile updated successfully"]);
            
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(["success" => false, "message" => "Update failed: " . $e->getMessage()]);
        }
        break;
}
