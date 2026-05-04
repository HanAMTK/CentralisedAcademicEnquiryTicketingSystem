<?php
// ============================================
// getCohortModules.php
// Returns the module IDs assigned to a specific cohort
// Called via: index.php?action=cohort-modules&cohort_id=X (GET)
// ============================================

function getCohortModules() {
    if (empty($_GET['cohort_id'])) {
        http_response_code(400);
        echo json_encode(["message" => "cohort_id is required"]);
        exit();
    }

    $cohortId = (int) $_GET['cohort_id'];

    require "../getConnection.php";

    $sqlQuery = "SELECT module_id FROM cohort_modules WHERE cohort_id = :id";

    try {
        $dbConnection = getConnection();
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':id' => $cohortId]);
        $rows = $result->fetchAll(PDO::FETCH_ASSOC);
        $moduleIds = array_map(fn($r) => (int) $r['module_id'], $rows);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode([
        "message" => "Cohort modules retrieved successfully",
        "module_ids" => $moduleIds,
    ]);
    exit();
}