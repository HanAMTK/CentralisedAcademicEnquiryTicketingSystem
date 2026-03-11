import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import {
  ArrowLeft,
  Filter,
  Search,
  Inbox,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Mail,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import NotificationBell from "../../components/NotificationBell";
import UserMenu from "../../components/UserMenu";

const CATEGORY_LABELS = {
  module_content: "Module Content",
  gradebook: "Gradebook",
  assessment_submission: "Assessment & Submission",
  other: "Other",
};

const getStatusLabel = (status) => {
  const labels = {
    open: "Open",
    in_progress: "In Progress",
    awaiting_response: "Awaiting Response",
    resolved: "Resolved",
    closed: "Closed",
  };
  return labels[status] || status;
};

const getUrgencyStyle = (urgency) => {
  const map = {
    critical: css`background-color: #fee2e2; color: #991b1b;`,
    high: css`background-color: #ffedd5; color: #9a3412;`,
    medium: css`background-color: #fef9c3; color: #854d0e;`,
    low: css`background-color: #dbeafe; color: #1e40af;`,
  };
  return map[urgency] || map.low;
};

const hasUnreadReplies = (ticket, portal) => {
  // Placeholder — replace with real logic when backend is ready
  return false;
};

const LecturerPortalHome = ({ tickets = [] }) => {
  const navigate = useNavigate();

  // Filter & search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModule, setFilterModule] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Sort state
  const [sortColumn, setSortColumn] = useState("updated");
  const [sortDirection, setSortDirection] = useState("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Unique modules for filter dropdown
  const uniqueModules = useMemo(() => {
    const modules = tickets.map((t) => t.module).filter(Boolean);
    return [...new Set(modules)];
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        !searchQuery ||
        ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ticket.description || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesModule = filterModule === "all" || ticket.module === filterModule;
      const matchesCategory = filterCategory === "all" || ticket.category === filterCategory;
      const matchesUrgency = filterUrgency === "all" || ticket.urgency === filterUrgency;
      const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;

      return matchesSearch && matchesModule && matchesCategory && matchesUrgency && matchesStatus;
    });
  }, [tickets, searchQuery, filterModule, filterCategory, filterUrgency, filterStatus]);

  // Sorted tickets
  const sortedTickets = useMemo(() => {
    const sorted = [...filteredTickets].sort((a, b) => {
      let valA, valB;
      switch (sortColumn) {
        case "id": valA = a.id; valB = b.id; break;
        case "title": valA = a.title; valB = b.title; break;
        case "module": valA = a.module || ""; valB = b.module || ""; break;
        case "category": valA = a.category; valB = b.category; break;
        case "urgency":
          const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          valA = urgencyOrder[a.urgency] ?? 4;
          valB = urgencyOrder[b.urgency] ?? 4;
          break;
        case "status": valA = a.status; valB = b.status; break;
        case "updated":
          valA = new Date(a.updatedAt).getTime();
          valB = new Date(b.updatedAt).getTime();
          break;
        default: valA = a.id; valB = b.id;
      }
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredTickets, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedTickets.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTickets = sortedTickets.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) return <ChevronUp className={s.sortIconInactive} />;
    return sortDirection === "asc" ? (
      <ChevronUp className={s.sortIconActive} />
    ) : (
      <ChevronDown className={s.sortIconActive} />
    );
  };

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
              <h1 className={s.pageTitle}>Lecturer Portal</h1>
            </div>
          </div>
          <div className={s.headerRight}>
            <NotificationBell portal="lecturer" userId="lecturer-002" />
            <UserMenu portal="lecturer" />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className={s.scrollArea}>
        <div className={s.contentWrapper}>
          {/* Title */}
          <div className={s.sectionTitle}>
            <h2 className={s.sectionHeading}>
              Assigned Tickets ({filteredTickets.length})
            </h2>
          </div>

          {/* Search & Filters */}
          <div className={s.filtersCard}>
            <div className={s.filtersHeader}>
              <Filter className={s.filtersIcon} />
              <h3 className={s.filtersTitle}>Search & Filters</h3>
            </div>

            <div className={s.filtersGrid}>
              {/* Search */}
              <div className={s.searchCol}>
                <label className={s.label}>Search</label>
                <div className={s.searchInputWrapper}>
                  <Search className={s.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={s.searchInput}
                  />
                </div>
              </div>

              {/* Module Filter */}
              <div>
                <label className={s.label}>Module</label>
                <select
                  value={filterModule}
                  onChange={(e) => { setFilterModule(e.target.value); setCurrentPage(1); }}
                  className={s.select}
                >
                  <option value="all">All Modules</option>
                  {uniqueModules.map((mod) => (
                    <option key={mod} value={mod}>{mod}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className={s.label}>Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                  className={s.select}
                >
                  <option value="all">All Categories</option>
                  <option value="module_content">Module Content</option>
                  <option value="gradebook">Gradebook</option>
                  <option value="assessment_submission">Assessment & Submission</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Urgency Filter */}
              <div>
                <label className={s.label}>Urgency</label>
                <select
                  value={filterUrgency}
                  onChange={(e) => { setFilterUrgency(e.target.value); setCurrentPage(1); }}
                  className={s.select}
                >
                  <option value="all">All Urgency</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Status Filter */}
            <div className={s.statusRow}>
              <label className={s.label}>Status</label>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className={s.statusSelect}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="awaiting_response">Awaiting Response</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Tickets Table */}
          <div className={s.tableCard}>
            {paginatedTickets.length === 0 ? (
              <div className={s.emptyState}>
                <Inbox className={s.emptyIcon} />
                <p className={s.emptyTitle}>No tickets found</p>
                <p className={s.emptySubtitle}>
                  {searchQuery || filterStatus !== "all" || filterModule !== "all"
                    ? "Try adjusting your filters"
                    : "You're all caught up!"}
                </p>
              </div>
            ) : (
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead className={s.thead}>
                    <tr>
                      {[
                        { key: "id", label: "Ticket ID" },
                        { key: "title", label: "Title" },
                        { key: "module", label: "Module" },
                        { key: "category", label: "Category" },
                        { key: "urgency", label: "Urgency" },
                        { key: "status", label: "Status" },
                        { key: "updated", label: "Last Updated" },
                      ].map((col) => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className={`${s.th} ${col.key === "title" ? s.thWide : ""}`}
                        >
                          <div className={s.thInner}>
                            <span>{col.label}</span>
                            <SortIcon column={col.key} />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={s.tbody}>
                    {paginatedTickets.map((ticket) => {
                      const isUnread = hasUnreadReplies(ticket, "lecturer");
                      return (
                        <tr
                          key={ticket.id}
                          onClick={() => navigate(`/lecturer/ticket/${ticket.id}`)}
                          className={isUnread ? s.rowUnread : s.row}
                        >
                          <td className={s.td}>
                            <div className={s.ticketIdCell}>
                              {isUnread && (
                                <Mail className={s.unreadIcon} title="Unread replies" />
                              )}
                              <span className={isUnread ? s.ticketIdBold : s.ticketIdNormal}>
                                {ticket.id}
                              </span>
                            </div>
                          </td>
                          <td className={s.td}>
                            <div className={s.titleCell}>
                              <span className={isUnread ? s.titleBold : s.titleNormal}>
                                {ticket.title}
                              </span>
                              {isUnread && (
                                <span className={s.newReplyBadge}>
                                  <Mail className={s.newReplyIcon} />
                                  New Reply
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={s.td}>
                            <span className={s.moduleText}>{ticket.module || "N/A"}</span>
                          </td>
                          <td className={s.td}>
                            <span className={s.categoryBadge}>
                              {CATEGORY_LABELS[ticket.category] || ticket.category}
                            </span>
                          </td>
                          <td className={s.td}>
                            <span className={`${s.badge} ${getUrgencyStyle(ticket.urgency)}`}>
                              {ticket.urgency}
                            </span>
                          </td>
                          <td className={s.td}>
                            <span className={s.statusBadge}>
                              {getStatusLabel(ticket.status)}
                            </span>
                          </td>
                          <td className={s.td}>
                            <div className={s.updatedCell}>
                              <Clock className={s.smallIcon} />
                              {formatDistanceToNow(new Date(ticket.updatedAt), {
                                addSuffix: true,
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {sortedTickets.length > 0 && (
            <div className={s.pagination}>
              <div className={s.paginationLeft}>
                <p className={s.paginationInfo}>
                  Showing {(safePage - 1) * itemsPerPage + 1}–
                  {Math.min(safePage * itemsPerPage, sortedTickets.length)} of{" "}
                  {sortedTickets.length}
                </p>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className={s.perPageSelect}
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
              <div className={s.paginationRight}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className={s.pageButton}
                >
                  <ChevronLeft className={s.pageIcon} />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className={s.pageButton}
                >
                  <ChevronRight className={s.pageIcon} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LecturerPortalHome;

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
    &:hover { background-color: #f3f4f6; }
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
    max-width: 100%;
    margin: 0 auto;
    padding: 1.5rem 1rem;
    @media (min-width: 1024px) {
      padding-left: 2rem;
      padding-right: 2rem;
    }
  `,
  sectionTitle: css`
    margin-bottom: 1.5rem;
  `,
  sectionHeading: css`
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  `,

  /* Filters */
  filtersCard: css`
    background-color: #ffffff;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  `,
  filtersHeader: css`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  `,
  filtersIcon: css`
    width: 1.25rem;
    height: 1.25rem;
    color: #4b5563;
  `,
  filtersTitle: css`
    font-weight: 600;
    color: #111827;
    margin: 0;
  `,
  filtersGrid: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    @media (min-width: 768px) {
      grid-template-columns: 1fr 1fr;
    }
    @media (min-width: 1024px) {
      grid-template-columns: 2fr 1fr 1fr 1fr;
    }
  `,
  searchCol: css`
    @media (min-width: 1024px) {
      grid-column: span 1;
    }
  `,
  label: css`
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  `,
  searchInputWrapper: css`
    position: relative;
  `,
  searchIcon: css`
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: #9ca3af;
  `,
  searchInput: css`
    width: 100%;
    padding: 0.5rem 1rem 0.5rem 2.25rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    outline: none;
    box-sizing: border-box;
    &:focus {
      border-color: transparent;
      box-shadow: 0 0 0 2px #6366f1;
    }
  `,
  select: css`
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    outline: none;
    background-color: #ffffff;
    box-sizing: border-box;
    &:focus {
      border-color: transparent;
      box-shadow: 0 0 0 2px #6366f1;
    }
  `,
  statusRow: css`
    margin-top: 1rem;
  `,
  statusSelect: css`
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    outline: none;
    background-color: #ffffff;
    box-sizing: border-box;
    @media (min-width: 768px) {
      width: 16rem;
    }
    &:focus {
      border-color: transparent;
      box-shadow: 0 0 0 2px #6366f1;
    }
  `,

  /* Table */
  tableCard: css`
    background-color: #ffffff;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    border: 1px solid #e5e7eb;
  `,
  tableScroll: css`
    overflow-x: auto;
  `,
  table: css`
    width: 100%;
    border-collapse: collapse;
  `,
  thead: css`
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  `,
  th: css`
    padding: 0.75rem 1.5rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: background-color 0.2s;
    white-space: nowrap;
    &:hover { background-color: #f3f4f6; }
  `,
  thWide: css`
    width: 25%;
  `,
  thInner: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `,
  sortIconInactive: css`
    width: 0.875rem;
    height: 0.875rem;
    color: #d1d5db;
  `,
  sortIconActive: css`
    width: 0.875rem;
    height: 0.875rem;
    color: #6366f1;
  `,
  tbody: css`
    & > tr + tr {
      border-top: 1px solid #e5e7eb;
    }
  `,
  row: css`
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover { background-color: #f9fafb; }
  `,
  rowUnread: css`
    cursor: pointer;
    background-color: #eef2ff;
    border-left: 4px solid #4f46e5;
    transition: background-color 0.2s;
    &:hover { background-color: #e0e7ff; }
  `,
  td: css`
    padding: 1rem 1.5rem;
    white-space: nowrap;
    font-size: 0.875rem;
  `,
  ticketIdCell: css`
    display: flex;
    align-items: center;
    gap: 0.75rem;
  `,
  unreadIcon: css`
    width: 1rem;
    height: 1rem;
    color: #4f46e5;
    fill: #4f46e5;
  `,
  ticketIdBold: css`
    font-size: 0.75rem;
    font-family: monospace;
    color: #111827;
    font-weight: 600;
  `,
  ticketIdNormal: css`
    font-size: 0.75rem;
    font-family: monospace;
    color: #6b7280;
  `,
  titleCell: css`
    display: flex;
    align-items: center;
    gap: 0.75rem;
  `,
  titleBold: css`
    font-weight: 700;
    color: #111827;
  `,
  titleNormal: css`
    font-weight: 500;
    color: #111827;
  `,
  newReplyBadge: css`
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    background-color: #4f46e5;
    color: #ffffff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  `,
  newReplyIcon: css`
    width: 0.75rem;
    height: 0.75rem;
  `,
  moduleText: css`
    font-size: 0.875rem;
    color: #374151;
  `,
  categoryBadge: css`
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
    background-color: #f3f4f6;
    color: #374151;
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
  updatedCell: css`
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #6b7280;
  `,
  smallIcon: css`
    width: 0.75rem;
    height: 0.75rem;
  `,

  /* Empty State */
  emptyState: css`
    padding: 3rem;
    text-align: center;
    color: #6b7280;
  `,
  emptyIcon: css`
    width: 4rem;
    height: 4rem;
    margin: 0 auto 1rem;
    color: #9ca3af;
  `,
  emptyTitle: css`
    font-size: 1.125rem;
    margin: 0 0 0.5rem 0;
  `,
  emptySubtitle: css`
    font-size: 0.875rem;
    margin: 0;
  `,

  /* Pagination */
  pagination: css`
    margin-top: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,
  paginationLeft: css`
    display: flex;
    align-items: center;
    gap: 1rem;
  `,
  paginationInfo: css`
    font-size: 0.875rem;
    color: #4b5563;
    margin: 0;
  `,
  perPageSelect: css`
    padding: 0.25rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    outline: none;
    background: transparent;
    &:focus {
      box-shadow: 0 0 0 1px #6366f1;
      border-color: transparent;
    }
  `,
  paginationRight: css`
    display: flex;
    align-items: center;
    gap: 0.25rem;
  `,
  pageButton: css`
    padding: 0.25rem;
    border: none;
    background: none;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover { background-color: #e5e7eb; }
    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `,
  pageIcon: css`
    width: 1.25rem;
    height: 1.25rem;
    color: #4b5563;
  `,
};