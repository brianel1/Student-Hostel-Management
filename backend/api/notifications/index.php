<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;
        $unreadOnly = isset($_GET['unread']) ? $_GET['unread'] === 'true' : false;
        
        if (!$userId) {
            echo json_encode(["success" => false, "message" => "User ID required"]);
            exit;
        }
        
        $query = "SELECT * FROM notifications WHERE user_id = :user_id";
        if ($unreadOnly) {
            $query .= " AND is_read = 0";
        }
        $query .= " ORDER BY created_at DESC LIMIT 20";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get unread count
        $countQuery = "SELECT COUNT(*) as count FROM notifications WHERE user_id = :user_id AND is_read = 0";
        $countStmt = $db->prepare($countQuery);
        $countStmt->bindParam(":user_id", $userId);
        $countStmt->execute();
        $unreadCount = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        echo json_encode([
            "success" => true, 
            "data" => $notifications,
            "unread_count" => (int)$unreadCount
        ]);
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data) {
            echo json_encode(["success" => false, "message" => "Invalid data"]);
            exit;
        }
        
        // Mark single notification as read
        if (isset($data->id)) {
            $query = "UPDATE notifications SET is_read = 1 WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $data->id);
            $stmt->execute();
        }
        
        // Mark all as read for user
        if (isset($data->user_id) && isset($data->mark_all_read) && $data->mark_all_read) {
            $query = "UPDATE notifications SET is_read = 1 WHERE user_id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":user_id", $data->user_id);
            $stmt->execute();
        }
        
        echo json_encode(["success" => true, "message" => "Notification updated"]);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data || !isset($data->user_id) || !isset($data->title) || !isset($data->message)) {
            echo json_encode(["success" => false, "message" => "Required fields missing"]);
            exit;
        }
        
        $query = "INSERT INTO notifications (user_id, title, message, type, reference_id) 
                  VALUES (:user_id, :title, :message, :type, :reference_id)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $data->user_id);
        $stmt->bindParam(":title", $data->title);
        $stmt->bindParam(":message", $data->message);
        $type = isset($data->type) ? $data->type : 'system';
        $stmt->bindParam(":type", $type);
        $refId = isset($data->reference_id) ? $data->reference_id : null;
        $stmt->bindParam(":reference_id", $refId);
        $stmt->execute();
        
        echo json_encode(["success" => true, "message" => "Notification created", "id" => $db->lastInsertId()]);
        break;
}
