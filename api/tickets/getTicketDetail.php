<?php
// ============================================
// getTicketDetail.php
// Returns ticket details, replies, and status history
// Called via: index.php?action=detail&id=TICKET_ID (GET)
// ============================================

function getTicketDetail() {
    // Check authentication
    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode(["message" => "Not authenticated"]);
        exit();
    }

    if (!isset($_GET['id']) || empty($_GET['id'])) {
        http_response_code(400);
        echo json_encode(["message" => "Ticket ID is required"]);
        exit();
    }

    $ticketId = (int) $_GET['id'];

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        // Fetch ticket with module and lecturer info
        $sqlQuery = "SELECT t.ticket_id, t.ticket_number, t.subject, t.description, t.category,
                            t.urgency, t.status, t.created_at, t.updated_at, t.resolved_at, t.closed_at,
                            m.module_code, m.module_name,
                            l.first_name AS lecturer_first_name, l.last_name AS lecturer_last_name
                     FROM tickets t
                     JOIN modules m ON t.module_id = m.module_id
                     LEFT JOIN ticketing_users l ON t.assigned_lecturer_id = l.user_id
                     WHERE t.ticket_id = :ticket_id";
        $param = [':ticket_id' => $ticketId];

        // Access control: students can only see their own tickets, lecturers their assigned ones
        if ($_SESSION['role'] === 'student') {
            $sqlQuery .= " AND t.student_id = :user_id";
            $param[':user_id'] = $_SESSION['userID'];
        } elseif ($_SESSION['role'] === 'lecturer') {
            $sqlQuery .= " AND t.assigned_lecturer_id = :user_id";
            $param[':user_id'] = $_SESSION['userID'];
        }

        $sqlQuery .= " LIMIT 1";

        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $ticket = $result->fetch(PDO::FETCH_ASSOC);

        if (!$ticket) {
            http_response_code(404);
            echo json_encode(["message" => "Ticket not found"]);
            exit();
        }

        // Fetch replies
        $sqlQuery = "SELECT tr.reply_id, tr.message, tr.created_at,
                            u.first_name, u.last_name, u.role
                     FROM ticket_replies tr
                     JOIN ticketing_users u ON tr.user_id = u.user_id
                     WHERE tr.ticket_id = :ticket_id
                     ORDER BY tr.created_at ASC";
        $param = [':ticket_id' => $ticketId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $replies = $result->fetchAll(PDO::FETCH_ASSOC);

        // Fetch status history
        $sqlQuery = "SELECT tsh.status_history_id, tsh.old_status, tsh.new_status, 
                            tsh.change_reason, tsh.changed_at,
                            u.first_name, u.last_name, u.role
                     FROM ticket_status_history tsh
                     JOIN ticketing_users u ON tsh.changed_by = u.user_id
                     WHERE tsh.ticket_id = :ticket_id
                     ORDER BY tsh.changed_at ASC";
        $param = [':ticket_id' => $ticketId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $statusHistory = $result->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "message" => "Ticket retrieved successfully",
            "ticket"  => $ticket,
            "replies" => $replies,
            "status_history" => $statusHistory,
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
    }

    exit();
}