<?php
require_once 'Conn.php';
header('Content-Type: application/json');

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']); exit;
}

$userId = $_SESSION['user_id'];
$stmt = $conn->prepare("SELECT sound_enabled, notifications, difficulty FROM user_settings WHERE user_id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $s = $result->fetch_assoc();
    echo json_encode(['success' => true, 'settings' => [
        'sound_enabled' => (int)$s['sound_enabled'],
        'notifications' => (int)$s['notifications'],
        'difficulty' => $s['difficulty']
    ]]);
} else {
    echo json_encode(['success' => true, 'settings' => ['sound_enabled'=>1,'notifications'=>1,'difficulty'=>'normal']]);
}
$stmt->close();
$conn->close();
?>
