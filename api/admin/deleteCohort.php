<?php
// ============================================
// deleteCohort.php
// Deletes a cohort. FK constraints will:
//  - Set cohort_id to NULL on affected students (ON DELETE SET NULL)
//  - Cascade-delete cohort_modules entries (ON DELETE CASCADE)
// Called via: index.php?action=delete-cohort (POST)
// ============================================

function deleteCohort() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["message" => "Invalid request method"]);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['cohort_id'])) {
        http_response_code(400);
        echo json_encode(["message" => "cohort_id is required"]);
        exit();
    }

    $cohortId = (int) $input['cohort_id'];

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        $sqlQuery = "DELETE FROM cohorts WHERE cohort_id = :id";
        $param = [':id' => $cohortId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

        if ($result->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["message" => "Cohort not found"]);
            exit();
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode(["message" => "Cohort deleted successfully"]);
    exit();
}