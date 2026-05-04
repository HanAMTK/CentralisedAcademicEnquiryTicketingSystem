<?php
// ============================================
// getModules.php
// Returns list of active modules available to the user.
// For students: only modules from their assigned cohort.
// For lecturers/admins: all active modules.
// Called via: index.php?action=modules (GET)
// ============================================

function getModules() {
    // Check authentication
    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode(["message" => "Not authenticated"]);
        exit();
    }

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        $userId = $_SESSION['userID'];
        $role = $_SESSION['role'] ?? 'student';

        if ($role === 'student') {
            // Get student's cohort_id first
            $sqlQuery = "SELECT cohort_id FROM ticketing_users WHERE user_id = :id LIMIT 1";
            $result = $dbConnection->prepare($sqlQuery);
            $result->execute([':id' => $userId]);
            $row = $result->fetch(PDO::FETCH_ASSOC);
            $cohortId = $row ? $row['cohort_id'] : null;

            // No cohort assigned -> no modules available
            if (empty($cohortId)) {
                echo json_encode([
                    "message" => "No modules available",
                    "modules" => [],
                ]);
                exit();
            }

            // Filter by cohort_modules join
            $sqlQuery = "SELECT m.module_id, m.module_code, m.module_name,
                                u.first_name AS lecturer_first_name, u.last_name AS lecturer_last_name
                         FROM modules m
                         JOIN ticketing_users u ON m.lecturer_id = u.user_id
                         JOIN cohort_modules cm ON cm.module_id = m.module_id
                         WHERE m.is_active = TRUE
                           AND cm.cohort_id = :cohort_id
                         ORDER BY m.module_code ASC";
            $result = $dbConnection->prepare($sqlQuery);
            $result->execute([':cohort_id' => $cohortId]);
        } else {
            // Lecturers and admins see all active modules
            $sqlQuery = "SELECT m.module_id, m.module_code, m.module_name,
                                u.first_name AS lecturer_first_name, u.last_name AS lecturer_last_name
                         FROM modules m
                         JOIN ticketing_users u ON m.lecturer_id = u.user_id
                         WHERE m.is_active = TRUE
                         ORDER BY m.module_code ASC";
            $result = $dbConnection->prepare($sqlQuery);
            $result->execute();
        }

        $modules = $result->fetchAll(PDO::FETCH_ASSOC);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode([
        "message" => "Modules retrieved successfully",
        "modules" => $modules,
    ]);
    exit();
}