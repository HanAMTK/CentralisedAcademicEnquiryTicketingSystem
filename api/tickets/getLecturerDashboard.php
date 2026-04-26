<?php
// ============================================
// getLecturerDashboard.php
// Returns dashboard statistics for the logged-in lecturer
// Called via: index.php?action=lecturer-dashboard (GET)
// Optional: ?weeks=12 (4, 12, or 52 - defaults to 12)
// ============================================

function getLecturerDashboard() {
    // Check authentication
    if (empty($_SESSION['userID'])) {
        http_response_code(401);
        echo json_encode(["message" => "Not authenticated"]);
        exit();
    }

    if ($_SESSION['role'] !== 'lecturer') {
        http_response_code(403);
        echo json_encode(["message" => "Lecturers only"]);
        exit();
    }

    $lecturerId = $_SESSION['userID'];
    $weeks = isset($_GET['weeks']) ? (int) $_GET['weeks'] : 12;
    if (!in_array($weeks, [4, 12, 52])) $weeks = 12;

    require "../getConnection.php";

    try {
        $dbConnection = getConnection();

        // Top-line KPIs
        $sqlQuery = "SELECT
                        COUNT(*) AS total_tickets,
                        SUM(CASE WHEN status NOT IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) AS open_tickets,
                        SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) AS resolved_tickets
                     FROM tickets
                     WHERE assigned_lecturer_id = :lecturer_id";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':lecturer_id' => $lecturerId]);
        $kpis = $result->fetch(PDO::FETCH_ASSOC);

        // Average first-response time in hours (only for tickets where lecturer has responded)
        $sqlQuery = "SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, first_response_at)) AS avg_response_minutes
                     FROM tickets
                     WHERE assigned_lecturer_id = :lecturer_id
                       AND first_response_at IS NOT NULL";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':lecturer_id' => $lecturerId]);
        $row = $result->fetch(PDO::FETCH_ASSOC);
        $avgResponseHours = $row['avg_response_minutes'] !== null
            ? round($row['avg_response_minutes'] / 60, 1)
            : null;

        // SLA compliance % (responded within deadline / total responded)
        $sqlQuery = "SELECT
                        SUM(CASE WHEN first_response_at <= sla_deadline THEN 1 ELSE 0 END) AS met,
                        SUM(CASE WHEN first_response_at > sla_deadline THEN 1 ELSE 0 END) AS breached,
                        COUNT(*) AS total
                     FROM tickets
                     WHERE assigned_lecturer_id = :lecturer_id
                       AND first_response_at IS NOT NULL
                       AND sla_deadline IS NOT NULL";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':lecturer_id' => $lecturerId]);
        $slaRow = $result->fetch(PDO::FETCH_ASSOC);
        $slaCompliance = $slaRow['total'] > 0
            ? round(($slaRow['met'] / $slaRow['total']) * 100, 1)
            : null;

        // Average rating
        $sqlQuery = "SELECT AVG(stars) AS avg_stars, COUNT(*) AS total_ratings
                     FROM ticket_ratings
                     WHERE lecturer_id = :lecturer_id";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':lecturer_id' => $lecturerId]);
        $ratingRow = $result->fetch(PDO::FETCH_ASSOC);
        $avgRating = $ratingRow['avg_stars'] !== null
            ? round($ratingRow['avg_stars'], 2)
            : null;

        // Tickets over time
        $bucket = $weeks === 52 ? 'month' : 'week';
        if ($bucket === 'week') {
            $sqlQuery = "SELECT
                            DATE(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY)) AS bucket,
                            COUNT(*) AS count
                         FROM tickets
                         WHERE assigned_lecturer_id = :lecturer_id
                           AND created_at >= DATE_SUB(NOW(), INTERVAL :weeks WEEK)
                         GROUP BY bucket
                         ORDER BY bucket ASC";
        } else {
            $sqlQuery = "SELECT
                            DATE_FORMAT(created_at, '%Y-%m-01') AS bucket,
                            COUNT(*) AS count
                         FROM tickets
                         WHERE assigned_lecturer_id = :lecturer_id
                           AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                         GROUP BY bucket
                         ORDER BY bucket ASC";
        }
        $result = $dbConnection->prepare($sqlQuery);
        if ($bucket === 'week') {
            $result->execute([':lecturer_id' => $lecturerId, ':weeks' => $weeks]);
        } else {
            $result->execute([':lecturer_id' => $lecturerId]);
        }
        $ticketsOverTime = $result->fetchAll(PDO::FETCH_ASSOC);

        // Category breakdown
        $sqlQuery = "SELECT category, COUNT(*) AS count
                     FROM tickets
                     WHERE assigned_lecturer_id = :lecturer_id
                     GROUP BY category
                     ORDER BY count DESC";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':lecturer_id' => $lecturerId]);
        $categoryBreakdown = $result->fetchAll(PDO::FETCH_ASSOC);

        // Urgency distribution
        $sqlQuery = "SELECT urgency, COUNT(*) AS count
                     FROM tickets
                     WHERE assigned_lecturer_id = :lecturer_id
                     GROUP BY urgency";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':lecturer_id' => $lecturerId]);
        $urgencyDistribution = $result->fetchAll(PDO::FETCH_ASSOC);

        // Status distribution
        $sqlQuery = "SELECT status, COUNT(*) AS count
                     FROM tickets
                     WHERE assigned_lecturer_id = :lecturer_id
                     GROUP BY status";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':lecturer_id' => $lecturerId]);
        $statusDistribution = $result->fetchAll(PDO::FETCH_ASSOC);

        // Rating distribution (1-5 stars)
        $sqlQuery = "SELECT stars, COUNT(*) AS count
                     FROM ticket_ratings
                     WHERE lecturer_id = :lecturer_id
                     GROUP BY stars
                     ORDER BY stars ASC";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':lecturer_id' => $lecturerId]);
        $ratingDistribution = $result->fetchAll(PDO::FETCH_ASSOC);

        // Resolution outcome breakdown
        $sqlQuery = "SELECT issue_resolved, COUNT(*) AS count
                     FROM ticket_ratings
                     WHERE lecturer_id = :lecturer_id
                     GROUP BY issue_resolved";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':lecturer_id' => $lecturerId]);
        $resolutionOutcome = $result->fetchAll(PDO::FETCH_ASSOC);

        // SLA performance by urgency
        $sqlQuery = "SELECT
                        urgency,
                        COUNT(*) AS total,
                        SUM(CASE WHEN first_response_at <= sla_deadline THEN 1 ELSE 0 END) AS met,
                        SUM(CASE WHEN first_response_at > sla_deadline OR (first_response_at IS NULL AND sla_deadline < NOW()) THEN 1 ELSE 0 END) AS breached
                     FROM tickets
                     WHERE assigned_lecturer_id = :lecturer_id
                       AND sla_deadline IS NOT NULL
                     GROUP BY urgency";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':lecturer_id' => $lecturerId]);
        $slaByUrgency = $result->fetchAll(PDO::FETCH_ASSOC);

        // Top modules by ticket volume (top 5)
        $sqlQuery = "SELECT m.module_code, m.module_name, COUNT(*) AS count
                     FROM tickets t
                     JOIN modules m ON t.module_id = m.module_id
                     WHERE t.assigned_lecturer_id = :lecturer_id
                     GROUP BY m.module_id
                     ORDER BY count DESC
                     LIMIT 5";
        $result = $dbConnection->prepare($sqlQuery);
        $result->execute([':lecturer_id' => $lecturerId]);
        $topModules = $result->fetchAll(PDO::FETCH_ASSOC);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
        exit();
    }

    echo json_encode([
        "message" => "Dashboard data retrieved successfully",
        "data" => [
            "kpis" => [
                "total_tickets"        => (int) $kpis['total_tickets'],
                "open_tickets"         => (int) $kpis['open_tickets'],
                "resolved_tickets"     => (int) $kpis['resolved_tickets'],
                "avg_response_hours"   => $avgResponseHours,
                "sla_compliance"       => $slaCompliance,
                "avg_rating"           => $avgRating,
                "total_ratings"        => (int) $ratingRow['total_ratings'],
            ],
            "tickets_over_time"    => $ticketsOverTime,
            "bucket"               => $bucket,
            "category_breakdown"   => $categoryBreakdown,
            "urgency_distribution" => $urgencyDistribution,
            "status_distribution"  => $statusDistribution,
            "rating_distribution"  => $ratingDistribution,
            "resolution_outcome"   => $resolutionOutcome,
            "sla_by_urgency"       => $slaByUrgency,
            "top_modules"          => $topModules,
        ],
    ]);
    exit();
}