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

// Reset stats
$conn->prepare("UPDATE player_stats SET total_score=0, current_streak=0, quizzes_completed=0, total_correct=0, total_questions=0 WHERE user_id=?")->bind_param("i", $userId) && true;
$stmt1 = $conn->prepare("UPDATE player_stats SET total_score=0, current_streak=0, quizzes_completed=0, total_correct=0, total_questions=0 WHERE user_id=?");
$stmt1->bind_param("i", $userId);
$stmt1->execute();
$stmt1->close();

// Delete activities
$stmt2 = $conn->prepare("DELETE FROM player_activities WHERE user_id=?");
$stmt2->bind_param("i", $userId);
$stmt2->execute();
$stmt2->close();

// Delete achievements
$stmt3 = $conn->prepare("DELETE FROM user_achievements WHERE user_id=?");
$stmt3->bind_param("i", $userId);
$stmt3->execute();
$stmt3->close();

// Delete from leaderboard
$stmt4 = $conn->prepare("DELETE FROM leaderboard WHERE user_id=?");
$stmt4->bind_param("i", $userId);
$stmt4->execute();
$stmt4->close();

echo json_encode(['success' => true, 'message' => 'Progress reset']);
$conn->close();
?>
