<?php
// ============================================
// createNotification.php
// Helper function to insert a notification
// This is NOT an API endpoint — it's required by other files
// ============================================

function createNotification($dbConnection, $userId, $ticketId, $type, $message) {
    $sqlQuery = "INSERT INTO notifications (user_id, ticket_id, type, message)
                 VALUES (:user_id, :ticket_id, :type, :message)";
    $param = [
        ':user_id'   => $userId,
        ':ticket_id' => $ticketId,
        ':type'      => $type,
        ':message'   => $message,
    ];

    try {
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
    } catch (PDOException $e) {
        // Silently fail — notifications shouldn't break core functionality
        error_log("Failed to create notification: " . $e->getMessage());
    }
}