<?php
// ============================================
// changePassword.php
// Changes password for authenticated user
// Used for both forced first-login change and voluntary changes
// Called via: index.php?action=change-password (POST)
// ============================================

function validatePasswordInput($input) {
    if (!isset($input['current_password']) || !isset($input['new_password']) || !isset($input['confirm_password'])) {
        http_response_code(400);
        return "All fields are required";
    }

    if ($input['new_password'] !== $input['confirm_password']) {
        http_response_code(400);
        return "New passwords do not match";
    }

    if (strlen($input['new_password']) < 8) {
        http_response_code(400);
        return "Password must be at least 8 characters";
    }

    if ($input['current_password'] === $input['new_password']) {
        http_response_code(400);
        return "New password must be different from current password";
    }

    return null; // No error
}

function processPasswordChange($input) {
    require "../getConnection.php";

    // Verify current password
    $sqlQuery = "SELECT password_hash FROM ticketing_users WHERE user_id = :user_id";
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

    if (!$user || !password_verify($input['current_password'], $user['password_hash'])) {
        http_response_code(401);
        return "Current password is incorrect";
    }

    // Update password and clear must_change_password flag
    $newHash = password_hash($input['new_password'], PASSWORD_DEFAULT);

    $sqlQuery = "UPDATE ticketing_users SET password_hash = :hash, must_change_password = FALSE, updated_at = NOW() WHERE user_id = :user_id";
    $param = [
        'hash'    => $newHash,
        'user_id' => $_SESSION['userID'],
    ];

    try {
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
    } catch (PDOException $e) {
        http_response_code(500);
        return "Error: " . $e->getMessage();
    }

    // Update session
    $_SESSION['mustChangePassword'] = false;

    return "Password changed successfully";
}

function changePassword() {
    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["message" => "Invalid request method"]);
        exit();
    }

    // Check authentication
    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode(["message" => "Not authenticated"]);
        exit();
    }

    // Decode JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate input
    $validationError = validatePasswordInput($input);
    if ($validationError !== null) {
        echo json_encode(["message" => $validationError]);
        exit();
    }

    // Process password change
    $message = processPasswordChange($input);

    echo json_encode(["message" => $message]);
    exit();
}