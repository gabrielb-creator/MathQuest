<?php
require_once 'Conn.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['regUsername'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['regPass'] ?? '';
    $confirmPass = $_POST['confirmPass'] ?? '';

    if (empty($username) || empty($email) || empty($password) || empty($confirmPass)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit;
    }
    if ($password !== $confirmPass) {
        echo json_encode(['success' => false, 'message' => 'Passwords do not match']);
        exit;
    }
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        exit;
    }

    $check = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $check->bind_param("s", $username);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Username already exists']);
        $check->close(); exit;
    }
    $check->close();

    $checkE = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $checkE->bind_param("s", $email);
    $checkE->execute();
    if ($checkE->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Email already registered']);
        $checkE->close(); exit;
    }
    $checkE->close();

    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (username, email, password, avatar) VALUES (?, ?, ?, 'avatar1')");
    $stmt->bind_param("sss", $username, $email, $hashed);

    if ($stmt->execute()) {
        $uid = $conn->insert_id;
        $cs = $conn->prepare("INSERT INTO player_stats (user_id) VALUES (?)");
        $cs->bind_param("i", $uid);
        $cs->execute();
        $cs->close();
        $cs2 = $conn->prepare("INSERT INTO user_settings (user_id) VALUES (?)");
        $cs2->bind_param("i", $uid);
        $cs2->execute();
        $cs2->close();
        echo json_encode(['success' => true, 'message' => 'Registration successful! Please login.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Registration failed']);
    }
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
$conn->close();
?>
