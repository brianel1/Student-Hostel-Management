<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->user_id) || !isset($data->current_password) || !isset($data->new_password)) {
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit;
}

// Get current password
$query = "SELECT password FROM users WHERE id = :user_id";
$stmt = $db->prepare($query);
$stmt->bindParam(":user_id", $data->user_id);
$stmt->execute();

$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit;
}

// Verify current password
if (!password_verify($data->current_password, $user['password'])) {
    echo json_encode(["success" => false, "message" => "Current password is incorrect"]);
    exit;
}

// Update password
$hashedPassword = password_hash($data->new_password, PASSWORD_DEFAULT);
$updateQuery = "UPDATE users SET password = :password WHERE id = :user_id";
$updateStmt = $db->prepare($updateQuery);
$updateStmt->bindParam(":password", $hashedPassword);
$updateStmt->bindParam(":user_id", $data->user_id);
$updateStmt->execute();

echo json_encode(["success" => true, "message" => "Password changed successfully"]);
