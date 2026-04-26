<?php
// ============================================
// createTicket.php
// Creates a new ticket and auto-assigns to lecturer
// Called via: index.php?action=create (POST)
// ============================================

require_once "slaHelper.php";

function validateTicketInput($input) {
    if (!isset($input['subject']) || empty(trim($input['subject']))) {
        http_response_code(400);
        return "Subject is required";
    }

    if (!isset($input['category']) || empty($input['category'])) {
        http_response_code(400);
        return "Category is required";
    }

    $allowedCategories = ['Module Content', 'Gradebook', 'Assessment & Submission', 'Other'];
    if (!in_array($input['category'], $allowedCategories)) {
        http_response_code(400);
        return "Invalid category";
    }

    if (!isset($input['module_id']) || empty($input['module_id'])) {
        http_response_code(400);
        return "Module is required";
    }

    if (!isset($input['urgency']) || empty($input['urgency'])) {
        http_response_code(400);
        return "Urgency level is required";
    }

    $allowedUrgency = ['Low', 'Medium', 'High', 'Critical'];
    if (!in_array($input['urgency'], $allowedUrgency)) {
        http_response_code(400);
        return "Invalid urgency level";
    }

    if (!isset($input['description']) || empty(trim($input['description']))) {
        http_response_code(400);
        return "Description is required";
    }

    if (strlen($input['description']) > 2000) {
        http_response_code(400);
        return "Description must be 2000 characters or less";
    }

    return null;
}

function generateTicketNumber($dbConnection) {
    $currentYear = date('Y');

    $sqlQuery = "SELECT ticket_number FROM tickets 
                 WHERE ticket_number LIKE :prefix 
                 ORDER BY ticket_id DESC LIMIT 1";
    $param = [':prefix' => "TKT-{$currentYear}-%"];

    try {
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $lastTicket = $result->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return null;
    }

    if ($lastTicket) {
        // Extract the sequence number and increment
        $lastNumber = (int) substr($lastTicket['ticket_number'], 9);
        $nextNumber = $lastNumber + 1;
    } else {
        $nextNumber = 1;
    }

    return "TKT-{$currentYear}-" . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
}

function processCreateTicket($input) {
    require "../getConnection.php";

    $subject     = trim($input['subject']);
    $category    = $input['category'];
    $moduleId    = (int) $input['module_id'];
    $urgency     = $input['urgency'];
    $description = trim($input['description']);
    $studentId   = $_SESSION['userID'];

    try {
        $dbConnection = getConnection();

        // Look up the module and its assigned lecturer
        $sqlQuery = "SELECT module_id, module_code, module_name, lecturer_id 
                     FROM modules 
                     WHERE module_id = :module_id AND is_active = TRUE 
                     LIMIT 1";
        $param = [':module_id' => $moduleId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $module = $result->fetch(PDO::FETCH_ASSOC);

        if (!$module) {
            http_response_code(400);
            return "Invalid module selected";
        }

        // Generate ticket number
        $ticketNumber = generateTicketNumber($dbConnection);
        if (!$ticketNumber) {
            http_response_code(500);
            return "Failed to generate ticket number";
        }

        // Auto-assign to the module's lecturer
        $assignedLecturerId = $module['lecturer_id'];

        // Calculate SLA deadline based on urgency
        $createdAt = date('Y-m-d H:i:s');
        $slaDeadline = calculateSlaDeadline($createdAt, $urgency);

        // Insert ticket
        $sqlQuery = "INSERT INTO tickets (ticket_number, subject, description, category, module_id, urgency, student_id, assigned_lecturer_id, status, sla_deadline)
                     VALUES (:ticket_number, :subject, :description, :category, :module_id, :urgency, :student_id, :assigned_lecturer_id, 'Open', :sla_deadline)";
        $param = [
            ':ticket_number'        => $ticketNumber,
            ':subject'              => $subject,
            ':description'          => $description,
            ':category'             => $category,
            ':module_id'            => $moduleId,
            ':urgency'              => $urgency,
            ':student_id'           => $studentId,
            ':assigned_lecturer_id' => $assignedLecturerId,
            ':sla_deadline'         => $slaDeadline,
        ];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        $ticketId = $dbConnection->lastInsertId();

        // Log initial status in history
        $sqlQuery = "INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by, change_reason)
                     VALUES (:ticket_id, NULL, 'Open', :changed_by, 'Ticket created')";
        $param = [
            ':ticket_id'  => $ticketId,
            ':changed_by' => $studentId,
        ];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        // Notify assigned lecturer
        require "../notifications/createNotification.php";
        createNotification(
            $dbConnection,
            $assignedLecturerId,
            $ticketId,
            'ticket_assigned',
            "New ticket {$ticketNumber}: {$subject}"
        );

        return [
            "ticket_id"     => (int) $ticketId,
            "ticket_number" => $ticketNumber,
            "subject"       => $subject,
            "category"      => $category,
            "module"        => $module['module_code'] . " - " . $module['module_name'],
            "urgency"       => $urgency,
            "status"        => "Open",
            "sla_deadline"  => $slaDeadline,
        ];

    } catch (PDOException $e) {
        http_response_code(500);
        return "Error: " . $e->getMessage();
    }
}

function createTicket() {
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

    // Check role
    if ($_SESSION['role'] !== 'student') {
        http_response_code(403);
        echo json_encode(["message" => "Only students can create tickets"]);
        exit();
    }

    // Decode JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate input
    $validationError = validateTicketInput($input);
    if ($validationError !== null) {
        echo json_encode(["message" => $validationError]);
        exit();
    }

    // Process ticket creation
    $result = processCreateTicket($input);

    if (is_string($result)) {
        echo json_encode(["message" => $result]);
    } else {
        http_response_code(201);
        echo json_encode([
            "message" => "Ticket created successfully",
            "ticket"  => $result,
        ]);
    }

    exit();
}