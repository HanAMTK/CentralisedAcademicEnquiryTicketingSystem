<?php
// ============================================
// getLecturerRatingStats.php
// Returns aggregate rating stats for the logged-in lecturer
// Called via: index.php?action=lecturer-stats (GET)
// ============================================

function getLecturerRatingStats() {
    // Check authentication
    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode(["message" => "Not authenticated"]);
        exit();
    }

    // Only lecturers
    if (empty($_SESSION['role']) || $_SESSION['role'] !== 'lecturer') {
        http_response_code(403);
        echo json_encode(["message" => "Lecturers only"]);
        exit();
    }

    require "../getConnection.php";

    $sqlQuery = "SELECT 
                    COUNT(*) AS total_ratings,
                    AVG(stars) AS avg_stars,
                    SUM(CASE WHEN issue_resolved = 'yes' THEN 1 ELSE 0 END) AS resolved_yes,
                    SUM(CASE WHEN issue_resolved = 'partially' THEN 1 ELSE 0 END) AS resolved_partial,
                    SUM(CASE WHEN issue_resolved = 'no' THEN 1 ELSE 0 END) AS resolved_no
                 FROM ticket_ratings
                 WHERE lecturer_id = :lecturer_id";
    $param = [':lecturer_id' => $_SESSION['userID']];

    try {
        $dbConnection = getConnection();
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $stats = $result->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode([
        "message" => "Success",
        "stats" => $stats
    ]);
    exit();
}