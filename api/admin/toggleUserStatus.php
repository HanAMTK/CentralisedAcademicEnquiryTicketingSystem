<?php
// ============================================
// toggleUserStatus.php
// Toggles user active/inactive
// Called via: index.php?action=toggle-user (POST)
// ============================================

function toggleUserStatus() {
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

    // Prevent admin from deactivating themselves
    if ($targetUserId === $_SESSION['userID']) {
        http_response_code(400);
        echo json_encode(["message" => "You cannot deactivate your own account"]);
        exit();
    }

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        // Get current status
        $sqlQuery = "SELECT is_active FROM ticketing_users WHERE user_id = :user_id LIMIT 1";
        $param = [':user_id' => $targetUserId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $user = $result->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            http_response_code(404);
            echo json_encode(["message" => "User not found"]);
            exit();
        }

        $newStatus = $user['is_active'] ? 0 : 1;

        $sqlQuery = "UPDATE ticketing_users SET is_active = :status, updated_at = NOW() WHERE user_id = :user_id";
        $param = [':status' => $newStatus, ':user_id' => $targetUserId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    $statusLabel = $newStatus ? "activated" : "deactivated";
    echo json_encode(["message" => "User {$statusLabel} successfully", "is_active" => (bool) $newStatus]);
    exit();
}