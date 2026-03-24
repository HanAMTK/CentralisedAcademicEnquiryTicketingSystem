<?php
// ============================================
// getNotifications.php
// Returns notifications for the logged-in user
// Called via: index.php?action=list (GET)
// ============================================

function getNotifications() {
    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode(["message" => "Not authenticated"]);
        exit();
    }

    require "../getConnection.php";

    $sqlQuery = "SELECT n.notification_id, n.ticket_id, n.type, n.message, n.is_read, n.created_at,
                        t.ticket_number
                 FROM notifications n
                 JOIN tickets t ON n.ticket_id = t.ticket_id
                 WHERE n.user_id = :user_id
                 ORDER BY n.created_at DESC
                 LIMIT 50";
    $param = [':user_id' => $_SESSION['userID']];

    try {
        $dbConnection = getConnection();
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $notifications = $result->fetchAll(PDO::FETCH_ASSOC);

        // Get unread count
        $sqlQuery = "SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = :user_id AND is_read = FALSE";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':user_id' => $_SESSION['userID']]);
        $countRow = $result->fetch(PDO::FETCH_ASSOC);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode([
        "message" => "Notifications retrieved successfully",
        "notifications" => $notifications,
        "unread_count" => (int) $countRow['unread_count'],
    ]);
    exit();
}