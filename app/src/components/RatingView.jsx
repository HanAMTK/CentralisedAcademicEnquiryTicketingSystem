import React, { useState, useEffect } from "react";
import { css } from "@emotion/css";
import { Star, CheckCircle, MinusCircle, XCircle, MessageCircle } from "lucide-react";
import { format } from "date-fns";
 
const API_BASE = "https://w25037936.nuwebspace.co.uk/KV6027/CAETS/api/ratings/index.php";
 
const RatingView = ({ ticketId, ticketStatus }) => {
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(true);
 
  const canHaveRating = ticketStatus === "Resolved" || ticketStatus === "Closed";
 
  useEffect(() => {
    if (!canHaveRating) {
      setLoading(false);
      return;
    }
 
    const fetchRating = async () => {
      try {
        const res = await fetch(`${API_BASE}?action=get&ticket_id=${ticketId}`, {
          credentials: "include",
        });
        const data = await res.json();
 
        if (res.ok && data.rating) {
          setRating(data.rating);
        }
      } catch (err) {
        // Silently fail - no rating is a valid state
      } finally {
        setLoading(false);
      }
    };
 
    fetchRating();
  }, [ticketId, canHaveRating]);
 
  const getResolvedIcon = (value) => {
    if (value === "yes") return <CheckCircle className={s.resolvedIconYes} />;
    if (value === "partially") return <MinusCircle className={s.resolvedIconPartial} />;
    if (value === "no") return <XCircle className={s.resolvedIconNo} />;
    return null;
  };
 
  const getResolvedLabel = (value) => {
    if (value === "yes") return "Yes";
    if (value === "partially") return "Partially";
    if (value === "no") return "No";
    return value;
  };
 
  if (!canHaveRating || loading) return null;
 
  /* --- No rating submitted yet --- */
  if (!rating) {
    return (
      <div className={s.card}>
        <div className={s.emptyState}>
          <MessageCircle className={s.emptyIcon} />
          <div>
            <h3 className={s.emptyTitle}>No Rating Yet</h3>
            <p className={s.emptySubtitle}>
              The student has not submitted a rating for this ticket.
            </p>
          </div>
        </div>
      </div>
    );
  }
 
  /* --- Rating submitted --- */
  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div>
          <h3 className={s.cardTitle}>Student Rating</h3>
          <p className={s.cardSubtitle}>
            Submitted {format(new Date(rating.updated_at), "dd MMM yyyy, HH:mm")}
          </p>
        </div>
      </div>
 
      <div className={s.summaryStars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={n <= rating.stars ? s.starFilled : s.starEmpty}
            fill={n <= rating.stars ? "#fbbf24" : "none"}
          />
        ))}
        <span className={s.starsLabel}>{rating.stars} / 5</span>
      </div>
 
      <div className={s.summaryRow}>
        {getResolvedIcon(rating.issue_resolved)}
        <span className={s.summaryRowText}>
          Issue resolved:{" "}
          <strong className={s.summaryResolvedValue}>
            {getResolvedLabel(rating.issue_resolved)}
          </strong>
        </span>
      </div>
 
      {rating.comment && (
        <div className={s.commentBlock}>
          <p className={s.commentLabel}>Student's comment:</p>
          <p className={s.commentText}>"{rating.comment}"</p>
        </div>
      )}
    </div>
  );
};
 
export default RatingView;
 
/* ========================
   Styles
   ======================== */
const s = {
  card: css`
    background: linear-gradient(135deg, #faf5ff 0%, #ffffff 100%);
    border: 1px solid #e9d5ff;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(124, 58, 237, 0.08);
  `,
  cardHeader: css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1.25rem;
    gap: 1rem;
  `,
  cardTitle: css`
    font-size: 1.125rem;
    font-weight: 600;
    color: #6b21a8;
    margin: 0 0 0.25rem 0;
  `,
  cardSubtitle: css`
    font-size: 0.8125rem;
    color: #64748b;
    margin: 0;
  `,
 
  /* Empty state */
  emptyState: css`
    display: flex;
    align-items: center;
    gap: 1rem;
  `,
  emptyIcon: css`
    width: 2.5rem;
    height: 2.5rem;
    color: #c4b5fd;
    flex-shrink: 0;
  `,
  emptyTitle: css`
    font-size: 1rem;
    font-weight: 600;
    color: #6b21a8;
    margin: 0 0 0.25rem 0;
  `,
  emptySubtitle: css`
    font-size: 0.875rem;
    color: #64748b;
    margin: 0;
  `,
 
  /* Rating summary */
  summaryStars: css`
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-bottom: 0.875rem;
  `,
  starFilled: css`
    width: 1.5rem;
    height: 1.5rem;
    color: #fbbf24;
  `,
  starEmpty: css`
    width: 1.5rem;
    height: 1.5rem;
    color: #cbd5e1;
  `,
  starsLabel: css`
    margin-left: 0.5rem;
    font-size: 0.875rem;
    color: #475569;
    font-weight: 500;
  `,
  summaryRow: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  `,
  summaryRowText: css`
    font-size: 0.875rem;
    color: #334155;
  `,
  summaryResolvedValue: css`
    color: #6b21a8;
  `,
  resolvedIconYes: css`
    width: 1.125rem;
    height: 1.125rem;
    color: #16a34a;
  `,
  resolvedIconPartial: css`
    width: 1.125rem;
    height: 1.125rem;
    color: #d97706;
  `,
  resolvedIconNo: css`
    width: 1.125rem;
    height: 1.125rem;
    color: #dc2626;
  `,
  commentBlock: css`
    margin-top: 0.75rem;
    padding: 0.875rem 1rem;
    background-color: #ffffff;
    border: 1px solid #e9d5ff;
    border-radius: 0.5rem;
  `,
  commentLabel: css`
    margin: 0 0 0.375rem 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b21a8;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  `,
  commentText: css`
    margin: 0;
    font-size: 0.875rem;
    color: #475569;
    font-style: italic;
    line-height: 1.5;
  `,
};