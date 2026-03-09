<?php
require_once 'Conn.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Username and password are required']);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, username, password, avatar FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        if (password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['logged_in'] = true;

            // Ensure player_stats row exists
            $sc = $conn->prepare("SELECT id FROM player_stats WHERE user_id = ?");
            $sc->bind_param("i", $user['id']);
            $sc->execute();
            if ($sc->get_result()->num_rows === 0) {
                $cs = $conn->prepare("INSERT INTO player_stats (user_id) VALUES (?)");
                $cs->bind_param("i", $user['id']);
                $cs->execute();
                $cs->close();
            }
            $sc->close();

            // Ensure user_settings row exists
            $ss = $conn->prepare("SELECT id FROM user_settings WHERE user_id = ?");
            $ss->bind_param("i", $user['id']);
            $ss->execute();
            if ($ss->get_result()->num_rows === 0) {
                $cs2 = $conn->prepare("INSERT INTO user_settings (user_id) VALUES (?)");
                $cs2->bind_param("i", $user['id']);
                $cs2->execute();
                $cs2->close();
            }
            $ss->close();

            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'avatar' => $user['avatar'] ?? 'avatar1'
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid password']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
$conn->close();
?>
