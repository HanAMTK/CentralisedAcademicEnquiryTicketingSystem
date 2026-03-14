<?php
// ============================================
// getSession.php
// Returns current authenticated user info
// Called via: index.php?action=session (GET)
// ============================================

function checkSession() {
    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        return "Not authenticated";
    }

    // Fetch fresh data from database
    require "../getConnection.php";

    $sqlQuery = "SELECT user_id, email, first_name, last_name, role, must_change_password
                 FROM ticketing_users
                 WHERE user_id = :user_id AND is_active = TRUE
                 LIMIT 1";
    $param['user_id'] = $_SESSION['userID'];

    try {
        $dbConnection = getConnection();
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $user = $result->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        http_response_code(500);
        return "Error: " . $e->getMessage();
    }

    if (!$user) {
        // User was deactivated since last login
        session_destroy();
        http_response_code(401);
        return "Account not found or deactivated";
    }

    return $user;
}

function getSession() {
    $result = checkSession();

    if (is_string($result)) {
        // Error message returned
        echo json_encode(["message" => $result, "user" => null]);
    } else {
        // User data returned
        echo json_encode([
            "message" => "Authenticated",
            "user" => [
                "user_id"              => $result['user_id'],
                "email"                => $result['email'],
                "first_name"           => $result['first_name'],
                "last_name"            => $result['last_name'],
                "role"                 => $result['role'],
                "must_change_password" => (bool) $result['must_change_password'],
            ],
        ]);
    }

    exit();
}