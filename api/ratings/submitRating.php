<?php
// ============================================
// submitRating.php
// Submits or updates a rating for a ticket
// Notifies the lecturer when a new rating is submitted
// Called via: index.php?action=submit (POST)
// ============================================

function submitRating() {
    // Check authentication
    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode(["message" => "Not authenticated"]);
        exit();
    }

    // Only students can rate
    if (empty($_SESSION['role']) || $_SESSION['role'] !== 'student') {
        http_response_code(403);
        echo json_encode(["message" => "Only students can submit ratings"]);
        exit();
    }

    // Parse input
    $input = json_decode(file_get_contents('php://input'), true);
    $ticketId = $input['ticket_id'] ?? null;
    $stars = $input['stars'] ?? null;
    $issueResolved = $input['issue_resolved'] ?? null;
    $comment = trim($input['comment'] ?? '') ?: null;

    // Validate
    if (!$ticketId || !$stars || !$issueResolved) {
        http_response_code(400);
        echo json_encode(["message" => "Missing required fields"]);
        exit();
    }

    if (!is_numeric($stars) || $stars < 1 || $stars > 5) {
        http_response_code(400);
        echo json_encode(["message" => "Stars must be between 1 and 5"]);
        exit();
    }

    if (!in_array($issueResolved, ['yes', 'no', 'partially'])) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid issue_resolved value"]);
        exit();
    }

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        // Verify ticket belongs to student and is resolved/closed
        $sqlQuery = "SELECT t.ticket_id, t.ticket_number, t.status, t.student_id, t.assigned_lecturer_id
                     FROM tickets t
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

        if ($ticket['student_id'] != $_SESSION['userID']) {
            http_response_code(403);
            echo json_encode(["message" => "You can only rate your own tickets"]);
            exit();
        }

        if (!in_array($ticket['status'], ['Resolved', 'Closed'])) {
            http_response_code(400);
            echo json_encode(["message" => "Can only rate resolved or closed tickets"]);
            exit();
        }

        // Check whether this is a new rating or an edit (so we only notify once)
        $sqlQuery = "SELECT rating_id FROM ticket_ratings WHERE ticket_id = :ticket_id";
        $param = [':ticket_id' => $ticketId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $existingRating = $result->fetch(PDO::FETCH_ASSOC);
        $isNewRating = !$existingRating;

        // Upsert - insert or update existing rating
        $sqlQuery = "INSERT INTO ticket_ratings 
                     (ticket_id, student_id, lecturer_id, stars, issue_resolved, comment)
                     VALUES (:ticket_id, :student_id, :lecturer_id, :stars, :issue_resolved, :comment)
                     ON DUPLICATE KEY UPDATE
                     stars = VALUES(stars),
                     issue_resolved = VALUES(issue_resolved),
                     comment = VALUES(comment)";
        $param = [
            ':ticket_id' => $ticketId,
            ':student_id' => $_SESSION['userID'],
            ':lecturer_id' => $ticket['assigned_lecturer_id'],
            ':stars' => $stars,
            ':issue_resolved' => $issueResolved,
            ':comment' => $comment
        ];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        // Notify the lecturer - only on first submission, not on edits
        if ($isNewRating && $ticket['assigned_lecturer_id']) {
            require "../notifications/createNotification.php";
            $starsText = str_repeat('★', (int) $stars) . str_repeat('☆', 5 - (int) $stars);
            createNotification(
                $dbConnection,
                $ticket['assigned_lecturer_id'],
                $ticketId,
                'rating_submitted',
                "Ticket {$ticket['ticket_number']} received a rating: {$starsText}"
            );
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode(["message" => "Rating submitted successfully"]);
    exit();
}