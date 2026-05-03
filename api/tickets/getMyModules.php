<?php
// ============================================
// getMyModules.php
// Returns list of modules assigned to the logged-in lecturer
// Called via: index.php?action=my-modules (GET)
// ============================================

function getMyModules() {
    // Check authentication
    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode(["message" => "Not authenticated"]);
        exit();
    }

    if (($_SESSION['role'] ?? '') !== 'lecturer') {
        http_response_code(403);
        echo json_encode(["message" => "Lecturers only"]);
        exit();
    }

    require "../getConnection.php";

    $sqlQuery = "SELECT module_id, module_code, module_name
                 FROM modules
                 WHERE lecturer_id = :lecturer_id AND is_active = TRUE
                 ORDER BY module_code ASC";

    try {
        $dbConnection = getConnection();
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':lecturer_id' => $_SESSION['userID']]);
        $modules = $result->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode([
        "message" => "Modules retrieved successfully",
        "modules" => $modules,
    ]);
    exit();
}