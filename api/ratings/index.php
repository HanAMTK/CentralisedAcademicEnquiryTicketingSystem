<?php
require '../config/database.php';
require '../auth/session.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'submit':
        submitRating();
        break;
    case 'get':
        getRating();
        break;
    case 'getLecturerStats':
        getLecturerRatingStats();
        break;
    default:
        http_response_code(400);
        echo json_encode(['message' => 'Invalid action']);
}

function submitRating() {
    global $dbConnection;

    $currentUser = getCurrentUser();
    if (!$currentUser || $currentUser['role'] !== 'student') {
        http_response_code(403);
        echo json_encode(['message' => 'Only students can submit ratings']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $ticketId = $input['ticket_id'] ?? null;
    $stars = $input['stars'] ?? null;
    $issueResolved = $input['issue_resolved'] ?? null;
    $comment = trim($input['comment'] ?? '') ?: null;

    if (!$ticketId || !$stars || !$issueResolved) {
        http_response_code(400);
        echo json_encode(['message' => 'Missing required fields']);
        return;
    }

    if (!is_numeric($stars) || $stars < 1 || $stars > 5) {
        http_response_code(400);
        echo json_encode(['message' => 'Stars must be between 1 and 5']);
        return;
    }

    if (!in_array($issueResolved, ['yes', 'no', 'partially'])) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid issue_resolved value']);
        return;
    }

    // Verify ticket belongs to this student and is resolved/closed
    $sqlQuery = "SELECT t.ticket_id, t.status, t.student_id, m.lecturer_id
                 FROM w25037936_tickets t
                 JOIN w25037936_modules m ON t.module_id = m.module_id
                 WHERE t.ticket_id = ?";
    $stmt = $dbConnection->prepare($sqlQuery);
    $stmt->bind_param('i', $ticketId);
    $stmt->execute();
    $result = $stmt->get_result();
    $ticket = $result->fetch_assoc();

    if (!$ticket) {
        http_response_code(404);
        echo json_encode(['message' => 'Ticket not found']);
        return;
    }

    if ($ticket['student_id'] != $currentUser['user_id']) {
        http_response_code(403);
        echo json_encode(['message' => 'You can only rate your own tickets']);
        return;
    }

    if (!in_array($ticket['status'], ['Resolved', 'Closed'])) {
        http_response_code(400);
        echo json_encode(['message' => 'Can only rate resolved or closed tickets']);
        return;
    }

    // Upsert - allow editing existing rating
    $sqlQuery = "INSERT INTO w25037936_ticket_ratings 
                 (ticket_id, student_id, lecturer_id, stars, issue_resolved, comment)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 stars = VALUES(stars),
                 issue_resolved = VALUES(issue_resolved),
                 comment = VALUES(comment)";
    $stmt = $dbConnection->prepare($sqlQuery);
    $stmt->bind_param(
        'iiiiss',
        $ticketId,
        $currentUser['user_id'],
        $ticket['lecturer_id'],
        $stars,
        $issueResolved,
        $comment
    );

    if ($stmt->execute()) {
        echo json_encode(['message' => 'Rating submitted successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to submit rating']);
    }
}

function getRating() {
    global $dbConnection;

    $currentUser = getCurrentUser();
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['message' => 'Not authenticated']);
        return;
    }

    $ticketId = $_GET['ticket_id'] ?? null;
    if (!$ticketId) {
        http_response_code(400);
        echo json_encode(['message' => 'Ticket ID required']);
        return;
    }

    // Permission check: student must own ticket, lecturer must own module
    $sqlQuery = "SELECT t.student_id, m.lecturer_id
                 FROM w25037936_tickets t
                 JOIN w25037936_modules m ON t.module_id = m.module_id
                 WHERE t.ticket_id = ?";
    $stmt = $dbConnection->prepare($sqlQuery);
    $stmt->bind_param('i', $ticketId);
    $stmt->execute();
    $ticket = $stmt->get_result()->fetch_assoc();

    if (!$ticket) {
        http_response_code(404);
        echo json_encode(['message' => 'Ticket not found']);
        return;
    }

    $isStudent = $currentUser['role'] === 'student' && $ticket['student_id'] == $currentUser['user_id'];
    $isLecturer = $currentUser['role'] === 'lecturer' && $ticket['lecturer_id'] == $currentUser['user_id'];

    if (!$isStudent && !$isLecturer) {
        http_response_code(403);
        echo json_encode(['message' => 'Not authorised']);
        return;
    }

    $sqlQuery = "SELECT stars, issue_resolved, comment, created_at, updated_at
                 FROM w25037936_ticket_ratings
                 WHERE ticket_id = ?";
    $stmt = $dbConnection->prepare($sqlQuery);
    $stmt->bind_param('i', $ticketId);
    $stmt->execute();
    $rating = $stmt->get_result()->fetch_assoc();

    echo json_encode([
        'message' => 'Success',
        'rating' => $rating  // null if not yet rated
    ]);
}

function getLecturerRatingStats() {
    global $dbConnection;

    $currentUser = getCurrentUser();
    if (!$currentUser || $currentUser['role'] !== 'lecturer') {
        http_response_code(403);
        echo json_encode(['message' => 'Lecturers only']);
        return;
    }

    $sqlQuery = "SELECT 
                    COUNT(*) AS total_ratings,
                    AVG(stars) AS avg_stars,
                    SUM(CASE WHEN issue_resolved = 'yes' THEN 1 ELSE 0 END) AS resolved_yes,
                    SUM(CASE WHEN issue_resolved = 'partially' THEN 1 ELSE 0 END) AS resolved_partial,
                    SUM(CASE WHEN issue_resolved = 'no' THEN 1 ELSE 0 END) AS resolved_no
                 FROM w25037936_ticket_ratings
                 WHERE lecturer_id = ?";
    $stmt = $dbConnection->prepare($sqlQuery);
    $stmt->bind_param('i', $currentUser['user_id']);
    $stmt->execute();
    $stats = $stmt->get_result()->fetch_assoc();

    echo json_encode([
        'message' => 'Success',
        'stats' => $stats
    ]);
}