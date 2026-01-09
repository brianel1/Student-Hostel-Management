<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        
        if ($id) {
            $query = "SELECT s.*, u.name, u.phone, u.status, r.block, r.room_no 
                      FROM students s 
                      JOIN users u ON s.user_id = u.id 
                      LEFT JOIN rooms r ON s.room_id = r.id 
                      WHERE s.id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $id);
        } else {
            $query = "SELECT s.*, u.name, u.phone, u.status, r.block, r.room_no 
                      FROM students s 
                      JOIN users u ON s.user_id = u.id 
                      LEFT JOIN rooms r ON s.room_id = r.id 
                      ORDER BY u.name";
            $stmt = $db->prepare($query);
        }
        $stmt->execute();
        
        $data = $id ? $stmt->fetch(PDO::FETCH_ASSOC) : $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "data" => $data]);
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data || !isset($data->id)) {
            echo json_encode(["success" => false, "message" => "Student ID required"]);
            exit;
        }
        
        // Update room assignment
        if (isset($data->room_id)) {
            // Get current student's room
            $currentQuery = "SELECT room_id FROM students WHERE id = :id";
            $currentStmt = $db->prepare($currentQuery);
            $currentStmt->bindParam(":id", $data->id);
            $currentStmt->execute();
            $currentStudent = $currentStmt->fetch(PDO::FETCH_ASSOC);
            $oldRoomId = $currentStudent ? $currentStudent['room_id'] : null;
            
            // If assigning to a new room (not removing)
            if ($data->room_id) {
                // Check room capacity (exclude current student if they're already in this room)
                $checkQuery = "SELECT r.capacity, COUNT(s.id) as occupants 
                              FROM rooms r LEFT JOIN students s ON r.id = s.room_id AND s.id != :student_id
                              WHERE r.id = :room_id GROUP BY r.id";
                $checkStmt = $db->prepare($checkQuery);
                $checkStmt->bindParam(":room_id", $data->room_id);
                $checkStmt->bindParam(":student_id", $data->id);
                $checkStmt->execute();
                $room = $checkStmt->fetch(PDO::FETCH_ASSOC);
                
                if ($room && $room['occupants'] >= $room['capacity']) {
                    echo json_encode(["success" => false, "message" => "Room is full"]);
                    exit;
                }
            }
            
            // Update student's room
            $query = "UPDATE students SET room_id = :room_id WHERE id = :id";
            $stmt = $db->prepare($query);
            $roomId = $data->room_id ?: null;
            $stmt->bindParam(":room_id", $roomId);
            $stmt->bindParam(":id", $data->id);
            $stmt->execute();
            
            // Update old room status if student was moved from another room
            if ($oldRoomId && $oldRoomId != $data->room_id) {
                $updateOldRoom = "UPDATE rooms r SET status = 
                    CASE 
                        WHEN (SELECT COUNT(*) FROM students WHERE room_id = r.id) < r.capacity THEN 'available'
                        ELSE 'full'
                    END
                    WHERE r.id = :room_id";
                $oldRoomStmt = $db->prepare($updateOldRoom);
                $oldRoomStmt->bindParam(":room_id", $oldRoomId);
                $oldRoomStmt->execute();
            }
            
            // Update new room status if assigned
            if ($data->room_id) {
                $updateNewRoom = "UPDATE rooms r SET status = 
                    CASE 
                        WHEN (SELECT COUNT(*) FROM students WHERE room_id = r.id) >= r.capacity THEN 'full'
                        ELSE 'available'
                    END
                    WHERE r.id = :room_id";
                $newRoomStmt = $db->prepare($updateNewRoom);
                $newRoomStmt->bindParam(":room_id", $data->room_id);
                $newRoomStmt->execute();
            }
        }
        
        echo json_encode(["success" => true, "message" => "Student updated"]);
        break;
        
    case 'DELETE':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        
        if (!$id) {
            echo json_encode(["success" => false, "message" => "Student ID required"]);
            exit;
        }
        
        try {
            $db->beginTransaction();
            
            // Get student's user_id and room_id first
            $getQuery = "SELECT user_id, room_id FROM students WHERE id = :id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(":id", $id);
            $getStmt->execute();
            $student = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$student) {
                echo json_encode(["success" => false, "message" => "Student not found"]);
                exit;
            }
            
            $userId = $student['user_id'];
            $roomId = $student['room_id'];
            
            // Delete student record (this will cascade to complaints via student_id)
            $deleteStudentQuery = "DELETE FROM students WHERE id = :id";
            $deleteStudentStmt = $db->prepare($deleteStudentQuery);
            $deleteStudentStmt->bindParam(":id", $id);
            $deleteStudentStmt->execute();
            
            // Delete user record (this will cascade to notifications)
            $deleteUserQuery = "DELETE FROM users WHERE id = :user_id";
            $deleteUserStmt = $db->prepare($deleteUserQuery);
            $deleteUserStmt->bindParam(":user_id", $userId);
            $deleteUserStmt->execute();
            
            // Update room status if student was assigned to a room
            if ($roomId) {
                $updateRoomQuery = "UPDATE rooms r SET status = 
                    CASE 
                        WHEN (SELECT COUNT(*) FROM students WHERE room_id = r.id) >= r.capacity THEN 'full'
                        ELSE 'available'
                    END
                    WHERE r.id = :room_id AND r.status != 'maintenance'";
                $updateRoomStmt = $db->prepare($updateRoomQuery);
                $updateRoomStmt->bindParam(":room_id", $roomId);
                $updateRoomStmt->execute();
            }
            
            $db->commit();
            echo json_encode(["success" => true, "message" => "Student deleted successfully"]);
            
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(["success" => false, "message" => "Delete failed: " . $e->getMessage()]);
        }
        break;
}
