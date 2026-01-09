<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $complaintId = isset($_GET['complaint_id']) ? $_GET['complaint_id'] : null;
        if (!$complaintId) {
            echo json_encode(["success" => false, "message" => "Complaint ID required"]);
            exit;
        }
        
        $query = "SELECT cc.*, u.name, u.role FROM complaint_comments cc 
                  JOIN users u ON cc.user_id = u.id 
                  WHERE cc.complaint_id = :complaint_id 
                  ORDER BY cc.created_at ASC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":complaint_id", $complaintId);
        $stmt->execute();
        
        echo json_encode(["success" => true, "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data || !isset($data->complaint_id) || !isset($data->user_id) || !isset($data->comment)) {
            echo json_encode(["success" => false, "message" => "All fields required"]);
            exit;
        }
        
        $query = "INSERT INTO complaint_comments (complaint_id, user_id, comment) VALUES (:complaint_id, :user_id, :comment)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":complaint_id", $data->complaint_id);
        $stmt->bindParam(":user_id", $data->user_id);
        $stmt->bindParam(":comment", $data->comment);
        $stmt->execute();
        
        echo json_encode(["success" => true, "message" => "Comment added"]);
        break;
}
