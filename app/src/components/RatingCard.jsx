import React, { useState, useEffect } from "react";
import { css } from "@emotion/css";
import { Star, CheckCircle, MinusCircle, XCircle, Edit2 } from "lucide-react";
import { format } from "date-fns";

const API_BASE = "https://w25037936.nuwebspace.co.uk/KV6027/CAETS/api/ratings/index.php";

const RatingCard = ({ ticketId, ticketStatus, onRatingSubmitted }) => {
  const [existingRating, setExistingRating] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [issueResolved, setIssueResolved] = useState("");
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canRate = ticketStatus === "Resolved" || ticketStatus === "Closed";

  // Fetch existing rating on mount
  useEffect(() => {
    if (!canRate) {
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
          setExistingRating(data.rating);
          setStars(data.rating.stars);
          setIssueResolved(data.rating.issue_resolved);
          setComment(data.rating.comment || "");
        }
      } catch (err) {
        setError("Failed to load rating");
      } finally {
        setLoading(false);
      }
    };

    fetchRating();
  }, [ticketId, canRate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (stars < 1) {
      setError("Please select a star rating");
      return;
    }
    if (!issueResolved) {
      setError("Please indicate whether your issue was resolved");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}?action=submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: ticketId,
          stars,
          issue_resolved: issueResolved,
          comment: comment.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit rating");
      }

      setExistingRating({
        stars,
        issue_resolved: issueResolved,
        comment: comment.trim(),
        updated_at: new Date().toISOString(),
      });
      setIsEditing(false);

      if (onRatingSubmitted) onRatingSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setStars(existingRating.stars);
    setIssueResolved(existingRating.issue_resolved);
    setComment(existingRating.comment || "");
    setError("");
  };

  const getResolvedIcon = (value) => {
    if (value === "yes") return <CheckCircle className={s.resolvedIconYes} />;
    if (value === "partially") return <MinusCircle className={s.resolvedIconPartial} />;
    if (value === "no") return <XCircle className={s.resolvedIconNo} />;
    return null;
  };

  if (!canRate || loading) return null;

  /* --- Summary view (already rated, not editing) --- */
  if (existingRating && !isEditing) {
    return (
      <div className={s.card}>
        <div className={s.cardHeader}>
          <div>
            <h3 className={s.cardTitle}>Your Rating</h3>
            <p className={s.cardSubtitle}>
              Submitted {format(new Date(existingRating.updated_at), "dd MMM yyyy, HH:mm")}
            </p>
          </div>
          <button onClick={() => setIsEditing(true)} className={s.editButton}>
            <Edit2 className={s.editIcon} />
            Edit
          </button>
        </div>

        <div className={s.summaryStars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={n <= existingRating.stars ? s.starFilled : s.starEmpty}
              fill={n <= existingRating.stars ? "#fbbf24" : "none"}
            />
          ))}
          <span className={s.starsLabel}>{existingRating.stars} / 5</span>
        </div>

        <div className={s.summaryRow}>
          {getResolvedIcon(existingRating.issue_resolved)}
          <span className={s.summaryRowText}>
            Issue resolved:{" "}
            <strong className={s.summaryResolvedValue}>
              {existingRating.issue_resolved === "yes"
                ? "Yes"
                : existingRating.issue_resolved === "partially"
                ? "Partially"
                : "No"}
            </strong>
          </span>
        </div>

        {existingRating.comment && (
          <div className={s.commentBlock}>
            <p className={s.commentText}>"{existingRating.comment}"</p>
          </div>
        )}
      </div>
    );
  }

  /* --- Rating form (new rating or editing) --- */
  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div>
          <h3 className={s.cardTitle}>
            {existingRating ? "Edit Your Rating" : "Rate This Response"}
          </h3>
          <p className={s.cardSubtitle}>
            Your feedback is optional and helps improve academic support.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Star rating */}
        <div className={s.field}>
          <label className={s.fieldLabel}>
            How would you rate the support you received?
          </label>
          <div className={s.starsInput}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={s.starButton}
                onMouseEnter={() => setHoverStars(n)}
                onMouseLeave={() => setHoverStars(0)}
                onClick={() => setStars(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                <Star
                  className={s.starInputIcon}
                  fill={(hoverStars || stars) >= n ? "#fbbf24" : "none"}
                  color={(hoverStars || stars) >= n ? "#fbbf24" : "#cbd5e1"}
                />
              </button>
            ))}
            {stars > 0 && <span className={s.starsLabel}>{stars} / 5</span>}
          </div>
        </div>

        {/* Issue resolved */}
        <div className={s.field}>
          <label className={s.fieldLabel}>Was your issue resolved?</label>
          <div className={s.radioGroup}>
            {[
              { value: "yes", label: "Yes" },
              { value: "partially", label: "Partially" },
              { value: "no", label: "No" },
            ].map((opt) => (
              <label key={opt.value} className={s.radioLabel}>
                <input
                  type="radio"
                  name="issueResolved"
                  value={opt.value}
                  checked={issueResolved === opt.value}
                  onChange={(e) => setIssueResolved(e.target.value)}
                  className={s.radioInput}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className={s.field}>
          <label htmlFor="ratingComment" className={s.fieldLabel}>
            Additional comments <span className={s.optional}>(optional)</span>
          </label>
          <textarea
            id="ratingComment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience..."
            maxLength={1000}
            className={s.textarea}
          />
          <p className={s.charCount}>{comment.length} / 1000</p>
        </div>

        {error && <p className={s.errorMessage}>{error}</p>}

        <div className={s.formActions}>
          {isEditing && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className={s.cancelButton}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || stars < 1 || !issueResolved}
            className={s.submitButton}
          >
            {submitting
              ? "Submitting..."
              : existingRating
              ? "Update Rating"
              : "Submit Rating"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RatingCard;

/* ========================
   Styles
   ======================== */
const s = {
  card: css`
    background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
    border: 1px solid #bfdbfe;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(30, 64, 175, 0.08);
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
    color: #1e3a8a;
    margin: 0 0 0.25rem 0;
  `,
  cardSubtitle: css`
    font-size: 0.8125rem;
    color: #64748b;
    margin: 0;
  `,
  editButton: css`
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.875rem;
    background-color: #ffffff;
    color: #1e40af;
    border: 1px solid #bfdbfe;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover { background-color: #eff6ff; }
  `,
  editIcon: css`
    width: 0.875rem;
    height: 0.875rem;
  `,

  /* Summary view */
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
    text-transform: capitalize;
    color: #1e3a8a;
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
    padding: 0.75rem 1rem;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
  `,
  commentText: css`
    margin: 0;
    font-size: 0.875rem;
    color: #475569;
    font-style: italic;
    line-height: 1.5;
  `,

  /* Form */
  field: css`
    margin-bottom: 1.25rem;
  `,
  fieldLabel: css`
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  `,
  optional: css`
    font-weight: 400;
    color: #6b7280;
  `,
  starsInput: css`
    display: flex;
    align-items: center;
    gap: 0.25rem;
  `,
  starButton: css`
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover { transform: scale(1.1); }
    transition: transform 0.1s;
  `,
  starInputIcon: css`
    width: 2rem;
    height: 2rem;
    transition: color 0.15s;
  `,
  radioGroup: css`
    display: flex;
    gap: 1.25rem;
    flex-wrap: wrap;
  `,
  radioLabel: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: #374151;
  `,
  radioInput: css`
    cursor: pointer;
    accent-color: #2563eb;
  `,
  textarea: css`
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    resize: vertical;
    font-family: inherit;
    font-size: 0.875rem;
    outline: none;
    box-sizing: border-box;
    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
    &::placeholder { color: #9ca3af; }
  `,
  charCount: css`
    text-align: right;
    font-size: 0.75rem;
    color: #9ca3af;
    margin: 0.25rem 0 0 0;
  `,
  errorMessage: css`
    color: #dc2626;
    font-size: 0.8125rem;
    margin: 0 0 0.75rem 0;
    padding: 0.5rem 0.75rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.375rem;
  `,
  formActions: css`
    display: flex;
    justify-content: flex-end;
    gap: 0.625rem;
  `,
  submitButton: css`
    padding: 0.5rem 1.5rem;
    background-color: #2563eb;
    color: #ffffff;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover:not(:disabled) { background-color: #1d4ed8; }
    &:disabled {
      background-color: #d1d5db;
      cursor: not-allowed;
    }
  `,
  cancelButton: css`
    padding: 0.5rem 1.5rem;
    background-color: #ffffff;
    color: #475569;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover:not(:disabled) { background-color: #f8fafc; }
    &:disabled { cursor: not-allowed; opacity: 0.6; }
  `,
};