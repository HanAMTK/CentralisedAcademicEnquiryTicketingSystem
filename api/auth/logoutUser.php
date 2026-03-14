<?php
// ============================================
// logoutUser.php
// Destroys the user session
// Called via: index.php?action=logout (POST)
// ============================================

function logoutUser() {
    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode(["message" => "Not logged in"]);
        exit();
    }

    // Clear session data
    $_SESSION = [];

    // Destroy session cookie
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }

    session_destroy();

    echo json_encode(["message" => "Logged out successfully"]);
    exit();
}