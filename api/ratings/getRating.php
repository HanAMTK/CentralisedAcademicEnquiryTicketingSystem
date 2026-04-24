<?php
// ============================================
// getRating.php
// Fetches the rating for a specific ticket
// Called via: index.php?action=get&ticket_id=X (GET)
// ============================================

function getRating() {
    // Check authentication
    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode(["message" => "Not authenticated"]);
        exit();
    }

    $ticketId = $_GET['ticket_id'] ?? null;
    if (!$ticketId) {
        http_response_code(400);
        echo json_encode(["message" => "Ticket ID required"]);
        exit();
    }

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        // Get ticket's student and lecturer for permission check
        $sqlQuery = "SELECT t.student_id, m.lecturer_id
                     FROM tickets t
                     JOIN modules m ON t.module_id = m.module_id
                     WHERE t.ticket_id = :ticket_id";
        $param = [':ticket_id' => $ticketId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $ticket = $result->fetch(PDO::FETCH_ASSOC);

        if (!$ticket) {
            http_response_code(404);
            echo json_encode(["message" => "Ticket not found"]);
            exit();
        }

        // Permission: student must own the ticket, lecturer must own the module
        $isStudent = ($_SESSION['role'] ?? '') === 'student' && $ticket['student_id'] == $_SESSION['userID'];
        $isLecturer = ($_SESSION['role'] ?? '') === 'lecturer' && $ticket['lecturer_id'] == $_SESSION['userID'];

        if (!$isStudent && !$isLecturer) {
            http_response_code(403);
            echo json_encode(["message" => "Not authorised"]);
            exit();
        }

        // Fetch rating
        $sqlQuery = "SELECT stars, issue_resolved, comment, created_at, updated_at
                     FROM ticket_ratings
                     WHERE ticket_id = :ticket_id";
        $param = [':ticket_id' => $ticketId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $rating = $result->fetch(PDO::FETCH_ASSOC);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode([
        "message" => "Success",
        "rating" => $rating ?: null
    ]);
    exit();
}