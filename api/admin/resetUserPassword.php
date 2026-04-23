<?php
// ============================================
// resetUserPassword.php
// Admin resets a user's password to a default
// Called via: index.php?action=reset-user-password (POST)
// ============================================

function resetUserPassword() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["message" => "Invalid request method"]);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['user_id'])) {
        http_response_code(400);
        echo json_encode(["message" => "User ID is required"]);
        exit();
    }

    $targetUserId = (int) $input['user_id'];
    $newPassword = $input['new_password'] ?? 'default123';

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        $sqlQuery = "SELECT user_id FROM ticketing_users WHERE user_id = :user_id LIMIT 1";
        $param = [':user_id' => $targetUserId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $user = $result->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            http_response_code(404);
            echo json_encode(["message" => "User not found"]);
            exit();
        }

        $hash = password_hash($newPassword, PASSWORD_DEFAULT);

        $sqlQuery = "UPDATE ticketing_users SET password_hash = :hash, must_change_password = TRUE, updated_at = NOW() WHERE user_id = :user_id";
        $param = [':hash' => $hash, ':user_id' => $targetUserId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode([
        "message" => "Password reset successfully. New password: {$newPassword}",
        "password" => $newPassword,
    ]);
    exit();
}