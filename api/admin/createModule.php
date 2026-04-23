<?php
// ============================================
// createModule.php
// Creates a new module
// Called via: index.php?action=create-module (POST)
// ============================================

function createModule() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["message" => "Invalid request method"]);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['module_code']) || !isset($input['module_name']) || !isset($input['lecturer_id'])) {
        http_response_code(400);
        echo json_encode(["message" => "Module code, name, and lecturer are required"]);
        exit();
    }

    $moduleCode = strtoupper(trim($input['module_code']));
    $moduleName = trim($input['module_name']);
    $lecturerId = (int) $input['lecturer_id'];

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        // Check for duplicate module code
        $sqlQuery = "SELECT module_id FROM modules WHERE module_code = :code LIMIT 1";
        $param = [':code' => $moduleCode];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        if ($result->fetch()) {
            http_response_code(409);
            echo json_encode(["message" => "A module with this code already exists"]);
            exit();
        }

        // Verify lecturer exists and is a lecturer
        $sqlQuery = "SELECT user_id FROM ticketing_users WHERE user_id = :id AND role = 'lecturer' LIMIT 1";
        $param = [':id' => $lecturerId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        if (!$result->fetch()) {
            http_response_code(400);
            echo json_encode(["message" => "Selected user is not a valid lecturer"]);
            exit();
        }

        // Create module
        $sqlQuery = "INSERT INTO modules (module_code, module_name, lecturer_id, is_active) VALUES (:code, :name, :lecturer_id, TRUE)";
        $param = [
            ':code' => $moduleCode,
            ':name' => $moduleName,
            ':lecturer_id' => $lecturerId,
        ];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        $moduleId = $dbConnection->lastInsertId();

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    http_response_code(201);
    echo json_encode([
        "message" => "Module created successfully",
        "module_id" => (int) $moduleId,
    ]);
    exit();
}