<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        
        if ($id) {
            $query = "SELECT r.*, COUNT(s.id) as occupants FROM rooms r 
                      LEFT JOIN students s ON r.id = s.room_id 
                      WHERE r.id = :id GROUP BY r.id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $id);
        } else {
            $query = "SELECT r.*, COUNT(s.id) as occupants FROM rooms r 
                      LEFT JOIN students s ON r.id = s.room_id 
                      GROUP BY r.id ORDER BY r.block, r.room_no";
            $stmt = $db->prepare($query);
        }
        $stmt->execute();
        
        $data = $id ? $stmt->fetch(PDO::FETCH_ASSOC) : $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "data" => $data]);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data || !isset($data->block) || !isset($data->room_no)) {
            echo json_encode(["success" => false, "message" => "Block and room number required"]);
            exit;
        }
        
        $query = "INSERT INTO rooms (block, room_no, capacity, status) VALUES (:block, :room_no, :capacity, :status)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":block", $data->block);
        $stmt->bindParam(":room_no", $data->room_no);
        $capacity = isset($data->capacity) ? $data->capacity : 4;
        $stmt->bindParam(":capacity", $capacity);
        $status = isset($data->status) ? $data->status : 'available';
        $stmt->bindParam(":status", $status);
        $stmt->execute();
        
        echo json_encode(["success" => true, "message" => "Room created", "id" => $db->lastInsertId()]);
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data || !isset($data->id)) {
            echo json_encode(["success" => false, "message" => "Room ID required"]);
            exit;
        }
        
        $fields = [];
        $params = [":id" => $data->id];
        
        if (isset($data->block)) { $fields[] = "block = :block"; $params[":block"] = $data->block; }
        if (isset($data->room_no)) { $fields[] = "room_no = :room_no"; $params[":room_no"] = $data->room_no; }
        if (isset($data->capacity)) { $fields[] = "capacity = :capacity"; $params[":capacity"] = $data->capacity; }
        if (isset($data->status)) { $fields[] = "status = :status"; $params[":status"] = $data->status; }
        
        $query = "UPDATE rooms SET " . implode(", ", $fields) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        // Auto-recalculate status based on current occupancy vs capacity (unless maintenance)
        $recalcQuery = "UPDATE rooms r SET status = 
            CASE 
                WHEN r.status = 'maintenance' THEN 'maintenance'
                WHEN (SELECT COUNT(*) FROM students WHERE room_id = r.id) >= r.capacity THEN 'full'
                ELSE 'available'
            END
            WHERE r.id = :room_id";
        $recalcStmt = $db->prepare($recalcQuery);
        $recalcStmt->bindParam(":room_id", $data->id);
        $recalcStmt->execute();
        
        echo json_encode(["success" => true, "message" => "Room updated"]);
        break;
        
    case 'DELETE':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        
        if (!$id) {
            echo json_encode(["success" => false, "message" => "Room ID required"]);
            exit;
        }
        
        $query = "DELETE FROM rooms WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        
        echo json_encode(["success" => true, "message" => "Room deleted"]);
        break;
}
