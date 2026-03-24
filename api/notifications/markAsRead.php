<?php
// ============================================
// markAsRead.php
// Marks notifications as read
// Called via: index.php?action=mark-read (POST)
// Accepts: { "notification_ids": [1,2,3] } or { "all": true }
// ============================================

function markAsRead() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["message" => "Invalid request method"]);
        exit();
    }

    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode(["message" => "Not authenticated"]);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        if (isset($input['all']) && $input['all'] === true) {
            // Mark all as read
            $sqlQuery = "UPDATE notifications SET is_read = TRUE WHERE user_id = :user_id AND is_read = FALSE";
            $param = [':user_id' => $_SESSION['userID']];
            $result = $dbConnection->prepare($sqlQuery);
            $result->execute($param);
        } elseif (isset($input['notification_ids']) && is_array($input['notification_ids'])) {
            // Mark specific notifications as read
            $ids = array_map('intval', $input['notification_ids']);
            if (count($ids) > 0) {
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $sqlQuery = "UPDATE notifications SET is_read = TRUE WHERE notification_id IN ({$placeholders}) AND user_id = ?";
                $params = array_merge($ids, [$_SESSION['userID']]);
                $result = $dbConnection->prepare($sqlQuery);
                $result->execute($params);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Provide notification_ids array or all: true"]);
            exit();
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode(["message" => "Notifications marked as read"]);
    exit();
}