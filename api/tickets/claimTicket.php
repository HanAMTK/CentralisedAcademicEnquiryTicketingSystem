<?php
// ============================================
// claimTicket.php
// Lecturer claims a ticket, changing status to In Progress
// Called via: index.php?action=claim (POST)
// ============================================

function claimTicket() {
    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["message" => "Invalid request method"]);
        exit();
    }

    // Check authentication
    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode(["message" => "Not authenticated"]);
        exit();
    }

    // Only lecturers can claim tickets
    if ($_SESSION['role'] !== 'lecturer') {
        http_response_code(403);
        echo json_encode(["message" => "Only lecturers can claim tickets"]);
        exit();
    }

    // Decode JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['ticket_id'])) {
        http_response_code(400);
        echo json_encode(["message" => "Ticket ID is required"]);
        exit();
    }

    $ticketId   = (int) $input['ticket_id'];
    $lecturerId = $_SESSION['userID'];

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        // Fetch ticket
        $sqlQuery = "SELECT ticket_id, status, assigned_lecturer_id 
                     FROM tickets WHERE ticket_id = :ticket_id LIMIT 1";
        $param = [':ticket_id' => $ticketId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $ticket = $result->fetch(PDO::FETCH_ASSOC);

        if (!$ticket) {
            http_response_code(404);
            echo json_encode(["message" => "Ticket not found"]);
            exit();
        }

        // Check the lecturer is the assigned one
        if ($ticket['assigned_lecturer_id'] != $lecturerId) {
            http_response_code(403);
            echo json_encode(["message" => "This ticket is not assigned to you"]);
            exit();
        }

        // Can only claim Open tickets
        if ($ticket['status'] !== 'Open') {
            http_response_code(400);
            echo json_encode(["message" => "Only open tickets can be claimed. Current status: " . $ticket['status']]);
            exit();
        }

        $dbConnection->beginTransaction();

        // Update status to In Progress
        $sqlQuery = "UPDATE tickets SET status = 'In Progress', updated_at = NOW() WHERE ticket_id = :ticket_id";
        $param = [':ticket_id' => $ticketId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        // Log status change
        $sqlQuery = "INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by, change_reason)
                     VALUES (:ticket_id, 'Open', 'In Progress', :changed_by, 'Ticket claimed by lecturer')";
        $param = [
            ':ticket_id'  => $ticketId,
            ':changed_by' => $lecturerId,
        ];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        $dbConnection->commit();

        // Notify the student that their ticket was claimed
        require "../notifications/createNotification.php";
        $lecturerName = $_SESSION['firstName'] . ' ' . $_SESSION['lastName'];

        // Get student_id from the ticket
        $sqlQuery = "SELECT student_id, ticket_number FROM tickets WHERE ticket_id = :ticket_id LIMIT 1";
        $param = [':ticket_id' => $ticketId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $ticketInfo = $result->fetch(PDO::FETCH_ASSOC);

        if ($ticketInfo) {
            createNotification(
                $dbConnection,
                $ticketInfo['student_id'],
                $ticketId,
                'ticket_claimed',
                "{$lecturerName} has claimed your ticket #{$ticketInfo['ticket_number']}"
            );
        }

        echo json_encode(["message" => "Ticket claimed successfully"]);

    } catch (PDOException $e) {
        $dbConnection->rollBack();
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
    }

    exit();
}