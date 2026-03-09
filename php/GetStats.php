<?php
require_once 'Conn.php';
header('Content-Type: application/json');

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']); exit;
}

$userId = $_SESSION['user_id'];
$stmt = $conn->prepare("SELECT total_score, current_streak, quizzes_completed, total_correct, total_questions FROM player_stats WHERE user_id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $s = $result->fetch_assoc();
    $accuracy = $s['total_questions'] > 0 ? round(($s['total_correct'] / $s['total_questions']) * 100) : 0;
    echo json_encode(['success' => true, 'stats' => [
        'totalScore' => (int)$s['total_score'],
        'currentStreak' => (int)$s['current_streak'],
        'quizzesCompleted' => (int)$s['quizzes_completed'],
        'totalCorrect' => (int)$s['total_correct'],
        'totalQuestions' => (int)$s['total_questions'],
        'accuracy' => $accuracy
    ]]);
} else {
    echo json_encode(['success' => true, 'stats' => ['totalScore'=>0,'currentStreak'=>0,'quizzesCompleted'=>0,'totalCorrect'=>0,'totalQuestions'=>0,'accuracy'=>0]]);
}
$stmt->close();
$conn->close();
?>
