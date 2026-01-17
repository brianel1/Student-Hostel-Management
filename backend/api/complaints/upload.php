<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$complaintId = isset($_POST['complaint_id']) ? $_POST['complaint_id'] : null;
$uploadedBy = isset($_POST['uploaded_by']) ? $_POST['uploaded_by'] : 'student'; // 'student' or 'warden'

if (!$complaintId || !isset($_FILES['image'])) {
    echo json_encode(["success" => false, "message" => "Complaint ID and image required"]);
    exit;
}

// Validate uploaded_by value
if (!in_array($uploadedBy, ['student', 'warden'])) {
    echo json_encode(["success" => false, "message" => "Invalid uploaded_by value"]);
    exit;
}

$uploadDir = '../../uploads/complaints/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$file = $_FILES['image'];
$fileName = time() . '_' . basename($file['name']);
$targetPath = $uploadDir . $fileName;

$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(["success" => false, "message" => "Invalid file type. Only JPEG, PNG, and GIF allowed."]);
    exit;
}

// Check file size (max 5MB)
if ($file['size'] > 5 * 1024 * 1024) {
    echo json_encode(["success" => false, "message" => "File too large. Maximum size is 5MB."]);
    exit;
}

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $imagePath = 'uploads/complaints/' . $fileName;
    
    $query = "INSERT INTO complaint_images (complaint_id, image_path, uploaded_by) VALUES (:complaint_id, :image_path, :uploaded_by)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":complaint_id", $complaintId);
    $stmt->bindParam(":image_path", $imagePath);
    $stmt->bindParam(":uploaded_by", $uploadedBy);
    $stmt->execute();
    
    echo json_encode(["success" => true, "message" => "Image uploaded successfully", "path" => $imagePath]);
} else {
    echo json_encode(["success" => false, "message" => "Upload failed"]);
}
