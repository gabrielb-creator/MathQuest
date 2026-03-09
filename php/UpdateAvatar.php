<?php
require_once 'Conn.php';
header('Content-Type: application/json');

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']); exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']); exit;
}

$userId = $_SESSION['user_id'];
$avatar = trim($_POST['avatar'] ?? '');

// Validate avatar
$valid = ['avatar1','avatar2','avatar3','avatar4','avatar5','avatar6','avatar7','avatar8','avatar9','avatar10','avatar11','avatar12'];
if (!in_array($avatar, $valid)) {
    echo json_encode(['success' => false, 'message' => 'Invalid avatar']); exit;
}

$stmt = $conn->prepare("UPDATE users SET avatar = ? WHERE id = ?");
$stmt->bind_param("si", $avatar, $userId);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update avatar']);
}
$stmt->close();
$conn->close();
?>
