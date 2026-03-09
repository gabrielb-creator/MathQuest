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
$achievementId = trim($_POST['achievement_id'] ?? '');

if (empty($achievementId)) {
    echo json_encode(['success' => false, 'message' => 'Invalid achievement']); exit;
}

// Check if already unlocked
$check = $conn->prepare("SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?");
$check->bind_param("is", $userId, $achievementId);
$check->execute();
if ($check->get_result()->num_rows > 0) {
    echo json_encode(['success' => true, 'message' => 'Already unlocked']);
    $check->close(); $conn->close(); exit;
}
$check->close();

$stmt = $conn->prepare("INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)");
$stmt->bind_param("is", $userId, $achievementId);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Achievement unlocked!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to unlock']);
}
$stmt->close();
$conn->close();
?>
