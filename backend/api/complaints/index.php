<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getComplaints($db);
        break;
    case 'POST':
        createComplaint($db);
        break;
    case 'PUT':
        updateComplaint($db);
        break;
    case 'DELETE':
        deleteComplaint($db);
        break;
    default:
        echo json_encode(["success" => false, "message" => "Method not allowed"]);
}

function getComplaints($db) {
    $studentId = isset($_GET['student_id']) ? $_GET['student_id'] : null;
    $status = isset($_GET['status']) ? $_GET['status'] : null;
    
    $query = "SELECT c.*, s.matric_no, u.name as student_name, r.block, r.room_no,
              ru.name as resolved_by_name
              FROM complaints c 
              JOIN students s ON c.student_id = s.id 
              JOIN users u ON s.user_id = u.id 
              LEFT JOIN rooms r ON c.room_id = r.id 
              LEFT JOIN users ru ON c.resolved_by = ru.id
              WHERE 1=1";
    
    if ($studentId) {
        $query .= " AND c.student_id = :student_id";
    }
    if ($status) {
        $query .= " AND c.status = :status";
    }
    $query .= " ORDER BY c.created_at DESC";
    
    $stmt = $db->prepare($query);
    if ($studentId) $stmt->bindParam(":student_id", $studentId);
    if ($status) $stmt->bindParam(":status", $status);
    $stmt->execute();
    
    $complaints = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($complaints as &$complaint) {
        // Get all images with type
        $imgQuery = "SELECT image_path, uploaded_by FROM complaint_images WHERE complaint_id = :id ORDER BY created_at ASC";
        $imgStmt = $db->prepare($imgQuery);
        $imgStmt->bindParam(":id", $complaint['id']);
        $imgStmt->execute();
        $images = $imgStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Separate student and warden images
        $complaint['images'] = array_column(array_filter($images, function($img) {
            return $img['uploaded_by'] === 'student';
        }), 'image_path');
        
        $complaint['resolution_images'] = array_column(array_filter($images, function($img) {
            return $img['uploaded_by'] === 'warden';
        }), 'image_path');
    }
    
    echo json_encode(["success" => true, "data" => $complaints]);
}

function createComplaint($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!$data || !isset($data->student_id) || !isset($data->category) || !isset($data->description)) {
        echo json_encode(["success" => false, "message" => "Required fields missing"]);
        return;
    }
    
    try {
        $db->beginTransaction();
        
        $query = "INSERT INTO complaints (student_id, room_id, category, priority, description) 
                  VALUES (:student_id, :room_id, :category, :priority, :description)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":student_id", $data->student_id);
        $stmt->bindParam(":room_id", $data->room_id);
        $stmt->bindParam(":category", $data->category);
        $stmt->bindParam(":priority", $data->priority);
        $stmt->bindParam(":description", $data->description);
        $stmt->execute();
        
        $complaintId = $db->lastInsertId();
        
        // Get student name for notification
        $studentQuery = "SELECT u.name FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = :student_id";
        $studentStmt = $db->prepare($studentQuery);
        $studentStmt->bindParam(":student_id", $data->student_id);
        $studentStmt->execute();
        $studentName = $studentStmt->fetch(PDO::FETCH_ASSOC)['name'];
        
        // Create notifications for all wardens and superadmin
        $wardenQuery = "SELECT id FROM users WHERE role IN ('warden', 'superadmin') AND status = 'active'";
        $wardenStmt = $db->query($wardenQuery);
        $wardens = $wardenStmt->fetchAll(PDO::FETCH_ASSOC);
        
        $priorityText = $data->priority === 'high' ? 'HIGH PRIORITY: ' : '';
        foreach ($wardens as $warden) {
            $notifQuery = "INSERT INTO notifications (user_id, title, message, type, reference_id) 
                          VALUES (:user_id, :title, :message, 'complaint', :reference_id)";
            $notifStmt = $db->prepare($notifQuery);
            $notifStmt->bindParam(":user_id", $warden['id']);
            $title = $priorityText . "New Complaint";
            $notifStmt->bindParam(":title", $title);
            $message = "New " . $data->category . " complaint submitted by " . $studentName;
            $notifStmt->bindParam(":message", $message);
            $notifStmt->bindParam(":reference_id", $complaintId);
            $notifStmt->execute();
        }
        
        $db->commit();
        echo json_encode(["success" => true, "message" => "Complaint submitted", "id" => $complaintId]);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}

function updateComplaint($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!$data || !isset($data->id) || !isset($data->status)) {
        echo json_encode(["success" => false, "message" => "ID and status required"]);
        return;
    }
    
    try {
        $db->beginTransaction();
        
        // Get complaint info before update
        $getQuery = "SELECT c.*, s.user_id as student_user_id, u.name as student_name 
                     FROM complaints c 
                     JOIN students s ON c.student_id = s.id 
                     JOIN users u ON s.user_id = u.id 
                     WHERE c.id = :id";
        $getStmt = $db->prepare($getQuery);
        $getStmt->bindParam(":id", $data->id);
        $getStmt->execute();
        $complaint = $getStmt->fetch(PDO::FETCH_ASSOC);
        
        // Check if status is changing to resolved
        $resolvedAt = null;
        $resolvedBy = null;
        if ($data->status === 'resolved' && $complaint['status'] !== 'resolved') {
            $resolvedAt = date('Y-m-d H:i:s');
            $resolvedBy = isset($data->resolved_by) ? $data->resolved_by : null;
        }
        
        // Update complaint with resolved info
        if ($resolvedAt) {
            $query = "UPDATE complaints SET status = :status, resolved_at = :resolved_at, resolved_by = :resolved_by WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":status", $data->status);
            $stmt->bindParam(":resolved_at", $resolvedAt);
            $stmt->bindParam(":resolved_by", $resolvedBy);
            $stmt->bindParam(":id", $data->id);
        } else {
            $query = "UPDATE complaints SET status = :status WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":status", $data->status);
            $stmt->bindParam(":id", $data->id);
        }
        $stmt->execute();
        
        // Notify student about status change
        if ($complaint && $complaint['status'] !== $data->status) {
            $notifQuery = "INSERT INTO notifications (user_id, title, message, type, reference_id) 
                          VALUES (:user_id, :title, :message, 'complaint', :reference_id)";
            $notifStmt = $db->prepare($notifQuery);
            $notifStmt->bindParam(":user_id", $complaint['student_user_id']);
            $title = "Complaint Status Updated";
            $notifStmt->bindParam(":title", $title);
            $statusText = str_replace('_', ' ', ucfirst($data->status));
            $message = "Your " . $complaint['category'] . " complaint status has been updated to: " . $statusText;
            $notifStmt->bindParam(":message", $message);
            $notifStmt->bindParam(":reference_id", $data->id);
            $notifStmt->execute();
        }
        
        $db->commit();
        echo json_encode(["success" => true, "message" => "Complaint updated"]);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}

function deleteComplaint($db) {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    
    if (!$id) {
        echo json_encode(["success" => false, "message" => "Complaint ID required"]);
        return;
    }
    
    try {
        $db->beginTransaction();
        
        // Get complaint images to delete files
        $imgQuery = "SELECT image_path FROM complaint_images WHERE complaint_id = :id";
        $imgStmt = $db->prepare($imgQuery);
        $imgStmt->bindParam(":id", $id);
        $imgStmt->execute();
        $images = $imgStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Delete image files from server
        foreach ($images as $image) {
            $filePath = '../../' . $image['image_path'];
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }
        
        // Delete complaint images from database
        $deleteImgQuery = "DELETE FROM complaint_images WHERE complaint_id = :id";
        $deleteImgStmt = $db->prepare($deleteImgQuery);
        $deleteImgStmt->bindParam(":id", $id);
        $deleteImgStmt->execute();
        
        // Delete comments
        $deleteCommentsQuery = "DELETE FROM complaint_comments WHERE complaint_id = :id";
        $deleteCommentsStmt = $db->prepare($deleteCommentsQuery);
        $deleteCommentsStmt->bindParam(":id", $id);
        $deleteCommentsStmt->execute();
        
        // Delete notifications related to this complaint
        $deleteNotifsQuery = "DELETE FROM notifications WHERE reference_id = :id AND type = 'complaint'";
        $deleteNotifsStmt = $db->prepare($deleteNotifsQuery);
        $deleteNotifsStmt->bindParam(":id", $id);
        $deleteNotifsStmt->execute();
        
        // Delete the complaint
        $deleteQuery = "DELETE FROM complaints WHERE id = :id";
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->bindParam(":id", $id);
        $deleteStmt->execute();
        
        $db->commit();
        echo json_encode(["success" => true, "message" => "Complaint deleted successfully"]);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}
