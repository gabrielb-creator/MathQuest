<?php
require_once 'Conn.php';
header('Content-Type: application/json');

$stmt = $conn->prepare("
    SELECT l.total_score, l.quizzes_completed, l.accuracy, u.username, u.avatar
    FROM leaderboard l
    JOIN users u ON u.id = l.user_id
    ORDER BY l.total_score DESC
    LIMIT 50
");
$stmt->execute();
$result = $stmt->get_result();

$leaderboard = [];
while ($row = $result->fetch_assoc()) {
    $leaderboard[] = [
        'username' => $row['username'],
        'avatar' => $row['avatar'] ?? 'avatar1',
        'total_score' => (int)$row['total_score'],
        'quizzes_completed' => (int)$row['quizzes_completed'],
        'accuracy' => (int)$row['accuracy'],
    ];
}

echo json_encode(['success' => true, 'leaderboard' => $leaderboard]);
$stmt->close();
$conn->close();
?>
