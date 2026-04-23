 <?php
// ============================================
// getUsers.php
// Returns all users
// Called via: index.php?action=users (GET)
// ============================================

function getUsers() {
    require "../getConnection.php";

    $sqlQuery = "SELECT user_id, email, first_name, last_name, role, is_active, must_change_password, created_at, updated_at
                 FROM ticketing_users
                 ORDER BY created_at DESC";

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