<?php
// ============================================
// slaHelper.php
// Centralised SLA logic - durations, deadline calculation
// ============================================

/**
 * Returns the SLA duration in hours for a given urgency level.
 */
function getSlaHours($urgency) {
    switch ($urgency) {
        case 'Critical': return 4;
        case 'High':     return 24;
        case 'Medium':   return 72;   // 3 days
        case 'Low':      return 168;  // 7 days
        default:         return 168;
    }
}

/**
 * Calculates the SLA deadline from a creation timestamp and urgency.
 */
function calculateSlaDeadline($createdAt, $urgency) {
    $hours = getSlaHours($urgency);
    $deadline = new DateTime($createdAt);
    $deadline->modify("+{$hours} hours");
    return $deadline->format('Y-m-d H:i:s');
}