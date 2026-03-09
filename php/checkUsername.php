<?php
require_once('Conn.php');
header('Content-Type: application/json');

$username = $_POST['username'] ?? '';

$stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

echo json_encode([
    "exists" => $result->num_rows > 0
]);
?>