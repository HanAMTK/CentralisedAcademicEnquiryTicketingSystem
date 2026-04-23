<?php
// ============================================
// updateModule.php
// Updates module details or lecturer assignment
// Called via: index.php?action=update-module (POST)
// ============================================

function updateModule() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["message" => "Invalid request method"]);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['module_id'])) {
        http_response_code(400);
        echo json_encode(["message" => "Module ID is required"]);
        exit();
    }

    $moduleId = (int) $input['module_id'];

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        // Check module exists
        $sqlQuery = "SELECT module_id FROM modules WHERE module_id = :id LIMIT 1";
        $param = [':id' => $moduleId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        if (!$result->fetch()) {
            http_response_code(404);
            echo json_encode(["message" => "Module not found"]);
            exit();
        }

        // Build dynamic update
        $updates = [];
        $param = [':module_id' => $moduleId];

        if (isset($input['module_name']) && !empty(trim($input['module_name']))) {
            $updates[] = "module_name = :name";
            $param[':name'] = trim($input['module_name']);
        }

        if (isset($input['lecturer_id'])) {
            $lecturerId = (int) $input['lecturer_id'];

            // Verify lecturer
            $sqlQuery = "SELECT user_id FROM ticketing_users WHERE user_id = :lid AND role = 'lecturer' LIMIT 1";
            $checkParam = [':lid' => $lecturerId];
            $result = $dbConnection->prepare($sqlQuery);
            $result->execute($checkParam);

            if (!$result->fetch()) {
                http_response_code(400);
                echo json_encode(["message" => "Selected user is not a valid lecturer"]);
                exit();
            }

            $updates[] = "lecturer_id = :lecturer_id";
            $param[':lecturer_id'] = $lecturerId;
        }

        if (isset($input['is_active'])) {
            $updates[] = "is_active = :is_active";
            $param[':is_active'] = $input['is_active'] ? 1 : 0;
        }

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(["message" => "No fields to update"]);
            exit();
        }

        $sqlQuery = "UPDATE modules SET " . implode(', ', $updates) . " WHERE module_id = :module_id";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode(["message" => "Module updated successfully"]);
    exit();
}