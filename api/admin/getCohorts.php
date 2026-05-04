<?php
// ============================================
// getCohorts.php
// Returns all cohorts with member counts and module counts
// Called via: index.php?action=cohorts (GET)
// ============================================

function getCohorts() {
    require "../getConnection.php";

    $sqlQuery = "SELECT c.cohort_id, c.name, c.description, c.created_at,
                        (SELECT COUNT(*) FROM ticketing_users WHERE cohort_id = c.cohort_id AND role = 'student') AS student_count,
                        (SELECT COUNT(*) FROM cohort_modules WHERE cohort_id = c.cohort_id) AS module_count
                 FROM cohorts c
                 ORDER BY c.name ASC";

    try {
        $dbConnection = getConnection();
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $cohorts = $result->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode([
        "message" => "Cohorts retrieved successfully",
        "cohorts" => $cohorts,
    ]);
    exit();
}