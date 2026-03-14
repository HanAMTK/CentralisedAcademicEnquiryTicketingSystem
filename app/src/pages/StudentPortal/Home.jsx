import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import { ArrowLeft, PlusCircle, Ticket, Clock, MessageSquare } from "lucide-react";
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

const getStatusLabel = (status) => {
  const labels = {
    Open: "Open",
    "In Progress": "In Progress",
    "Awaiting Response": "Awaiting Response",
    Resolved: "Resolved",
    Closed: "Closed",
  };
  return labels[status] || status;
};

const getUrgencyStyle = (urgency) => {
  const map = {
    Critical: css`background-color: #fee2e2; color: #991b1b;`,
    High: css`background-color: #ffedd5; color: #9a3412;`,
    Medium: css`background-color: #fef9c3; color: #854d0e;`,
    Low: css`background-color: #dbeafe; color: #1e40af;`,
  };
  return map[urgency] || map.Low;
};

const StudentPortalHome = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch(`${API_BASE}?action=my-tickets`, {
          credentials: "include",
        });
        const data = await res.json();

        if (res.ok && data.tickets) {
          setTickets(data.tickets);
        }
      } catch {
        console.error("Failed to fetch tickets");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // Active tickets = not Resolved or Closed
  const activeTickets = tickets.filter(
    (t) => t.status !== "Resolved" && t.status !== "Closed"
  );

  return (
    <div className={s.pageWrapper}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerInner}>
          <div className={s.headerLeft}>
            <button onClick={() => navigate("/")} className={s.backButton}>
              <ArrowLeft className={s.backIcon} />
            </button>
            <div>
              <h1 className={s.pageTitle}>Student Portal</h1>
            </div>
          </div>
          <div className={s.headerRight}>
            <NotificationBell portal="student" />
            <UserMenu portal="student" />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className={s.scrollArea}>
        <div className={s.contentWrapper}>
          {/* Quick Actions */}
          <div className={s.quickActions}>
            <button
              onClick={() => navigate("/student/create")}
              className={s.createButton}
            >
              <PlusCircle className={s.createIcon} />
              <h3 className={s.createTitle}>Submit New Enquiry</h3>
              <p className={s.createDesc}>
                Create a new ticket for your academic question
              </p>
            </button>

            <button
              onClick={() => navigate("/student/tickets")}
              className={s.viewAllButton}
            >
              <Ticket className={s.viewAllIcon} />
              <h3 className={s.viewAllTitle}>View All Tickets</h3>
              <p className={s.viewAllDesc}>
                Browse your active and past enquiries
              </p>
            </button>
          </div>

          {/* Recent Tickets */}
          <div className={s.ticketsCard}>
            <div className={s.ticketsHeader}>
              <div>
                <h2 className={s.ticketsTitle}>Recent Tickets</h2>
                <p className={s.ticketsSubtitle}>
                  {loading
                    ? "Loading..."
                    : `Showing ${Math.min(3, activeTickets.length)} of ${activeTickets.length} active ticket${activeTickets.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              {activeTickets.length > 0 && (
                <button
                  onClick={() => navigate("/student/tickets")}
                  className={s.viewAllLink}
                >
                  View All
                </button>
              )}
            </div>

            <div>
              {loading ? (
                <div className={s.emptyState}>Loading tickets...</div>
              ) : activeTickets.length === 0 ? (
                <div className={s.emptyState}>
                  No active tickets. Create one to get started!
                </div>
              ) : (
                activeTickets.slice(0, 3).map((ticket) => (
                  <button
                    key={ticket.ticket_id}
                    onClick={() => navigate(`/student/ticket/${ticket.ticket_id}`)}
                    className={s.ticketRow}
                  >
                    <div className={s.ticketTopRow}>
                      <div className={s.ticketInfo}>
                        <div className={s.ticketMeta}>
                          <span className={s.ticketId}>{ticket.ticket_number}</span>
                          <span className={s.metaDot}>·</span>
                          <span className={s.ticketModule}>
                            {ticket.module_code} - {ticket.module_name}
                          </span>
                        </div>
                        <h3 className={s.ticketTitle}>{ticket.subject}</h3>
                        <p className={s.ticketDescription}>
                          {ticket.description}
                        </p>
                      </div>
                      <div className={s.badgeGroup}>
                        <div className={s.badgeRow}>
                          <span
                            className={`${s.badge} ${getUrgencyStyle(ticket.urgency)}`}
                          >
                            {ticket.urgency}
                          </span>
                          <span className={s.statusBadge}>
                            {getStatusLabel(ticket.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={s.ticketFooter}>
                      <span className={s.categoryTag}>
                        {CATEGORY_LABELS[ticket.category] || ticket.category}
                      </span>
                      <span className={s.footerItem}>
                        <Clock className={s.smallIcon} />
                        {format(new Date(ticket.updated_at), "dd MMM yyyy, HH:mm")}
                      </span>
                      <span className={s.footerItem}>
                        <MessageSquare className={s.smallIcon} />
                        {ticket.reply_count}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {activeTickets.length > 3 && (
              <div className={s.viewMoreFooter}>
                <button
                  onClick={() => navigate("/student/tickets")}
                  className={s.viewMoreButton}
                >
                  View {activeTickets.length - 3} more ticket
                  {activeTickets.length - 3 !== 1 ? "s" : ""} →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPortalHome;

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
    &:hover {
      background-color: #f3f4f6;
    }
  `,
  backIcon: css`
    width: 1.25rem;
    height: 1.25rem;
    color: #4b5563;
  `,
  pageTitle: css`
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
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
    @media (min-width: 1024px) {
      padding-left: 2rem;
      padding-right: 2rem;
    }
  `,
  quickActions: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    @media (min-width: 768px) {
      grid-template-columns: 1fr 1fr;
    }
  `,
  createButton: css`
    background: linear-gradient(to right, #3b82f6, #2563eb);
    color: #ffffff;
    border: none;
    cursor: pointer;
    border-radius: 0.75rem;
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    text-align: left;
    transition: all 0.2s;
    &:hover {
      box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
      transform: scale(1.05);
    }
  `,
  createIcon: css`
    width: 2.5rem;
    height: 2.5rem;
    margin-bottom: 1rem;
  `,
  createTitle: css`
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  `,
  createDesc: css`
    color: #bfdbfe;
    margin: 0;
  `,
  viewAllButton: css`
    background-color: #ffffff;
    border: 2px solid #e5e7eb;
    cursor: pointer;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    text-align: left;
    transition: all 0.2s;
    &:hover {
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
      border-color: #93c5fd;
    }
  `,
  viewAllIcon: css`
    width: 2.5rem;
    height: 2.5rem;
    color: #374151;
    margin-bottom: 1rem;
  `,
  viewAllTitle: css`
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem 0;
  `,
  viewAllDesc: css`
    color: #4b5563;
    margin: 0;
  `,
  ticketsCard: css`
    background-color: #ffffff;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  `,
  ticketsHeader: css`
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,
  ticketsTitle: css`
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  `,
  ticketsSubtitle: css`
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0.25rem 0 0 0;
  `,
  viewAllLink: css`
    font-size: 0.875rem;
    color: #2563eb;
    font-weight: 500;
    background: none;
    border: none;
    cursor: pointer;
    &:hover {
      color: #1d4ed8;
      text-decoration: underline;
    }
  `,
  emptyState: css`
    padding: 2rem;
    text-align: center;
    color: #6b7280;
  `,
  ticketRow: css`
    width: 100%;
    padding: 1.5rem;
    border: none;
    border-bottom: 1px solid #e5e7eb;
    background: none;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.2s;
    &:hover {
      background-color: #f9fafb;
    }
    &:last-child {
      border-bottom: none;
    }
  `,
  ticketTopRow: css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  `,
  ticketInfo: css`
    flex: 1;
    min-width: 0;
  `,
  ticketMeta: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  `,
  ticketId: css`
    font-size: 0.75rem;
    font-family: monospace;
    color: #6b7280;
  `,
  metaDot: css`
    font-size: 0.75rem;
    color: #6b7280;
  `,
  ticketModule: css`
    font-size: 0.75rem;
    color: #6b7280;
  `,
  ticketTitle: css`
    font-weight: 600;
    font-size: 0.875rem;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #111827;
    transition: color 0.2s;
  `,
  ticketDescription: css`
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0.25rem 0 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  badgeGroup: css`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
    flex-shrink: 0;
  `,
  badgeRow: css`
    display: flex;
    align-items: center;
    gap: 0.375rem;
  `,
  badge: css`
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  `,
  statusBadge: css`
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
    background-color: #f3f4f6;
    color: #4b5563;
    border: 1px solid #e5e7eb;
  `,
  ticketFooter: css`
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 0.75rem;
    font-size: 0.75rem;
    color: #6b7280;
  `,
  categoryTag: css`
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    background-color: #f3f4f6;
    color: #374151;
  `,
  footerItem: css`
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  `,
  smallIcon: css`
    width: 0.75rem;
    height: 0.75rem;
  `,
  viewMoreFooter: css`
    padding: 1rem;
    background-color: #f9fafb;
    border-top: 1px solid #e5e7eb;
    border-radius: 0 0 0.75rem 0.75rem;
  `,
  viewMoreButton: css`
    width: 100%;
    text-align: center;
    color: #2563eb;
    font-weight: 500;
    font-size: 0.875rem;
    padding: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    &:hover {
      color: #1d4ed8;
      text-decoration: underline;
    }
  `,
};