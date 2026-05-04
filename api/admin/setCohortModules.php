<?php
// ============================================
// setCohortModules.php
// Replaces the set of modules assigned to a cohort
// Called via: index.php?action=set-cohort-modules (POST)
// Body: { "cohort_id": 1, "module_ids": [1, 2, 3] }
// ============================================

function setCohortModules() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["message" => "Invalid request method"]);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['cohort_id']) || !isset($input['module_ids']) || !is_array($input['module_ids'])) {
        http_response_code(400);
        echo json_encode(["message" => "cohort_id and module_ids array are required"]);
        exit();
    }

    $cohortId = (int) $input['cohort_id'];
    $moduleIds = array_map('intval', $input['module_ids']);
    $moduleIds = array_unique($moduleIds);

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        // Verify cohort exists
        $sqlQuery = "SELECT cohort_id FROM cohorts WHERE cohort_id = :id LIMIT 1";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':id' => $cohortId]);

        if (!$result->fetch()) {
            http_response_code(404);
            echo json_encode(["message" => "Cohort not found"]);
            exit();
        }

        // Use a transaction to replace the set atomically
        $dbConnection->beginTransaction();

        // Delete existing assignments
        $sqlQuery = "DELETE FROM cohort_modules WHERE cohort_id = :id";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':id' => $cohortId]);

        // Insert new assignments (if any)
        if (count($moduleIds) > 0) {
            $sqlQuery = "INSERT INTO cohort_modules (cohort_id, module_id) VALUES (:cohort_id, :module_id)";
            $result = $dbConnection->prepare($sqlQuery);
            foreach ($moduleIds as $moduleId) {
                $result->execute([
                    ':cohort_id' => $cohortId,
                    ':module_id' => $moduleId,
                ]);
            }
        }

        $dbConnection->commit();

    } catch (PDOException $e) {
        if ($dbConnection->inTransaction()) {
            $dbConnection->rollBack();
        }
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode(["message" => "Cohort modules updated successfully"]);
    exit();
}