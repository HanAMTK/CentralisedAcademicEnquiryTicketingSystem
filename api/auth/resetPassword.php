<?php
// ============================================
// resetPassword.php
// Validates token and sets new password
// Called via: index.php?action=reset-password (POST)
// ============================================

function validateResetInput($input) {
    if (!isset($input['token']) || !isset($input['new_password']) || !isset($input['confirm_password'])) {
        http_response_code(400);
        return "All fields are required";
    }

    if ($input['new_password'] !== $input['confirm_password']) {
        http_response_code(400);
        return "Passwords do not match";
    }

    if (strlen($input['new_password']) < 8) {
        http_response_code(400);
        return "Password must be at least 8 characters";
    }

    return null; // No error
}

function processReset($input) {
    require "../getConnection.php";

    $token = $input['token'];

    // Look up token
    $sqlQuery = "SELECT t.token_id, t.user_id, t.expires_at, t.used, u.is_active
                 FROM password_reset_tokens t
                 JOIN users u ON t.user_id = u.user_id
                 WHERE t.token = :token
                 LIMIT 1";
    $param['token'] = $token;

    try {
        $dbConnection = getConnection();
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $resetToken = $result->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        http_response_code(500);
        return "Error: " . $e->getMessage();
    }

    // Validate token
    if (!$resetToken) {
        http_response_code(400);
        return "Invalid reset link";
    }

    if ($resetToken['used']) {
        http_response_code(400);
        return "This reset link has already been used";
    }

    if (strtotime($resetToken['expires_at']) < time()) {
        http_response_code(400);
        return "This reset link has expired. Please request a new one.";
    }

    if (!$resetToken['is_active']) {
        http_response_code(403);
        return "Account is deactivated";
    }

    // Update password and mark token as used
    $newHash = password_hash($input['new_password'], PASSWORD_DEFAULT);

    try {
        $dbConnection->beginTransaction();

        // Set new password and clear must_change_password
        $sqlQuery = "UPDATE users SET password_hash = :hash, must_change_password = FALSE, updated_at = NOW() WHERE user_id = :user_id";
        $param = [
            'hash'    => $newHash,
            'user_id' => $resetToken['user_id'],
        ];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        // Mark token as used
        $sqlQuery = "UPDATE password_reset_tokens SET used = TRUE WHERE token_id = :token_id";
        $param = ['token_id' => $resetToken['token_id']];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        $dbConnection->commit();
    } catch (PDOException $e) {
        $dbConnection->rollBack();
        http_response_code(500);
        return "Failed to reset password. Please try again.";
    }

    return "Password reset successfully. You can now log in with your new password.";
}

function resetPassword() {
    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["message" => "Invalid request method"]);
        exit();
    }

    // Decode JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate input
    $validationError = validateResetInput($input);
    if ($validationError !== null) {
        echo json_encode(["message" => $validationError]);
        exit();
    }

    // Process reset
    $message = processReset($input);

    echo json_encode(["message" => $message]);
    exit();
}