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
$fields = [];
$params = [];
$types = '';

if (isset($_POST['sound_enabled'])) {
    $fields[] = 'sound_enabled = ?';
    $params[] = (int)$_POST['sound_enabled'];
    $types .= 'i';
}
if (isset($_POST['notifications'])) {
    $fields[] = 'notifications = ?';
    $params[] = (int)$_POST['notifications'];
    $types .= 'i';
}
if (isset($_POST['difficulty'])) {
    $allowed = ['easy', 'normal', 'hard'];
    $diff = in_array($_POST['difficulty'], $allowed) ? $_POST['difficulty'] : 'normal';
    $fields[] = 'difficulty = ?';
    $params[] = $diff;
    $types .= 's';
}

if (empty($fields)) {
    echo json_encode(['success' => false, 'message' => 'No settings to update']); exit;
}

$params[] = $userId;
$types .= 'i';

$sql = "UPDATE user_settings SET " . implode(', ', $fields) . " WHERE user_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update']);
}
$stmt->close();
$conn->close();
?>
