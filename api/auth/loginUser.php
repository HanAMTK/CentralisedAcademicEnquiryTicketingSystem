<?php
// ============================================
// loginUser.php
// Authenticates user and creates session
// Called via: index.php?action=login (POST)
// ============================================

function checkCredentials() {
    // Check request method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        return "Invalid request method";
    }

    // Decode JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        return "Email and password are required";
    }

    $email    = trim($input['email']);
    $password = $input['password'];

    // Prepare and execute SQL query to fetch user data
    require "../getConnection.php";

    $sqlQuery = "SELECT * FROM ticketing_users WHERE email = :email LIMIT 1";
    $param['email'] = $email;

    try {
        $dbConnection = getConnection();
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
        $user = $result->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        http_response_code(500);
        return "Error: " . $e->getMessage();
    }

    // Verify credentials
    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        return "Invalid email or password";
    }

    // Check if account is active
    if (!$user['is_active']) {
        http_response_code(403);
        return "Account is deactivated. Please contact admin.";
    }

    // Store user data in session
    $_SESSION['userID']    = $user['user_id'];
    $_SESSION['email']     = $user['email'];
    $_SESSION['role']      = $user['role'];
    $_SESSION['firstName'] = $user['first_name'];
    $_SESSION['lastName']  = $user['last_name'];
    $_SESSION['mustChangePassword'] = (bool) $user['must_change_password'];

    return "Login successful";
}

function loginUser() {

    if (!empty($_SESSION['userID'])) {
        $message = "User " . $_SESSION['userID'] . " is already logged in";
    } else {
        $message = checkCredentials();
    }

    // Return JSON response
    echo json_encode([
        "message" => $message,
        "userID"  => $_SESSION['userID'] ?? null,
        "user"    => isset($_SESSION['userID']) ? [
            "user_id"              => $_SESSION['userID'],
            "email"                => $_SESSION['email'],
            "first_name"           => $_SESSION['firstName'],
            "last_name"            => $_SESSION['lastName'],
            "role"                 => $_SESSION['role'],
            "must_change_password" => $_SESSION['mustChangePassword'],
        ] : null,
    ]);
    exit();
}