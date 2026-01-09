<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$complaintId = isset($_POST['complaint_id']) ? $_POST['complaint_id'] : null;

if (!$complaintId || !isset($_FILES['image'])) {
    echo json_encode(["success" => false, "message" => "Complaint ID and image required"]);
    exit;
}

$uploadDir = '../../uploads/complaints/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$file = $_FILES['image'];
$fileName = time() . '_' . basename($file['name']);
$targetPath = $uploadDir . $fileName;

$allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(["success" => false, "message" => "Invalid file type"]);
    exit;
}

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $imagePath = 'uploads/complaints/' . $fileName;
    
    $query = "INSERT INTO complaint_images (complaint_id, image_path) VALUES (:complaint_id, :image_path)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":complaint_id", $complaintId);
    $stmt->bindParam(":image_path", $imagePath);
    $stmt->execute();
    
    echo json_encode(["success" => true, "message" => "Image uploaded", "path" => $imagePath]);
} else {
    echo json_encode(["success" => false, "message" => "Upload failed"]);
}
