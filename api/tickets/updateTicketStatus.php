<?php
// ============================================
// updateTicketStatus.php
// Updates ticket status to Resolved or Closed
// Called via: index.php?action=update-status (POST)
// ============================================

function updateTicketStatus() {
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

    // Decode JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['ticket_id']) || !isset($input['new_status'])) {
        http_response_code(400);
        echo json_encode(["message" => "Ticket ID and new status are required"]);
        exit();
    }

    $ticketId  = (int) $input['ticket_id'];
    $newStatus = $input['new_status'];
    $reason    = trim($input['reason'] ?? '');
    $userId    = $_SESSION['userID'];
    $userRole  = $_SESSION['role'];

    // Only Resolved and Closed can be manually set
    $allowedStatuses = ['Resolved', 'Closed'];
    if (!in_array($newStatus, $allowedStatuses)) {
        http_response_code(400);
        echo json_encode(["message" => "Status can only be changed to Resolved or Closed"]);
        exit();
    }

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        // Fetch ticket
        $sqlQuery = "SELECT ticket_id, status, student_id, assigned_lecturer_id 
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

        // Access control
        if ($userRole === 'student' && $ticket['student_id'] != $userId) {
            http_response_code(403);
            echo json_encode(["message" => "You do not have access to this ticket"]);
            exit();
        }
        if ($userRole === 'lecturer' && $ticket['assigned_lecturer_id'] != $userId) {
            http_response_code(403);
            echo json_encode(["message" => "You do not have access to this ticket"]);
            exit();
        }

        $oldStatus = $ticket['status'];

        // Cannot change status if already closed
        if ($oldStatus === 'Closed') {
            http_response_code(400);
            echo json_encode(["message" => "This ticket is already closed"]);
            exit();
        }

        // Cannot resolve/close an Open ticket (must be claimed first)
        if ($oldStatus === 'Open') {
            http_response_code(400);
            echo json_encode(["message" => "Cannot resolve or close a ticket that hasn't been claimed yet"]);
            exit();
        }

        $dbConnection->beginTransaction();

        // Build update query
        $timestampField = $newStatus === 'Resolved' ? 'resolved_at' : 'closed_at';
        $sqlQuery = "UPDATE tickets SET status = :status, {$timestampField} = NOW(), updated_at = NOW() WHERE ticket_id = :ticket_id";
        $param = [':status' => $newStatus, ':ticket_id' => $ticketId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        // Log status change
        $changeReason = !empty($reason) ? $reason : "Status changed to {$newStatus}";
        $sqlQuery = "INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by, change_reason)
                     VALUES (:ticket_id, :old_status, :new_status, :changed_by, :reason)";
        $param = [
            ':ticket_id'  => $ticketId,
            ':old_status' => $oldStatus,
            ':new_status' => $newStatus,
            ':changed_by' => $userId,
            ':reason'     => $changeReason,
        ];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        $dbConnection->commit();

        // Notify the other party about status change
        require "../notifications/createNotification.php";
        $changerName = $_SESSION['firstName'] . ' ' . $_SESSION['lastName'];

        if ($userRole === 'student') {
            // Notify lecturer
            createNotification(
                $dbConnection,
                $ticket['assigned_lecturer_id'],
                $ticketId,
                'status_changed',
                "{$changerName} marked ticket as {$newStatus}"
            );
        } elseif ($userRole === 'lecturer') {
            // Notify student
            createNotification(
                $dbConnection,
                $ticket['student_id'],
                $ticketId,
                'status_changed',
                "{$changerName} marked your ticket as {$newStatus}"
            );
        }

        echo json_encode(["message" => "Ticket status updated to {$newStatus}"]);

    } catch (PDOException $e) {
        $dbConnection->rollBack();
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
    }

    exit();
}