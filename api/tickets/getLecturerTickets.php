<?php
// ============================================
// getLecturerTickets.php
// Returns tickets assigned to the logged-in lecturer
// Called via: index.php?action=lecturer-tickets (GET)
// ============================================

function getLecturerTickets() {
    // Check authentication
    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode(["message" => "Not authenticated"]);
        exit();
    }

    // Only lecturers
    if ($_SESSION['role'] !== 'lecturer') {
        http_response_code(403);
        echo json_encode(["message" => "Only lecturers can access this endpoint"]);
        exit();
    }

    require "../getConnection.php";

    $sqlQuery = "SELECT t.ticket_id, t.ticket_number, t.subject, t.description, t.category,
                        t.urgency, t.status, t.created_at, t.updated_at,
                        m.module_code, m.module_name,
                        s.first_name AS student_first_name, s.last_name AS student_last_name,
                        (SELECT COUNT(*) FROM ticket_replies tr WHERE tr.ticket_id = t.ticket_id) AS reply_count
                 FROM tickets t
                 JOIN modules m ON t.module_id = m.module_id
                 JOIN ticketing_users s ON t.student_id = s.user_id
                 WHERE t.assigned_lecturer_id = :lecturer_id
                 ORDER BY t.updated_at DESC";
    $param = [':lecturer_id' => $_SESSION['userID']];

    try {
        $dbConnection = getConnection();
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $tickets = $result->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode([
        "message" => "Tickets retrieved successfully",
        "tickets" => $tickets,
    ]);
    exit();
}