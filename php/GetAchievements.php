<?php
require_once 'Conn.php';
header('Content-Type: application/json');

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => true, 'achievements' => []]); exit;
}

$userId = $_SESSION['user_id'];
$stmt = $conn->prepare("SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$achievements = [];
while ($row = $result->fetch_assoc()) {
    $achievements[] = [
        'achievement_id' => $row['achievement_id'],
        'unlocked_at' => $row['unlocked_at']
    ];
}

echo json_encode(['success' => true, 'achievements' => $achievements]);
$stmt->close();
$conn->close();
?>
