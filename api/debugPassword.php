<?php
header('Content-Type: application/json');

require "getConnection.php";

$email = "student@test.com";
$testPassword = "default123";

try {
    $dbConnection = getConnection();
    $result = $dbConnection->prepare("SELECT user_id, email, password_hash FROM ticketing_users WHERE email = :email LIMIT 1");
    $result->execute([':email' => $email]);
    $user = $result->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(["error" => "User not found"]);
        exit();
    }

    echo json_encode([
        "user_id"        => $user['user_id'],
        "email"          => $user['email'],
        "hash_stored"    => $user['password_hash'],
        "hash_length"    => strlen($user['password_hash']),
        "verify_result"  => password_verify($testPassword, $user['password_hash']),
        "fresh_hash"     => password_hash($testPassword, PASSWORD_DEFAULT),
    ]);

} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}