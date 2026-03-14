<?php
// ============================================
// getStudentTickets.php
// Returns tickets for the logged-in student
// Called via: index.php?action=my-tickets (GET)
// ============================================

function getStudentTickets() {
    // Check authentication
    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode(["message" => "Not authenticated"]);
        exit();
    }

    require "../getConnection.php";

    $sqlQuery = "SELECT t.ticket_id, t.ticket_number, t.subject, t.description, t.category, 
                        t.urgency, t.status, t.created_at, t.updated_at,
                        m.module_code, m.module_name,
                        (SELECT COUNT(*) FROM ticket_replies tr WHERE tr.ticket_id = t.ticket_id) AS reply_count
                 FROM tickets t
                 JOIN modules m ON t.module_id = m.module_id
                 WHERE t.student_id = :student_id
                 ORDER BY t.updated_at DESC";
    $param = [':student_id' => $_SESSION['userID']];

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