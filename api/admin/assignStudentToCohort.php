<?php
// ============================================
// assignStudentToCohort.php
// Sets or clears a student's cohort assignment
// Called via: index.php?action=assign-cohort (POST)
// Body: { "user_id": 1, "cohort_id": 5 } or { "user_id": 1, "cohort_id": null }
// ============================================

function assignStudentToCohort() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["message" => "Invalid request method"]);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['user_id'])) {
        http_response_code(400);
        echo json_encode(["message" => "user_id is required"]);
        exit();
    }

    $userId = (int) $input['user_id'];
    // cohort_id can be null to unassign
    $cohortId = isset($input['cohort_id']) && $input['cohort_id'] !== '' && $input['cohort_id'] !== null
        ? (int) $input['cohort_id']
        : null;

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        // Verify user exists and is a student
        $sqlQuery = "SELECT user_id, role FROM ticketing_users WHERE user_id = :id LIMIT 1";
        $param = [':id' => $userId];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $user = $result->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            http_response_code(404);
            echo json_encode(["message" => "User not found"]);
            exit();
        }

        if ($user['role'] !== 'student') {
            http_response_code(400);
            echo json_encode(["message" => "Only students can be assigned to cohorts"]);
            exit();
        }

        // If a cohort_id is provided, verify it exists
        if ($cohortId !== null) {
            $sqlQuery = "SELECT cohort_id FROM cohorts WHERE cohort_id = :id LIMIT 1";
            $param = [':id' => $cohortId];
            $result = $dbConnection->prepare($sqlQuery);
            $result->execute($param);

            if (!$result->fetch()) {
                http_response_code(404);
                echo json_encode(["message" => "Cohort not found"]);
                exit();
            }
        }

        // Update the student's cohort_id
        $sqlQuery = "UPDATE ticketing_users SET cohort_id = :cohort_id WHERE user_id = :user_id";
        $param = [
            ':cohort_id' => $cohortId,
            ':user_id' => $userId,
        ];
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode([
        "message" => $cohortId === null
            ? "Student removed from cohort"
            : "Student assigned to cohort",
    ]);
    exit();
}