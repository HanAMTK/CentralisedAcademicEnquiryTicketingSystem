<?php
// ============================================
// getModules.php
// Returns list of active modules for dropdown
// Called via: index.php?action=modules (GET)
// ============================================

function getModules() {
    // Check authentication
    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode(["message" => "Not authenticated"]);
        exit();
    }

    require "../getConnection.php";

    $sqlQuery = "SELECT m.module_id, m.module_code, m.module_name, 
                        u.first_name AS lecturer_first_name, u.last_name AS lecturer_last_name
                 FROM modules m
                 JOIN ticketing_users u ON m.lecturer_id = u.user_id
                 WHERE m.is_active = TRUE
                 ORDER BY m.module_code ASC";

    try {
        $dbConnection = getConnection();
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
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