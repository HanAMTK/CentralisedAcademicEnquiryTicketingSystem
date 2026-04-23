<?php
// ============================================
// getStats.php
// Returns dashboard statistics
// Called via: index.php?action=stats (GET)
// ============================================

function getStats() {
    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        // Total users by role
        $sqlQuery = "SELECT role, COUNT(*) as count FROM ticketing_users GROUP BY role";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $roleCounts = $result->fetchAll(PDO::FETCH_KEY_PAIR);

        // Active vs inactive users
        $sqlQuery = "SELECT is_active, COUNT(*) as count FROM ticketing_users GROUP BY is_active";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $activeCounts = $result->fetchAll(PDO::FETCH_KEY_PAIR);

        // Tickets by status
        $sqlQuery = "SELECT status, COUNT(*) as count FROM tickets GROUP BY status";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $ticketsByStatus = $result->fetchAll(PDO::FETCH_KEY_PAIR);

        // Total tickets
        $sqlQuery = "SELECT COUNT(*) as total FROM tickets";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $totalTickets = $result->fetch(PDO::FETCH_ASSOC)['total'];

        // Total modules
        $sqlQuery = "SELECT COUNT(*) as total FROM modules WHERE is_active = TRUE";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $totalModules = $result->fetch(PDO::FETCH_ASSOC)['total'];

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode([
        "message" => "Stats retrieved successfully",
        "stats" => [
            "users" => [
                "students" => (int) ($roleCounts['student'] ?? 0),
                "lecturers" => (int) ($roleCounts['lecturer'] ?? 0),
                "admins" => (int) ($roleCounts['admin'] ?? 0),
                "active" => (int) ($activeCounts[1] ?? 0),
                "inactive" => (int) ($activeCounts[0] ?? 0),
            ],
            "tickets" => [
                "total" => (int) $totalTickets,
                "by_status" => $ticketsByStatus,
            ],
            "modules" => [
                "total" => (int) $totalModules,
            ],
        ],
    ]);
    exit();
}