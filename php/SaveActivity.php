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
$category = trim($_POST['category'] ?? '');
$level = (int)($_POST['level'] ?? 0);
$score = (int)($_POST['score'] ?? 0);
$accuracy = (int)($_POST['accuracy'] ?? 0);
$timeTaken = (int)($_POST['time_taken'] ?? 0);
$timeLimit = (int)($_POST['time_limit'] ?? 0);

if (empty($category) || $level <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid data']); exit;
}

$stmt = $conn->prepare("INSERT INTO player_activities (user_id, category, level, score, accuracy, time_taken, time_limit) VALUES (?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("isiiiii", $userId, $category, $level, $score, $accuracy, $timeTaken, $timeLimit);

if ($stmt->execute()) {
    // Keep only last 10
    $cl = $conn->prepare("DELETE FROM player_activities WHERE user_id = ? AND id NOT IN (SELECT id FROM (SELECT id FROM player_activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 10) AS recent)");
    $cl->bind_param("ii", $userId, $userId);
    $cl->execute();
    $cl->close();
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to save']);
}
$stmt->close();
$conn->close();
?>
