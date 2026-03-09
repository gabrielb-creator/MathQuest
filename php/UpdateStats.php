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
$score = (int)($_POST['score'] ?? 0);
$correct = (int)($_POST['correct'] ?? 0);
$wrong = (int)($_POST['wrong'] ?? 0);
$timeTaken = (int)($_POST['time_taken'] ?? 0);
$timeLimit = (int)($_POST['time_limit'] ?? 0);

$get = $conn->prepare("SELECT total_score, current_streak, quizzes_completed, total_correct, total_questions FROM player_stats WHERE user_id = ?");
$get->bind_param("i", $userId);
$get->execute();
$result = $get->get_result();

if ($result->num_rows === 1) {
    $c = $result->fetch_assoc();
    $newScore = $c['total_score'] + $score;
    $newQuizzes = $c['quizzes_completed'] + 1;
    $newCorrect = $c['total_correct'] + $correct;
    $newTotal = $c['total_questions'] + $correct + $wrong;
    $newStreak = ($correct > $wrong) ? $c['current_streak'] + 1 : 0;

    $upd = $conn->prepare("UPDATE player_stats SET total_score=?, current_streak=?, quizzes_completed=?, total_correct=?, total_questions=? WHERE user_id=?");
    $upd->bind_param("iiiiii", $newScore, $newStreak, $newQuizzes, $newCorrect, $newTotal, $userId);
    $upd->execute();

    // Update leaderboard
    $accuracy = $newTotal > 0 ? round(($newCorrect / $newTotal) * 100) : 0;
    $lb = $conn->prepare("INSERT INTO leaderboard (user_id, total_score, quizzes_completed, accuracy) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE total_score=?, quizzes_completed=?, accuracy=?");
    $lb->bind_param("iiiidii", $userId, $newScore, $newQuizzes, $accuracy, $newScore, $newQuizzes, $accuracy);
    $lb->execute();
    $lb->close();

    echo json_encode(['success' => true, 'stats' => [
        'totalScore' => $newScore, 'currentStreak' => $newStreak,
        'quizzesCompleted' => $newQuizzes, 'totalCorrect' => $newCorrect, 'totalQuestions' => $newTotal
    ]]);
    $upd->close();
} else {
    $streak = ($correct > $wrong) ? 1 : 0;
    $totalQ = $correct + $wrong;
    $ins = $conn->prepare("INSERT INTO player_stats (user_id, total_score, current_streak, quizzes_completed, total_correct, total_questions) VALUES (?,?,?,1,?,?)");
    $ins->bind_param("iiiii", $userId, $score, $streak, $correct, $totalQ);
    $ins->execute();
    echo json_encode(['success' => true, 'message' => 'Stats created']);
    $ins->close();
}
$get->close();
$conn->close();
?>
