<?php

// HTTP headers for CORS and JSON response
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

require "createTicket.php";
require "getModules.php";
require "getStudentTickets.php";
require "getLecturerTickets.php";
require "getTicketDetail.php";
require "addReply.php";
require "claimTicket.php";
require "updateTicketStatus.php";
require "getLecturerDashboard.php";

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if 'action' parameter is set
if (!isset($_GET['action'])) {
    http_response_code(400);
    echo json_encode(["message" => "Bad Request: Action parameter is missing"]);
    exit();
}

switch ($_GET['action']) {
    case 'create':
        createTicket();
        break;
    case 'modules':
        getModules();
        break;
    case 'my-tickets':
        getStudentTickets();
        break;
    case 'lecturer-tickets':
        getLecturerTickets();
        break;
    case 'detail':
        getTicketDetail();
        break;
    case 'reply':
        addReply();
        break;
    case 'claim':
        claimTicket();
        break;
    case 'update-status':
        updateTicketStatus();
        break;
    case 'lecturer-dashboard':
        getLecturerDashboard();
        break;
    default:
        http_response_code(400);
        echo json_encode(["message" => "Bad Request: Invalid action"]);
        break;
}