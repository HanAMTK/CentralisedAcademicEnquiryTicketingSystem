import React, { useState, useEffect } from "react";
import { css } from "@emotion/css";
import { Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

/**
 * SLABadge — lecturer-only SLA indicator
 *
 * Props:
 *   slaDeadline      — ISO string or null
 *   firstResponseAt  — ISO string or null (when lecturer first replied)
 *   variant          — 'compact' (queue rows) | 'detail' (ticket detail page)
 */
const SLABadge = ({ slaDeadline, firstResponseAt, variant = "compact" }) => {
  const [now, setNow] = useState(new Date());

  // Tick every minute so countdowns stay live for unanswered tickets
  useEffect(() => {
    if (firstResponseAt) return; // already responded — no need to tick
    const intervalId = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(intervalId);
  }, [firstResponseAt]);

  if (!slaDeadline) return null;

  const deadline = new Date(slaDeadline);
  const responded = firstResponseAt ? new Date(firstResponseAt) : null;

  // Determine SLA status
  let status, label, icon, timeText;

  if (responded) {
    if (responded <= deadline) {
      status = "met";
      label = "SLA Met";
      icon = <CheckCircle className={s.iconSmall} />;
      timeText = `Responded ${formatDuration(deadline - responded)} early`;
    } else {
      status = "breached";
      label = "SLA Breached";
      icon = <XCircle className={s.iconSmall} />;
      timeText = `Responded ${formatDuration(responded - deadline)} late`;
    }
  } else {
    const msRemaining = deadline - now;
    if (msRemaining <= 0) {
      status = "overdue";
      label = "Overdue";
      icon = <AlertTriangle className={s.iconSmall} />;
      timeText = `${formatDuration(-msRemaining)} overdue`;
    } else {
      // <2h left = due soon
      const dueSoonThreshold = 2 * 60 * 60 * 1000;
      if (msRemaining < dueSoonThreshold) {
        status = "due_soon";
        label = "Due Soon";
        icon = <Clock className={s.iconSmall} />;
      } else {
        status = "on_track";
        label = "On Track";
        icon = <Clock className={s.iconSmall} />;
      }
      timeText = `Due in ${formatDuration(msRemaining)}`;
    }
  }

  const containerClass = variant === "detail" ? s.detailContainer : s.compactContainer;
  const statusClass = s[`status_${status}`];

  if (variant === "detail") {
    return (
      <div className={`${containerClass} ${statusClass}`}>
        <div className={s.detailHeader}>
          {icon}
          <span className={s.detailLabel}>{label}</span>
        </div>
        <p className={s.detailTime}>{timeText}</p>
        <p className={s.detailDeadline}>
          Deadline: {deadline.toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit"
          })}
        </p>
      </div>
    );
  }

  // Compact variant for ticket queue rows
  return (
    <span className={`${containerClass} ${statusClass}`} title={timeText}>
      {icon}
      <span>{label}</span>
    </span>
  );
};

/* Format a millisecond duration as "Xd Yh", "Xh Ym", or "Xm" */
function formatDuration(ms) {
  const totalMinutes = Math.floor(Math.abs(ms) / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default SLABadge;

/* ========================
   Styles
   ======================== */
const s = {
  iconSmall: css`
    width: 0.875rem;
    height: 0.875rem;
  `,

  /* Compact (queue rows) */
  compactContainer: css`
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
  `,

  /* Detail (ticket detail page card) */
  detailContainer: css`
    border-radius: 0.5rem;
    padding: 0.875rem 1rem;
    border: 1px solid;
  `,
  detailHeader: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  `,
  detailLabel: css`
    font-size: 0.875rem;
  `,
  detailTime: css`
    margin: 0;
    font-size: 0.875rem;
    font-weight: 500;
  `,
  detailDeadline: css`
    margin: 0.25rem 0 0 0;
    font-size: 0.75rem;
    opacity: 0.8;
  `,

  /* Status colours */
  status_on_track: css`
    background-color: #dcfce7;
    color: #166534;
    border-color: #bbf7d0;
  `,
  status_due_soon: css`
    background-color: #fef9c3;
    color: #854d0e;
    border-color: #fef08a;
  `,
  status_overdue: css`
    background-color: #fee2e2;
    color: #991b1b;
    border-color: #fecaca;
  `,
  status_met: css`
    background-color: #dcfce7;
    color: #166534;
    border-color: #bbf7d0;
  `,
  status_breached: css`
    background-color: #fee2e2;
    color: #991b1b;
    border-color: #fecaca;
  `,
};