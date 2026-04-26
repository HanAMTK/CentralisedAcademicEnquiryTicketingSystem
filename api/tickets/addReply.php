<?php
// ============================================
// addReply.php
// Adds a reply to a ticket and updates status
// Records first_response_at when lecturer replies for the first time (SLA tracking)
// Called via: index.php?action=reply (POST)
// ============================================

function addReply() {
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

    if (!isset($input['ticket_id']) || !isset($input['message']) || empty(trim($input['message']))) {
        http_response_code(400);
        echo json_encode(["message" => "Ticket ID and message are required"]);
        exit();
    }

    $ticketId = (int) $input['ticket_id'];
    $message  = trim($input['message']);
    $userId   = $_SESSION['userID'];
    $userRole = $_SESSION['role'];

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        // Verify ticket exists and user has access; pull first_response_at for SLA tracking
        $sqlQuery = "SELECT ticket_id, status, student_id, assigned_lecturer_id, first_response_at
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

        // Cannot reply to resolved or closed tickets
        if ($ticket['status'] === 'Resolved' || $ticket['status'] === 'Closed') {
            http_response_code(400);
            echo json_encode(["message" => "Cannot reply to a resolved or closed ticket"]);
            exit();
        }

        $dbConnection->beginTransaction();

        // Insert reply
        $sqlQuery = "INSERT INTO ticket_replies (ticket_id, user_id, message) 
                     VALUES (:ticket_id, :user_id, :message)";
        $param = [
            ':ticket_id' => $ticketId,
            ':user_id'   => $userId,
            ':message'   => $message,
        ];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $replyId = $dbConnection->lastInsertId();

        // Record first_response_at if this is the lecturer's first reply on this ticket
        $isFirstLecturerResponse = ($userRole === 'lecturer' && empty($ticket['first_response_at']));
        if ($isFirstLecturerResponse) {
            $sqlQuery = "UPDATE tickets SET first_response_at = NOW() WHERE ticket_id = :ticket_id";
            $param = [':ticket_id' => $ticketId];
            $result = $dbConnection->prepare($sqlQuery);
            $result->execute($param);
        }

        // Auto-update status based on who replied
        $oldStatus = $ticket['status'];
        $newStatus = null;

        if ($userRole === 'lecturer' && ($oldStatus === 'In Progress' || $oldStatus === 'Open')) {
            // Lecturer replied → awaiting student's response
            $newStatus = 'Awaiting Response';
        } elseif ($userRole === 'student' && $oldStatus === 'Awaiting Response') {
            // Student replied → back to lecturer's court
            $newStatus = 'In Progress';
        }

        if ($newStatus !== null) {
            // Update ticket status
            $sqlQuery = "UPDATE tickets SET status = :status, updated_at = NOW() WHERE ticket_id = :ticket_id";
            $param = [':status' => $newStatus, ':ticket_id' => $ticketId];
            $result = $dbConnection->prepare($sqlQuery);
            $result->execute($param);

            // Log status change
            $sqlQuery = "INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by, change_reason)
                         VALUES (:ticket_id, :old_status, :new_status, :changed_by, 'Reply added')";
            $param = [
                ':ticket_id'  => $ticketId,
                ':old_status' => $oldStatus,
                ':new_status' => $newStatus,
                ':changed_by' => $userId,
            ];
            $result = $dbConnection->prepare($sqlQuery);
            $result->execute($param);
        } else {
            // Just update the updated_at timestamp
            $sqlQuery = "UPDATE tickets SET updated_at = NOW() WHERE ticket_id = :ticket_id";
            $param = [':ticket_id' => $ticketId];
            $result = $dbConnection->prepare($sqlQuery);
            $result->execute($param);
        }

        $dbConnection->commit();

        // Notify the other party
        require "../notifications/createNotification.php";
        $senderName = $_SESSION['firstName'] . ' ' . $_SESSION['lastName'];

        if ($userRole === 'student') {
            // Notify the lecturer
            createNotification(
                $dbConnection,
                $ticket['assigned_lecturer_id'],
                $ticketId,
                'new_reply',
                "{$senderName} replied to ticket #{$ticketId}"
            );
        } elseif ($userRole === 'lecturer') {
            // Notify the student
            createNotification(
                $dbConnection,
                $ticket['student_id'],
                $ticketId,
                'new_reply',
                "{$senderName} replied to your ticket"
            );
        }

        echo json_encode([
            "message"  => "Reply added successfully",
            "reply_id" => (int) $replyId,
        ]);

    } catch (PDOException $e) {
        $dbConnection->rollBack();
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
    }

    exit();
}