<?php

// HTTP headers for CORS and JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

/**
 * Set cookie parameters for cross-origin requests
 */
session_set_cookie_params([
    'secure'   => true,   // Required for HTTPS + SameSite=None
    'samesite' => 'None', // Allows cross-origin
]);

session_start();

require "loginUser.php";
require "logoutUser.php";
require "getSession.php";
require "changePassword.php";
require "forgotPassword.php";
require "resetPassword.php";
require "createUser.php";

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if 'action' parameter is set in the query string
if (!isset($_GET['action'])) {
    http_response_code(400);
    echo json_encode(["message" => "Bad Request: Action parameter is missing"]);
    exit();
}

switch ($_GET['action']) {
    case 'login':
        loginUser();
        break;
    case 'logout':
        logoutUser();
        break;
    case 'session':
        getSession();
        break;
    case 'change-password':
        changePassword();
        break;
    case 'forgot-password':
        forgotPassword();
        break;
    case 'reset-password':
        resetPassword();
        break;
    case 'create-user':
        createUser();
        break;
    default:
        http_response_code(400);
        echo json_encode(["message" => "Bad Request: Invalid action"]);
        break;
}