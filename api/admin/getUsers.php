<?php
// ============================================
// getUsers.php
// Returns all users with their cohort info (if any)
// Called via: index.php?action=users (GET)
// ============================================

function getUsers() {
    require "../getConnection.php";

    $sqlQuery = "SELECT u.user_id, u.email, u.first_name, u.last_name, u.role,
                        u.is_active, u.must_change_password, u.created_at, u.updated_at,
                        u.cohort_id, c.name AS cohort_name
                 FROM ticketing_users u
                 LEFT JOIN cohorts c ON u.cohort_id = c.cohort_id
                 ORDER BY u.created_at DESC";

    try {
        $dbConnection = getConnection();
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $users = $result->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode([
        "message" => "Users retrieved successfully",
        "users" => $users,
    ]);
    exit();
}