import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { css } from "@emotion/css";
import {
  ArrowLeft,
  Tag,
  AlertCircle,
  Clock,
  User,
  Info,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  PlayCircle,
} from "lucide-react";
import { format } from "date-fns";
import NotificationBell from "../../components/NotificationBell";
import UserMenu from "../../components/UserMenu";

const API_BASE = "https://w25037936.nuwebspace.co.uk/KV6027/CAETS/api/tickets/index.php";

const CATEGORY_LABELS = {
  "Module Content": "Module Content",
  "Gradebook": "Gradebook",
  "Assessment & Submission": "Assessment & Submission",
  "Other": "Other",
};

const statusLabels = {
  Open: "Open",
  "In Progress": "In Progress",
  "Awaiting Response": "Awaiting Response",
  Resolved: "Resolved",
  Closed: "Closed",
};

const statusColors = {
  Open: css`background-color: #dbeafe; color: #1e40af;`,
  "In Progress": css`background-color: #fef9c3; color: #854d0e;`,
  "Awaiting Response": css`background-color: #ffedd5; color: #9a3412;`,
  Resolved: css`background-color: #dcfce7; color: #166534;`,
  Closed: css`background-color: #f3f4f6; color: #374151;`,
};

const urgencyColors = {
  Critical: css`background-color: #fee2e2; color: #991b1b;`,
  High: css`background-color: #ffedd5; color: #9a3412;`,
  Medium: css`background-color: #fef9c3; color: #854d0e;`,
  Low: css`background-color: #dbeafe; color: #1e40af;`,
};

const LecturerTicketDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [replyMessage, setReplyMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  // Fetch ticket detail
  const fetchTicket = async () => {
    try {
      const res = await fetch(`${API_BASE}?action=detail&id=${id}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load ticket");
      }

      setTicket(data.ticket);
      setReplies(data.replies);
      setStatusHistory(data.status_history);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  // Build timeline
  const timeline = useMemo(() => {
    if (!ticket) return [];

    const items = [];

    replies.forEach((reply) => {
      items.push({
        id: `reply-${reply.reply_id}`,
        type: "reply",
        timestamp: reply.created_at,
        data: {
          author: `${reply.first_name} ${reply.last_name}`,
          authorRole: reply.role,
          message: reply.message,
        },
      });
    });

    statusHistory.forEach((sh) => {
      if (sh.old_status === null) return;
      items.push({
        id: `status-${sh.status_history_id}`,
        type: "status",
        timestamp: sh.changed_at,
        data: {
          oldStatus: sh.old_status,
          newStatus: sh.new_status,
          changedBy: `${sh.first_name} ${sh.last_name}`,
          reason: sh.change_reason,
        },
      });
    });

    items.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return items;
  }, [replies, statusHistory, ticket]);

  // Handle reply
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}?action=reply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: id, message: replyMessage.trim() }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to send reply");

      setReplyMessage("");
      await fetchTicket();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle claim
  const handleClaim = async () => {
    setActionLoading("claim");
    try {
      const res = await fetch(`${API_BASE}?action=claim`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: id }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to claim ticket");

      await fetchTicket();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading("");
    }
  };

  // Handle status update (resolve/close)
  const handleStatusUpdate = async (newStatus) => {
    setActionLoading(newStatus);
    try {
      const res = await fetch(`${API_BASE}?action=update-status`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: id, new_status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to update status");

      await fetchTicket();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return <div className={s.loadingPage}>Loading ticket...</div>;
  }

  if (error || !ticket) {
    return (
      <div className={s.loadingPage}>
        <p>{error || "Ticket not found"}</p>
        <button onClick={() => navigate("/lecturer")} className={s.backLink}>
          ← Back to portal
        </button>
      </div>
    );
  }

  const lecturerName = ticket.lecturer_first_name
    ? `${ticket.lecturer_first_name} ${ticket.lecturer_last_name}`
    : "Not assigned";

  const canClaim = ticket.status === "Open";
  const canReply = ticket.status !== "Closed" && ticket.status !== "Open";
  const canResolve = ticket.status === "In Progress" || ticket.status === "Awaiting Response";
  const canClose = ticket.status === "Resolved" || ticket.status === "In Progress" || ticket.status === "Awaiting Response";

  return (
    <div className={s.pageWrapper}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerInner}>
          <div className={s.headerLeft}>
            <button onClick={() => navigate("/lecturer")} className={s.backButton}>
              <ArrowLeft className={s.backIcon} />
            </button>
            <div>
              <div className={s.headerTitleRow}>
                <h1 className={s.pageTitle}>Ticket #{ticket.ticket_number}</h1>
              </div>
              <p className={s.headerSubtitle}>
                Created {format(new Date(ticket.created_at), "dd MMM yyyy, HH:mm")}
              </p>
            </div>
          </div>
          <div className={s.headerRight}>
            <NotificationBell portal="lecturer" />
            <UserMenu portal="lecturer" />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className={s.scrollArea}>
        <div className={s.contentWrapper}>
          {/* Action Bar */}
          <div className={s.actionBar}>
            {canClaim && (
              <button
                onClick={handleClaim}
                disabled={actionLoading === "claim"}
                className={s.claimButton}
              >
                <PlayCircle className={s.actionIcon} />
                {actionLoading === "claim" ? "Claiming..." : "Claim Ticket"}
              </button>
            )}
            {canResolve && (
              <button
                onClick={() => handleStatusUpdate("Resolved")}
                disabled={!!actionLoading}
                className={s.resolveButton}
              >
                <CheckCircle className={s.actionIcon} />
                {actionLoading === "Resolved" ? "Resolving..." : "Mark as Resolved"}
              </button>
            )}
            {canClose && (
              <button
                onClick={() => handleStatusUpdate("Closed")}
                disabled={!!actionLoading}
                className={s.closeButton}
              >
                <XCircle className={s.actionIcon} />
                {actionLoading === "Closed" ? "Closing..." : "Close Ticket"}
              </button>
            )}
          </div>

          {/* Ticket Information Card */}
          <div className={s.infoCard}>
            <h3 className={s.infoTitle}>Ticket Information</h3>
            <div className={s.infoGrid}>
              <div>
                <div className={s.infoLabel}>
                  <Tag className={s.infoLabelIcon} />
                  <span>Category</span>
                </div>
                <p className={s.infoValue}>
                  {CATEGORY_LABELS[ticket.category] || ticket.category}
                </p>
              </div>

              <div>
                <div className={s.infoLabel}>
                  <AlertCircle className={s.infoLabelIcon} />
                  <span>Urgency</span>
                </div>
                <span className={`${s.infoBadge} ${urgencyColors[ticket.urgency] || ""}`}>
                  {ticket.urgency}
                </span>
              </div>

              <div>
                <div className={s.infoLabel}>
                  <AlertCircle className={s.infoLabelIcon} />
                  <span>Status</span>
                </div>
                <span className={`${s.infoBadge} ${statusColors[ticket.status] || ""}`}>
                  {statusLabels[ticket.status] || ticket.status}
                </span>
              </div>

              <div>
                <div className={s.infoLabel}>
                  <User className={s.infoLabelIcon} />
                  <span>Assigned Lecturer</span>
                </div>
                <p className={s.infoValue}>{lecturerName}</p>
              </div>

              <div>
                <div className={s.infoLabel}>
                  <Clock className={s.infoLabelIcon} />
                  <span>Last Updated</span>
                </div>
                <p className={s.infoValue}>
                  {format(new Date(ticket.updated_at), "dd MMM yyyy, HH:mm")}
                </p>
              </div>

              <div>
                <div className={s.infoLabel}>
                  <Info className={s.infoLabelIcon} />
                  <span>Module</span>
                </div>
                <p className={s.infoValue}>
                  {ticket.module_code} - {ticket.module_name}
                </p>
              </div>
            </div>
          </div>

          {/* Ticket Details + Conversation */}
          <div className={s.detailCard}>
            {/* Subject & Description */}
            <div className={s.detailHeader}>
              <h2 className={s.detailTitle}>{ticket.subject}</h2>
              <p className={s.detailDescription}>{ticket.description}</p>
            </div>

            {/* Conversation Thread */}
            <div className={s.conversationSection}>
              <div className={s.conversationHeader}>
                <MessageSquare className={s.conversationIcon} />
                <h3 className={s.conversationTitle}>
                  Conversation ({timeline.length})
                </h3>
              </div>

              {timeline.length === 0 ? (
                <div className={s.emptyConversation}>
                  <MessageSquare className={s.emptyIcon} />
                  <p>No replies yet</p>
                  <p className={s.emptySubtext}>
                    {canClaim
                      ? "Claim this ticket to start responding"
                      : "Start the conversation by replying below"}
                  </p>
                </div>
              ) : (
                <div className={s.timelineList}>
                  {timeline.map((item) => (
                    <div
                      key={item.id}
                      className={
                        item.type === "status"
                          ? s.timelineStatus
                          : item.data.authorRole === "lecturer"
                          ? s.timelineLecturer
                          : s.timelineStudent
                      }
                    >
                      <div className={s.timelineTop}>
                        <div className={s.timelineAuthor}>
                          <div
                            className={
                              item.type === "status"
                                ? s.avatarStatus
                                : item.data.authorRole === "lecturer"
                                ? s.avatarLecturer
                                : s.avatarStudent
                            }
                          >
                            <User className={s.avatarIcon} />
                          </div>
                          <div>
                            <p className={s.authorName}>
                              {item.type === "status" ? "System" : item.data.author}
                            </p>
                            <p className={s.authorRole}>
                              {item.type === "status" ? "status update" : item.data.authorRole}
                            </p>
                          </div>
                        </div>
                        <span className={s.timelineTime}>
                          {format(new Date(item.timestamp), "dd MMM yyyy, HH:mm")}
                        </span>
                      </div>
                      <p className={item.type === "status" ? s.statusMessage : s.replyMessage}>
                        {item.type === "status"
                          ? `Status changed to "${statusLabels[item.data.newStatus] || item.data.newStatus}"`
                          : item.data.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Form — only after claiming */}
            {canReply && (
              <div className={s.replySection}>
                <form onSubmit={handleSubmitReply}>
                  <label htmlFor="reply" className={s.replyLabel}>
                    Add a reply
                  </label>
                  <textarea
                    id="reply"
                    rows={4}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your response here..."
                    className={s.replyTextarea}
                  />
                  <div className={s.replyActions}>
                    <button
                      type="submit"
                      disabled={!replyMessage.trim() || isSubmitting}
                      className={s.replyButton}
                    >
                      <Send className={s.replyButtonIcon} />
                      {isSubmitting ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Claim prompt for Open tickets */}
            {canClaim && (
              <div className={s.claimPrompt}>
                <p className={s.claimPromptText}>
                  This ticket is awaiting your attention. Claim it to start responding.
                </p>
                <button
                  onClick={handleClaim}
                  disabled={actionLoading === "claim"}
                  className={s.claimButton}
                >
                  <PlayCircle className={s.actionIcon} />
                  {actionLoading === "claim" ? "Claiming..." : "Claim Ticket"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerTicketDetail;

/* ========================
   Styles
   ======================== */
const s = {
  pageWrapper: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #f9fafb;
    overflow: hidden;
  `,
  loadingPage: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: #6b7280;
    gap: 1rem;
  `,
  backLink: css`
    color: #4f46e5;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    &:hover { text-decoration: underline; }
  `,
  header: css`
    background-color: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
  `,
  headerInner: css`
    max-width: 80rem;
    margin: 0 auto;
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    @media (min-width: 1024px) {
      padding-left: 2rem;
      padding-right: 2rem;
    }
  `,
  headerLeft: css`
    display: flex;
    align-items: center;
    gap: 1rem;
  `,
  backButton: css`
    padding: 0.5rem;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 0.5rem;
    transition: background-color 0.2s;
    &:hover { background-color: #f3f4f6; }
  `,
  backIcon: css`
    width: 1.25rem;
    height: 1.25rem;
    color: #4b5563;
  `,
  headerTitleRow: css`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
  `,
  pageTitle: css`
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  `,
  headerSubtitle: css`
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  `,
  headerRight: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `,
  scrollArea: css`
    flex: 1;
    overflow-y: auto;
  `,
  contentWrapper: css`
    max-width: 80rem;
    margin: 0 auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    @media (min-width: 1024px) {
      padding-left: 2rem;
      padding-right: 2rem;
    }
  `,

  /* Action Bar */
  actionBar: css`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  `,
  actionIcon: css`
    width: 1.125rem;
    height: 1.125rem;
  `,
  claimButton: css`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background-color: #4f46e5;
    color: #ffffff;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover { background-color: #4338ca; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  `,
  resolveButton: css`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background-color: #16a34a;
    color: #ffffff;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover { background-color: #15803d; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  `,
  closeButton: css`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background-color: #ffffff;
    color: #dc2626;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background-color: #fef2f2; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  `,

  /* Info Card */
  infoCard: css`
    background-color: #ffffff;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
  `,
  infoTitle: css`
    font-weight: 600;
    color: #111827;
    margin: 0 0 1rem 0;
  `,
  infoGrid: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    @media (min-width: 768px) { grid-template-columns: 1fr 1fr; }
    @media (min-width: 1024px) { grid-template-columns: 1fr 1fr 1fr 1fr; }
  `,
  infoLabel: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  `,
  infoLabelIcon: css`
    width: 1rem;
    height: 1rem;
  `,
  infoValue: css`
    font-weight: 500;
    color: #111827;
    margin: 0;
    padding-left: 1.5rem;
  `,
  infoBadge: css`
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    margin-left: 1.5rem;
  `,

  /* Detail Card */
  detailCard: css`
    background-color: #ffffff;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  `,
  detailHeader: css`
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  `,
  detailTitle: css`
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 1rem 0;
  `,
  detailDescription: css`
    color: #374151;
    white-space: pre-wrap;
    margin: 0;
    line-height: 1.6;
  `,

  /* Conversation */
  conversationSection: css`
    padding: 1.5rem;
  `,
  conversationHeader: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  `,
  conversationIcon: css`
    width: 1.25rem;
    height: 1.25rem;
    color: #4b5563;
  `,
  conversationTitle: css`
    font-weight: 600;
    color: #111827;
    margin: 0;
  `,
  emptyConversation: css`
    text-align: center;
    padding: 2rem 0;
    color: #6b7280;
  `,
  emptyIcon: css`
    width: 3rem;
    height: 3rem;
    margin: 0 auto 0.75rem;
    color: #9ca3af;
  `,
  emptySubtext: css`
    font-size: 0.875rem;
    margin-top: 0.25rem;
  `,
  timelineList: css`
    display: flex;
    flex-direction: column;
    gap: 1rem;
  `,
  timelineStatus: css`
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
  `,
  timelineLecturer: css`
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: #faf5ff;
    border: 1px solid #e9d5ff;
  `,
  timelineStudent: css`
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
  `,
  timelineTop: css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  `,
  timelineAuthor: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `,
  avatarStatus: css`
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #4f46e5;
  `,
  avatarLecturer: css`
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #7c3aed;
  `,
  avatarStudent: css`
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #4b5563;
  `,
  avatarIcon: css`
    width: 1rem;
    height: 1rem;
    color: #ffffff;
  `,
  authorName: css`
    font-weight: 500;
    color: #111827;
    font-size: 0.875rem;
    margin: 0;
  `,
  authorRole: css`
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: capitalize;
    margin: 0;
  `,
  timelineTime: css`
    font-size: 0.75rem;
    color: #6b7280;
  `,
  statusMessage: css`
    color: #1e40af;
    margin: 0;
    padding-left: 2.5rem;
    font-weight: 500;
  `,
  replyMessage: css`
    color: #374151;
    margin: 0;
    padding-left: 2.5rem;
    white-space: pre-wrap;
    line-height: 1.5;
  `,

  /* Reply Form */
  replySection: css`
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
    background-color: #f9fafb;
  `,
  replyLabel: css`
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  `,
  replyTextarea: css`
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    resize: none;
    font-family: inherit;
    font-size: 0.875rem;
    outline: none;
    box-sizing: border-box;
    &:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
    }
    &::placeholder { color: #9ca3af; }
  `,
  replyActions: css`
    margin-top: 0.75rem;
    display: flex;
    justify-content: flex-end;
  `,
  replyButton: css`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1.5rem;
    background-color: #4f46e5;
    color: #ffffff;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover { background-color: #4338ca; }
    &:disabled {
      background-color: #d1d5db;
      cursor: not-allowed;
    }
  `,
  replyButtonIcon: css`
    width: 1rem;
    height: 1rem;
  `,

  /* Claim Prompt */
  claimPrompt: css`
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
    background-color: #eef2ff;
    border-radius: 0 0 0.75rem 0.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  `,
  claimPromptText: css`
    color: #3730a3;
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0;
  `,
};