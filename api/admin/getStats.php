<?php
// ============================================
// getStats.php
// Returns dashboard statistics (admin-only, system-wide)
// Called via: index.php?action=stats (GET)
// Optional: ?weeks=12 (4, 12, or 52 - defaults to 12)
// ============================================

function getStats() {
    // Auth check
    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode(["message" => "Not authenticated"]);
        exit();
    }
    if (($_SESSION['role'] ?? '') !== 'admin') {
        http_response_code(403);
        echo json_encode(["message" => "Admins only"]);
        exit();
    }

    $weeks = isset($_GET['weeks']) ? (int) $_GET['weeks'] : 12;
    if (!in_array($weeks, [4, 12, 52])) $weeks = 12;

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        // === USER COUNTS ===
        $sqlQuery = "SELECT role, COUNT(*) as count FROM ticketing_users GROUP BY role";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $roleCounts = $result->fetchAll(PDO::FETCH_KEY_PAIR);

        $sqlQuery = "SELECT is_active, COUNT(*) as count FROM ticketing_users GROUP BY is_active";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $activeCounts = $result->fetchAll(PDO::FETCH_KEY_PAIR);

        // === TICKETS ===
        $sqlQuery = "SELECT
                        COUNT(*) AS total_tickets,
                        SUM(CASE WHEN status NOT IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) AS open_tickets,
                        SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) AS resolved_tickets
                     FROM tickets";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $ticketKpis = $result->fetch(PDO::FETCH_ASSOC);

        $sqlQuery = "SELECT status, COUNT(*) as count FROM tickets GROUP BY status";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $ticketsByStatus = $result->fetchAll(PDO::FETCH_KEY_PAIR);

        // Modules
        $sqlQuery = "SELECT COUNT(*) as total FROM modules WHERE is_active = TRUE";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $totalModules = $result->fetch(PDO::FETCH_ASSOC)['total'];

        // === SYSTEM-WIDE PERFORMANCE ===
        // Avg first-response time
        $sqlQuery = "SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, first_response_at)) AS avg_minutes
                     FROM tickets WHERE first_response_at IS NOT NULL";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $row = $result->fetch(PDO::FETCH_ASSOC);
        $avgResponseHours = $row['avg_minutes'] !== null ? round($row['avg_minutes'] / 60, 1) : null;

        // SLA compliance
        $sqlQuery = "SELECT
                        SUM(CASE WHEN first_response_at <= sla_deadline THEN 1 ELSE 0 END) AS met,
                        COUNT(*) AS total
                     FROM tickets
                     WHERE first_response_at IS NOT NULL AND sla_deadline IS NOT NULL";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $slaRow = $result->fetch(PDO::FETCH_ASSOC);
        $slaCompliance = $slaRow['total'] > 0
            ? round(($slaRow['met'] / $slaRow['total']) * 100, 1)
            : null;

        // Avg rating
        $sqlQuery = "SELECT AVG(stars) AS avg_stars, COUNT(*) AS total_ratings FROM ticket_ratings";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $ratingRow = $result->fetch(PDO::FETCH_ASSOC);
        $avgRating = $ratingRow['avg_stars'] !== null ? round($ratingRow['avg_stars'], 2) : null;

        // === TIME SERIES ===
        $bucket = $weeks === 52 ? 'month' : 'week';
        if ($bucket === 'week') {
            $sqlQuery = "SELECT
                            DATE(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY)) AS bucket,
                            COUNT(*) AS count
                         FROM tickets
                         WHERE created_at >= DATE_SUB(NOW(), INTERVAL :weeks WEEK)
                         GROUP BY bucket
                         ORDER BY bucket ASC";
            $result = $dbConnection->prepare($sqlQuery);
            $result->execute([':weeks' => $weeks]);
        } else {
            $sqlQuery = "SELECT
                            DATE_FORMAT(created_at, '%Y-%m-01') AS bucket,
                            COUNT(*) AS count
                         FROM tickets
                         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                         GROUP BY bucket
                         ORDER BY bucket ASC";
            $result = $dbConnection->prepare($sqlQuery);
            $result->execute();
        }
        $ticketsOverTime = $result->fetchAll(PDO::FETCH_ASSOC);

        // === DISTRIBUTIONS ===
        $sqlQuery = "SELECT category, COUNT(*) AS count FROM tickets GROUP BY category ORDER BY count DESC";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $categoryBreakdown = $result->fetchAll(PDO::FETCH_ASSOC);

        $sqlQuery = "SELECT urgency, COUNT(*) AS count FROM tickets GROUP BY urgency";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $urgencyDistribution = $result->fetchAll(PDO::FETCH_ASSOC);

        $sqlQuery = "SELECT stars, COUNT(*) AS count FROM ticket_ratings GROUP BY stars ORDER BY stars ASC";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $ratingDistribution = $result->fetchAll(PDO::FETCH_ASSOC);

        // === LECTURER LEADERBOARDS ===
        // Top modules by ticket volume (top 10)
        $sqlQuery = "SELECT m.module_code, m.module_name, COUNT(*) AS count
                     FROM tickets t
                     JOIN modules m ON t.module_id = m.module_id
                     GROUP BY m.module_id
                     ORDER BY count DESC
                     LIMIT 10";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $topModules = $result->fetchAll(PDO::FETCH_ASSOC);

        // Lecturer performance leaderboard
        $sqlQuery = "SELECT
                        u.user_id,
                        u.first_name,
                        u.last_name,
                        COUNT(DISTINCT t.ticket_id) AS ticket_count,
                        AVG(TIMESTAMPDIFF(MINUTE, t.created_at, t.first_response_at)) AS avg_response_minutes,
                        SUM(CASE WHEN t.first_response_at <= t.sla_deadline THEN 1 ELSE 0 END) AS sla_met,
                        SUM(CASE WHEN t.first_response_at IS NOT NULL AND t.sla_deadline IS NOT NULL THEN 1 ELSE 0 END) AS sla_total,
                        (SELECT AVG(stars) FROM ticket_ratings WHERE lecturer_id = u.user_id) AS avg_rating,
                        (SELECT COUNT(*) FROM ticket_ratings WHERE lecturer_id = u.user_id) AS rating_count
                     FROM ticketing_users u
                     LEFT JOIN tickets t ON t.assigned_lecturer_id = u.user_id
                     WHERE u.role = 'lecturer'
                     GROUP BY u.user_id
                     ORDER BY ticket_count DESC";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute();
        $lecturerStats = $result->fetchAll(PDO::FETCH_ASSOC);

        // Format lecturer stats
        $formattedLecturerStats = array_map(function ($row) {
            return [
                "user_id"            => (int) $row['user_id'],
                "name"               => trim($row['first_name'] . ' ' . $row['last_name']),
                "ticket_count"       => (int) $row['ticket_count'],
                "avg_response_hours" => $row['avg_response_minutes'] !== null
                    ? round($row['avg_response_minutes'] / 60, 1)
                    : null,
                "sla_compliance"     => $row['sla_total'] > 0
                    ? round(($row['sla_met'] / $row['sla_total']) * 100, 1)
                    : null,
                "avg_rating"         => $row['avg_rating'] !== null ? round($row['avg_rating'], 2) : null,
                "rating_count"       => (int) $row['rating_count'],
            ];
        }, $lecturerStats);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode([
        "message" => "Stats retrieved successfully",
        "stats" => [
            "users" => [
                "students"  => (int) ($roleCounts['student'] ?? 0),
                "lecturers" => (int) ($roleCounts['lecturer'] ?? 0),
                "admins"    => (int) ($roleCounts['admin'] ?? 0),
                "active"    => (int) ($activeCounts[1] ?? 0),
                "inactive"  => (int) ($activeCounts[0] ?? 0),
            ],
            "tickets" => [
                "total"     => (int) $ticketKpis['total_tickets'],
                "open"      => (int) $ticketKpis['open_tickets'],
                "resolved"  => (int) $ticketKpis['resolved_tickets'],
                "by_status" => $ticketsByStatus,
            ],
            "modules" => [
                "total" => (int) $totalModules,
            ],
            "performance" => [
                "avg_response_hours" => $avgResponseHours,
                "sla_compliance"     => $slaCompliance,
                "avg_rating"         => $avgRating,
                "total_ratings"      => (int) $ratingRow['total_ratings'],
            ],
            "tickets_over_time"    => $ticketsOverTime,
            "bucket"               => $bucket,
            "category_breakdown"   => $categoryBreakdown,
            "urgency_distribution" => $urgencyDistribution,
            "rating_distribution"  => $ratingDistribution,
            "top_modules"          => $topModules,
            "lecturer_stats"       => $formattedLecturerStats,
        ],
    ]);
    exit();
}