<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

session_set_cookie_params([
    'secure'   => true,
    'samesite' => 'None',
]);

session_start();

require "getUsers.php";
require "toggleUserStatus.php";
require "resetUserPassword.php";
require "getModules.php";
require "createModule.php";
require "updateModule.php";
require "getStats.php";

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check authentication
if (empty($_SESSION['userID'])) {
    http_response_code(401);
    echo json_encode(["message" => "Not authenticated"]);
    exit();
}

// Check admin role
if ($_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["message" => "Admin access required"]);
    exit();
}

if (!isset($_GET['action'])) {
    http_response_code(400);
    echo json_encode(["message" => "Bad Request: Action parameter is missing"]);
    exit();
}

switch ($_GET['action']) {
    case 'stats':
        getStats();
        break;
    case 'users':
        getUsers();
        break;
    case 'create-user':
        // Reuse existing createUser from auth
        require "../auth/createUser.php";
        createUser();
        break;
    case 'toggle-user':
        toggleUserStatus();
        break;
    case 'reset-user-password':
        resetUserPassword();
        break;
    case 'modules':
        adminGetModules();
        break;
    case 'create-module':
        createModule();
        break;
    case 'update-module':
        updateModule();
        break;
    default:
        http_response_code(400);
        echo json_encode(["message" => "Bad Request: Invalid action"]);
        break;
}