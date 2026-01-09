<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $status = isset($_GET['status']) ? $_GET['status'] : null;
        
        $query = "SELECT w.*, u.name, u.phone, u.status 
                  FROM wardens w 
                  JOIN users u ON w.user_id = u.id";
        
        if ($status) {
            $query .= " WHERE u.status = :status";
        }
        $query .= " ORDER BY u.name";
        
        $stmt = $db->prepare($query);
        if ($status) $stmt->bindParam(":status", $status);
        $stmt->execute();
        
        echo json_encode(["success" => true, "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data || !isset($data->user_id) || !isset($data->status)) {
            echo json_encode(["success" => false, "message" => "User ID and status required"]);
            exit;
        }
        
        try {
            $db->beginTransaction();
            
            // Get warden info
            $getQuery = "SELECT u.name FROM users u WHERE u.id = :user_id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(":user_id", $data->user_id);
            $getStmt->execute();
            $warden = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            $query = "UPDATE users SET status = :status WHERE id = :user_id AND role = 'warden'";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":status", $data->status);
            $stmt->bindParam(":user_id", $data->user_id);
            $stmt->execute();
            
            // Notify the warden about their status
            $notifQuery = "INSERT INTO notifications (user_id, title, message, type) 
                          VALUES (:user_id, :title, :message, 'system')";
            $notifStmt = $db->prepare($notifQuery);
            $notifStmt->bindParam(":user_id", $data->user_id);
            
            if ($data->status === 'active') {
                $title = "Account Approved";
                $message = "Your warden account has been approved. You can now access the system.";
            } else if ($data->status === 'rejected') {
                $title = "Account Rejected";
                $message = "Your warden account has been rejected.";
            } else {
                $title = "Account Status Changed";
                $message = "Your account status has been updated.";
            }
            
            $notifStmt->bindParam(":title", $title);
            $notifStmt->bindParam(":message", $message);
            $notifStmt->execute();
            
            $db->commit();
            echo json_encode(["success" => true, "message" => "Warden status updated"]);
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
        break;
}
