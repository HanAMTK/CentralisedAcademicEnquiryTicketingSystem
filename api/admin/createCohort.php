<?php
// ============================================
// createCohort.php
// Creates a new cohort
// Called via: index.php?action=create-cohort (POST)
// ============================================

function createCohort() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["message" => "Invalid request method"]);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['name'])) {
        http_response_code(400);
        echo json_encode(["message" => "Cohort name is required"]);
        exit();
    }

    $name = trim($input['name']);
    $description = !empty($input['description']) ? trim($input['description']) : null;

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        // Check for duplicate name
        $sqlQuery = "SELECT cohort_id FROM cohorts WHERE name = :name LIMIT 1";
        $param = [':name' => $name];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        if ($result->fetch()) {
            http_response_code(409);
            echo json_encode(["message" => "A cohort with this name already exists"]);
            exit();
        }

        // Create cohort
        $sqlQuery = "INSERT INTO cohorts (name, description) VALUES (:name, :description)";
        $param = [
            ':name' => $name,
            ':description' => $description,
        ];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        $cohortId = $dbConnection->lastInsertId();

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    http_response_code(201);
    echo json_encode([
        "message" => "Cohort created successfully",
        "cohort_id" => (int) $cohortId,
    ]);
    exit();
}