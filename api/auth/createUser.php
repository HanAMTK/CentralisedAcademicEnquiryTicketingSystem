<?php
// ============================================
// createUser.php
// Creates a new user account with a default password
// Called via: index.php?action=create-user (POST)
// ============================================

function validateUserInput($input) {
    if (!isset($input['email']) || !isset($input['first_name']) || !isset($input['last_name']) || !isset($input['role'])) {
        http_response_code(400);
        return "Email, first_name, last_name, and role are required";
    }

    $allowedRoles = ['student', 'lecturer', 'admin'];
    if (!in_array($input['role'], $allowedRoles)) {
        http_response_code(400);
        return "Role must be one of: student, lecturer, admin";
    }

    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        return "Invalid email format";
    }

    return null; // No error
}

function processCreateUser($input) {
    require "../getConnection.php";

    $email     = trim($input['email']);
    $firstName = trim($input['first_name']);
    $lastName  = trim($input['last_name']);
    $role      = $input['role'];
    $password  = $input['password'] ?? 'default123';

    // Check if email already exists
    $sqlQuery = "SELECT user_id FROM users WHERE email = :email LIMIT 1";

    try {
        $dbConnection = getConnection();
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':email' => $email]);
        $existing = $result->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        http_response_code(500);
        return "Error: " . $e->getMessage();
    }

    if ($existing) {
        http_response_code(409);
        return "A user with this email already exists";
    }

    // Create user
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $sqlQuery = "INSERT INTO ticketing_users (email, password_hash, first_name, last_name, role, must_change_password)
                 VALUES (:email, :password_hash, :first_name, :last_name, :role, TRUE)";

    try {
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([
            ':email'         => $email,
            ':password_hash' => $passwordHash,
            ':first_name'    => $firstName,
            ':last_name'     => $lastName,
            ':role'          => $role,
        ]);
        $userId = $dbConnection->lastInsertId();
    } catch (PDOException $e) {
        http_response_code(500);
        return "Error: " . $e->getMessage();
    }

    return [
        "user_id"    => (int) $userId,
        "email"      => $email,
        "first_name" => $firstName,
        "last_name"  => $lastName,
        "role"       => $role,
        "password"   => $password,
    ];
}

function createUser() {
    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["message" => "Invalid request method"]);
        exit();
    }

    // Decode JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate input
    $validationError = validateUserInput($input);
    if ($validationError !== null) {
        echo json_encode(["message" => $validationError]);
        exit();
    }

    // Process user creation
    $result = processCreateUser($input);

    if (is_string($result)) {
        // Error message
        echo json_encode(["message" => $result]);
    } else {
        // Success — return created user
        http_response_code(201);
        echo json_encode([
            "message" => "User created successfully",
            "user"    => $result,
        ]);
    }

    exit();
}