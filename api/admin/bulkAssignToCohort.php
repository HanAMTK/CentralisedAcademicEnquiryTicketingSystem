<?php
// ============================================
// bulkAssignToCohort.php
// Assigns multiple students to a cohort in one transaction.
// Students in the user_ids list are SET to this cohort_id (overrides
// any existing cohort assignment).
// Students NOT in the list but currently assigned to this cohort are
// REMOVED from the cohort (cohort_id set to NULL).
// Called via: index.php?action=bulk-assign-cohort (POST)
// Body: { "cohort_id": 1, "user_ids": [3, 5, 7] }
// ============================================

function bulkAssignToCohort() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["message" => "Invalid request method"]);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['cohort_id']) || !isset($input['user_ids']) || !is_array($input['user_ids'])) {
        http_response_code(400);
        echo json_encode(["message" => "cohort_id and user_ids array are required"]);
        exit();
    }

    $cohortId = (int) $input['cohort_id'];
    $userIds = array_map('intval', $input['user_ids']);
    $userIds = array_unique($userIds);

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

        $dbConnection->beginTransaction();

        // 1. Remove students currently in this cohort but no longer in the list
        if (count($userIds) > 0) {
            $placeholders = implode(',', array_fill(0, count($userIds), '?'));
            $sqlQuery = "UPDATE ticketing_users
                         SET cohort_id = NULL
                         WHERE cohort_id = ? AND user_id NOT IN ($placeholders)
                           AND role = 'student'";
            $params = array_merge([$cohortId], $userIds);
        } else {
            // No users in list - clear the entire cohort
            $sqlQuery = "UPDATE ticketing_users
                         SET cohort_id = NULL
                         WHERE cohort_id = ? AND role = 'student'";
            $params = [$cohortId];
        }
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($params);

        // 2. Assign all students in the list to this cohort
        if (count($userIds) > 0) {
            $placeholders = implode(',', array_fill(0, count($userIds), '?'));
            $sqlQuery = "UPDATE ticketing_users
                         SET cohort_id = ?
                         WHERE user_id IN ($placeholders) AND role = 'student'";
            $params = array_merge([$cohortId], $userIds);
            $result = $dbConnection->prepare($sqlQuery);
            $result->execute($params);
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

    echo json_encode([
        "message" => "Cohort membership updated successfully",
        "assigned_count" => count($userIds),
    ]);
    exit();
}