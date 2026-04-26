import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import {
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
import { format } from "date-fns";
import NotificationBell from "../../components/NotificationBell";
import UserMenu from "../../components/UserMenu";
import SLABadge from "../../components/SLABadge";

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

const hasUnreadReplies = (ticket, portal) => {
  return false;
};

/**
 * Computes SLA status for a ticket. Mirrors logic in SLABadge.jsx.
 * Returns: 'met' | 'breached' | 'on_track' | 'due_soon' | 'overdue' | null
 */
const computeSlaStatus = (ticket, now) => {
  if (!ticket.sla_deadline) return null;

  const deadline = new Date(ticket.sla_deadline);
  const responded = ticket.first_response_at ? new Date(ticket.first_response_at) : null;

  if (responded) {
    return responded <= deadline ? "met" : "breached";
  }

  const msRemaining = deadline - now;
  if (msRemaining <= 0) return "overdue";

  const dueSoonThreshold = 2 * 60 * 60 * 1000;
  if (msRemaining < dueSoonThreshold) return "due_soon";
  return "on_track";
};

const SLA_SORT_ORDER = {
  overdue: 0,
  due_soon: 1,
  on_track: 2,
  breached: 3,
  met: 4,
};

const Home = () => {
  const navigate = useNavigate();

  // Data state
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live clock for SLA calculations - re-renders every minute
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Filter & search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModule, setFilterModule] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSla, setFilterSla] = useState("all");

  // Tab state
  const [activeTab, setActiveTab] = useState("active");

  // Sort state
  const [sortColumn, setSortColumn] = useState("updated");
  const [sortDirection, setSortDirection] = useState("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch(`${API_BASE}?action=lecturer-tickets`, {
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

  // Unique modules for filter dropdown
  const uniqueModules = useMemo(() => {
    const modules = tickets.map((t) => `${t.module_code} - ${t.module_name}`).filter(Boolean);
    return [...new Set(modules)];
  }, [tickets]);

  // Tab counts
  const activeCount = tickets.filter(
    (t) => t.status !== "Resolved" && t.status !== "Closed"
  ).length;
  const pastCount = tickets.filter(
    (t) => t.status === "Resolved" || t.status === "Closed"
  ).length;

  // Tickets by tab
  const tabTickets = useMemo(() => {
    if (activeTab === "active") {
      return tickets.filter((t) => t.status !== "Resolved" && t.status !== "Closed");
    }
    return tickets.filter((t) => t.status === "Resolved" || t.status === "Closed");
  }, [tickets, activeTab]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tabTickets.filter((ticket) => {
      const moduleFull = `${ticket.module_code} - ${ticket.module_name}`;

      const matchesSearch =
        !searchQuery ||
        ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ticket.description || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesModule = filterModule === "all" || moduleFull === filterModule;
      const matchesCategory = filterCategory === "all" || ticket.category === filterCategory;
      const matchesUrgency = filterUrgency === "all" || ticket.urgency === filterUrgency;
      const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;

      const slaStatus = computeSlaStatus(ticket, now);
      const matchesSla = filterSla === "all" || slaStatus === filterSla;

      return (
        matchesSearch &&
        matchesModule &&
        matchesCategory &&
        matchesUrgency &&
        matchesStatus &&
        matchesSla
      );
    });
  }, [
    tabTickets,
    searchQuery,
    filterModule,
    filterCategory,
    filterUrgency,
    filterStatus,
    filterSla,
    now,
  ]);

  // Sorted tickets
  const sortedTickets = useMemo(() => {
    const sorted = [...filteredTickets].sort((a, b) => {
      let valA, valB;
      switch (sortColumn) {
        case "id": valA = a.ticket_number; valB = b.ticket_number; break;
        case "title": valA = a.subject; valB = b.subject; break;
        case "module": valA = a.module_code; valB = b.module_code; break;
        case "category": valA = a.category; valB = b.category; break;
        case "urgency":
          const urgencyOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
          valA = urgencyOrder[a.urgency] ?? 4;
          valB = urgencyOrder[b.urgency] ?? 4;
          break;
        case "status": valA = a.status; valB = b.status; break;
        case "sla":
          valA = SLA_SORT_ORDER[computeSlaStatus(a, now)] ?? 99;
          valB = SLA_SORT_ORDER[computeSlaStatus(b, now)] ?? 99;
          break;
        case "updated":
          valA = new Date(a.updated_at).getTime();
          valB = new Date(b.updated_at).getTime();
          break;
        default: valA = a.ticket_number; valB = b.ticket_number;
      }
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredTickets, sortColumn, sortDirection, now]);

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery("");
    setFilterModule("all");
    setFilterCategory("all");
    setFilterUrgency("all");
    setFilterStatus("all");
    setFilterSla("all");
  };

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) return <ChevronUp className={s.sortIconInactive} />;
    return sortDirection === "asc" ? (
      <ChevronUp className={s.sortIconActive} />
    ) : (
      <ChevronDown className={s.sortIconActive} />
    );
  };

  if (loading) {
    return <div className={s.loadingPage}>Loading tickets...</div>;
  }

  // Build the column definitions - SLA column only shows on Active tab
  const columns = [
    { key: "id", label: "Ticket ID" },
    { key: "title", label: "Title" },
    { key: "module", label: "Module" },
    { key: "category", label: "Category" },
    { key: "urgency", label: "Urgency" },
    { key: "status", label: "Status" },
    ...(activeTab === "active" ? [{ key: "sla", label: "SLA" }] : []),
    { key: "updated", label: "Last Updated" },
  ];

  return (
    <div className={s.pageWrapper}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerInner}>
          <div className={s.headerLeft}>
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

          {/* Tabs */}
          <div className={s.tabWrapper}>
            <div className={s.tabGroup}>
              <button
                onClick={() => handleTabChange("active")}
                className={activeTab === "active" ? s.tabActive : s.tabInactive}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => handleTabChange("past")}
                className={activeTab === "past" ? s.tabActive : s.tabInactive}
              >
                Past ({pastCount})
              </button>
            </div>
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
                  <option value="Module Content">Module Content</option>
                  <option value="Gradebook">Gradebook</option>
                  <option value="Assessment & Submission">Assessment & Submission</option>
                  <option value="Other">Other</option>
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
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Status + SLA filters row */}
            <div className={s.bottomFilterRow}>
              <div className={s.bottomFilterCol}>
                <label className={s.label}>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  className={s.statusSelect}
                >
                  <option value="all">All Status</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Awaiting Response">Awaiting Response</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {activeTab === "active" && (
                <div className={s.bottomFilterCol}>
                  <label className={s.label}>SLA</label>
                  <select
                    value={filterSla}
                    onChange={(e) => { setFilterSla(e.target.value); setCurrentPage(1); }}
                    className={s.statusSelect}
                  >
                    <option value="all">All SLA</option>
                    <option value="overdue">Overdue</option>
                    <option value="due_soon">Due Soon</option>
                    <option value="on_track">On Track</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Tickets Table */}
          <div className={s.tableCard}>
            {paginatedTickets.length === 0 ? (
              <div className={s.emptyState}>
                <Inbox className={s.emptyIcon} />
                <p className={s.emptyTitle}>No tickets found</p>
                <p className={s.emptySubtitle}>
                  {searchQuery || filterStatus !== "all" || filterModule !== "all" || filterSla !== "all"
                    ? "Try adjusting your filters"
                    : "You're all caught up!"}
                </p>
              </div>
            ) : (
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead className={s.thead}>
                    <tr>
                      {columns.map((col) => (
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
                          key={ticket.ticket_id}
                          onClick={() => navigate(`/lecturer/ticket/${ticket.ticket_id}`)}
                          className={isUnread ? s.rowUnread : s.row}
                        >
                          <td className={s.td}>
                            <div className={s.ticketIdCell}>
                              {isUnread && (
                                <Mail className={s.unreadIcon} title="Unread replies" />
                              )}
                              <span className={isUnread ? s.ticketIdBold : s.ticketIdNormal}>
                                {ticket.ticket_number}
                              </span>
                            </div>
                          </td>
                          <td className={s.td}>
                            <div className={s.titleCell}>
                              <span className={isUnread ? s.titleBold : s.titleNormal}>
                                {ticket.subject}
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
                            <span className={s.moduleText}>{ticket.module_code}</span>
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
                          {activeTab === "active" && (
                            <td className={s.td}>
                              <SLABadge
                                slaDeadline={ticket.sla_deadline}
                                firstResponseAt={ticket.first_response_at}
                                variant="compact"
                              />
                            </td>
                          )}
                          <td className={s.td}>
                            <div className={s.updatedCell}>
                              <Clock className={s.smallIcon} />
                              {format(new Date(ticket.updated_at), "dd MMM yyyy, HH:mm")}
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

export default Home;

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
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: #6b7280;
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

  /* Tabs */
  tabWrapper: css`
    margin-bottom: 1.5rem;
  `,
  tabGroup: css`
    display: inline-flex;
    border-radius: 0.5rem;
    border: 1px solid #d1d5db;
    background-color: #ffffff;
    padding: 0.25rem;
  `,
  tabActive: css`
    padding: 0.375rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    font-size: 0.875rem;
    background-color: #4f46e5;
    color: #ffffff;
    border: none;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.2s;
  `,
  tabInactive: css`
    padding: 0.375rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    font-size: 0.875rem;
    background: none;
    color: #374151;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { color: #111827; }
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
  bottomFilterRow: css`
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  `,
  bottomFilterCol: css`
    flex: 1;
    min-width: 12rem;
    max-width: 16rem;
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