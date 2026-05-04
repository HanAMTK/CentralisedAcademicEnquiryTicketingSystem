<?php
// ============================================
// updateCohort.php
// Updates a cohort's name or description
// Called via: index.php?action=update-cohort (POST)
// ============================================

function updateCohort() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["message" => "Invalid request method"]);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['cohort_id']) || empty($input['name'])) {
        http_response_code(400);
        echo json_encode(["message" => "cohort_id and name are required"]);
        exit();
    }

    $cohortId = (int) $input['cohort_id'];
    $name = trim($input['name']);
    $description = isset($input['description']) ? trim($input['description']) : null;

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        // Check for duplicate name (excluding the current cohort)
        $sqlQuery = "SELECT cohort_id FROM cohorts WHERE name = :name AND cohort_id != :id LIMIT 1";
        $param = [':name' => $name, ':id' => $cohortId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        if ($result->fetch()) {
            http_response_code(409);
            echo json_encode(["message" => "Another cohort with this name already exists"]);
            exit();
        }

        // Update cohort
        $sqlQuery = "UPDATE cohorts SET name = :name, description = :description WHERE cohort_id = :id";
        $param = [
            ':name' => $name,
            ':description' => $description ?: null,
            ':id' => $cohortId,
        ];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode(["message" => "Cohort updated successfully"]);
    exit();
}