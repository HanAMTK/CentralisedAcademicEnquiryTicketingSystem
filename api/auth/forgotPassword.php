<?php
// ============================================
// forgotPassword.php
// Generates a password reset token and sends email
// Called via: index.php?action=forgot-password (POST)
// ============================================

function generateResetToken($email) {
    require "../getConnection.php";

    // Look up user
    $sqlQuery = "SELECT user_id, first_name, email FROM ticketing_users WHERE email = :email AND is_active = TRUE LIMIT 1";
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

    if (!$user) {
        // Return null to prevent email enumeration
        return null;
    }

    // Invalidate any existing unused tokens for this user
    $sqlQuery = "UPDATE password_reset_tokens SET used = TRUE WHERE user_id = :user_id AND used = FALSE";
    $param = ['user_id' => $user['user_id']];

    try {
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
    } catch (PDOException $e) {
        http_response_code(500);
        return "Error: " . $e->getMessage();
    }

    // Generate secure token
    $token     = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

    // Store token
    $sqlQuery = "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)";
    $param = [
        'user_id'    => $user['user_id'],
        'token'      => $token,
        'expires_at' => $expiresAt,
    ];

    try {
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute($param);
    } catch (PDOException $e) {
        http_response_code(500);
        return "Error: " . $e->getMessage();
    }

    // Build reset link — change this URL to match your frontend deployment
    $resetLink = "http://localhost:5173/reset-password?token=" . $token;

    // Send email
    $subject = "Password Reset - Academic Enquiry System";
    $emailBody  = "Hi {$user['first_name']},\n\n";
    $emailBody .= "You requested a password reset. Click the link below to reset your password:\n\n";
    $emailBody .= $resetLink . "\n\n";
    $emailBody .= "This link expires in 1 hour.\n\n";
    $emailBody .= "If you did not request this, please ignore this email.\n\n";
    $emailBody .= "Regards,\nAcademic Enquiry System";

    $headers = "From: noreply@yourdomain.ac.uk\r\n";
    $headers .= "Reply-To: noreply@yourdomain.ac.uk\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    mail($user['email'], $subject, $emailBody, $headers);

    return null;
}

function forgotPassword() {
    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["message" => "Invalid request method"]);
        exit();
    }

    // Decode JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['email']) || empty(trim($input['email']))) {
        http_response_code(400);
        echo json_encode(["message" => "Email is required"]);
        exit();
    }

    $error = generateResetToken(trim($input['email']));

    if ($error !== null) {
        echo json_encode(["message" => $error]);
        exit();
    }

    // Always return success to prevent email enumeration
    echo json_encode(["message" => "If an account exists with that email, a reset link has been sent"]);
    exit();
}