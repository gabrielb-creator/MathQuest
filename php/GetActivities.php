<?php
require_once 'Conn.php';
header('Content-Type: application/json');

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']); exit;
}

$userId = $_SESSION['user_id'];
$stmt = $conn->prepare("SELECT category, level, score, accuracy, time_taken, created_at FROM player_activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 10");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$activities = [];
while ($row = $result->fetch_assoc()) {
    $activities[] = [
        'category' => $row['category'],
        'level' => (int)$row['level'],
        'score' => (int)$row['score'],
        'accuracy' => (int)$row['accuracy'],
        'time_taken' => (int)$row['time_taken'],
        'timestamp' => $row['created_at']
    ];
}

echo json_encode(['success' => true, 'activities' => $activities]);
$stmt->close();
$conn->close();
?>
