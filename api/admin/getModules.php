<?php
// ============================================
// getModules.php (admin version)
// Returns all modules with lecturer info
// Called via: index.php?action=modules (GET)
// ============================================

function adminGetModules() {
    require "../getConnection.php";

    $sqlQuery = "SELECT m.module_id, m.module_code, m.module_name, m.is_active, m.lecturer_id,
                        u.first_name AS lecturer_first_name, u.last_name AS lecturer_last_name, u.email AS lecturer_email
                 FROM modules m
                 LEFT JOIN ticketing_users u ON m.lecturer_id = u.user_id
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