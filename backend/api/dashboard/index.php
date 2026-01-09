<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$role = isset($_GET['role']) ? $_GET['role'] : null;

$stats = [];

// Total students
$stmt = $db->query("SELECT COUNT(*) as total FROM students");
$stats['total_students'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Total rooms
$stmt = $db->query("SELECT COUNT(*) as total FROM rooms");
$stats['total_rooms'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Available rooms
$stmt = $db->query("SELECT COUNT(*) as total FROM rooms WHERE status = 'available'");
$stats['available_rooms'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Complaints by status
$stmt = $db->query("SELECT status, COUNT(*) as count FROM complaints GROUP BY status");
$complaintStats = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stats['pending_complaints'] = 0;
$stats['resolved_complaints'] = 0;
$stats['total_complaints'] = 0;

foreach ($complaintStats as $cs) {
    $stats['total_complaints'] += $cs['count'];
    if (in_array($cs['status'], ['submitted', 'in_review', 'in_progress'])) {
        $stats['pending_complaints'] += $cs['count'];
    }
    if ($cs['status'] === 'resolved') {
        $stats['resolved_complaints'] = $cs['count'];
    }
}

// Pending wardens (for superadmin)
if ($role === 'superadmin') {
    $stmt = $db->query("SELECT COUNT(*) as total FROM users WHERE role = 'warden' AND status = 'pending'");
    $stats['pending_wardens'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
}

// Recent complaints
$stmt = $db->query("SELECT c.*, s.matric_no, u.name as student_name 
                    FROM complaints c 
                    JOIN students s ON c.student_id = s.id 
                    JOIN users u ON s.user_id = u.id 
                    ORDER BY c.created_at DESC LIMIT 5");
$stats['recent_complaints'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["success" => true, "data" => $stats]);
