import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import { Users, BookOpen, Ticket, BarChart3, TrendingUp } from "lucide-react";
import UserMenu from "../../components/UserMenu";

const API_BASE = "https://w25037936.nuwebspace.co.uk/KV6027/CAETS/api/admin/index.php";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}?action=stats`, { credentials: "include" });
        const data = await res.json();
        if (res.ok) setStats(data.stats);
      } catch {
        console.error("Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className={s.pageWrapper}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerInner}>
                      <button
              onClick={() => navigate("/student")}
              className={s.brandButton}
              aria-label="Go to portal home"
            >
              <img src="/KV6027/CAETS/app/CAETS_logo.png" alt="CAETS" className={s.logo} />
              <h1 className={s.pageTitle}>Admin Portal</h1>
            </button>
          <div className={s.headerRight}>
            <button onClick={() => navigate("/admin/analytics")} className={s.analyticsButton}>
              <TrendingUp className={s.analyticsButtonIcon} />
              View Analytics
            </button>
            <UserMenu portal="admin" />
          </div>
        </div>
      </div>

      <div className={s.scrollArea}>
        <div className={s.contentWrapper}>
          {/* Stat Cards */}
          {loading ? (
            <p className={s.loadingText}>Loading stats...</p>
          ) : stats && (
            <div className={s.statsGrid}>
              <div className={s.statCard}>
                <div className={s.statIconWrap} style={{ backgroundColor: "#eff6ff" }}>
                  <Users className={s.statIcon} style={{ color: "#2563eb" }} />
                </div>
                <div>
                  <p className={s.statValue}>{stats.users.students + stats.users.lecturers + stats.users.admins}</p>
                  <p className={s.statLabel}>Total Users</p>
                  <p className={s.statSub}>
                    {stats.users.students} students · {stats.users.lecturers} lecturers · {stats.users.admins} admins
                  </p>
                </div>
              </div>

              <div className={s.statCard}>
                <div className={s.statIconWrap} style={{ backgroundColor: "#faf5ff" }}>
                  <Ticket className={s.statIcon} style={{ color: "#7c3aed" }} />
                </div>
                <div>
                  <p className={s.statValue}>{stats.tickets.total}</p>
                  <p className={s.statLabel}>Total Tickets</p>
                  <p className={s.statSub}>
                    {Object.entries(stats.tickets.by_status).map(([status, count]) => `${count} ${status}`).join(" · ")}
                  </p>
                </div>
              </div>

              <div className={s.statCard}>
                <div className={s.statIconWrap} style={{ backgroundColor: "#ecfdf5" }}>
                  <BookOpen className={s.statIcon} style={{ color: "#059669" }} />
                </div>
                <div>
                  <p className={s.statValue}>{stats.modules.total}</p>
                  <p className={s.statLabel}>Active Modules</p>
                </div>
              </div>

              <div className={s.statCard}>
                <div className={s.statIconWrap} style={{ backgroundColor: "#fef9c3" }}>
                  <BarChart3 className={s.statIcon} style={{ color: "#854d0e" }} />
                </div>
                <div>
                  <p className={s.statValue}>{stats.users.active}</p>
                  <p className={s.statLabel}>Active Users</p>
                  <p className={s.statSub}>{stats.users.inactive} inactive</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className={s.actionsGrid}>
            <button onClick={() => navigate("/admin/users")} className={s.actionCard}>
              <Users className={s.actionIcon} />
              <h3 className={s.actionTitle}>User Management</h3>
              <p className={s.actionDesc}>Create accounts, manage status, reset passwords</p>
            </button>

            <button onClick={() => navigate("/admin/modules")} className={s.actionCard}>
              <BookOpen className={s.actionIcon} />
              <h3 className={s.actionTitle}>Module Management</h3>
              <p className={s.actionDesc}>Create modules, assign lecturers</p>
            </button>

            <button onClick={() => navigate("/admin/analytics")} className={s.actionCard}>
              <TrendingUp className={s.actionIcon} />
              <h3 className={s.actionTitle}>System Analytics</h3>
              <p className={s.actionDesc}>View system-wide performance metrics and lecturer leaderboard</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

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
    @media (min-width: 1024px) { padding-left: 2rem; padding-right: 2rem; }
  `,
    brandButton: css`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: opacity 0.2s;
    &:hover { opacity: 0.85; }
  `,
  logo: css`
    height: 2.5rem;
    width: auto;
    border-radius: 0.375rem;
    display: block;
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
    gap: 0.75rem;
  `,
  analyticsButton: css`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: #4f46e5;
    color: #ffffff;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover { background-color: #4338ca; }
  `,
  analyticsButtonIcon: css`
    width: 1rem;
    height: 1rem;
  `,
  scrollArea: css`
    flex: 1;
    overflow-y: auto;
  `,
  contentWrapper: css`
    max-width: 80rem;
    margin: 0 auto;
    padding: 1.5rem;
    @media (min-width: 1024px) { padding-left: 2rem; padding-right: 2rem; }
  `,
  loadingText: css`
    color: #6b7280;
    text-align: center;
    padding: 2rem;
  `,
  statsGrid: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
    @media (min-width: 768px) { grid-template-columns: 1fr 1fr; }
    @media (min-width: 1024px) { grid-template-columns: 1fr 1fr 1fr 1fr; }
  `,
  statCard: css`
    background-color: #ffffff;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1.25rem;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  `,
  statIconWrap: css`
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  `,
  statIcon: css`
    width: 1.25rem;
    height: 1.25rem;
  `,
  statValue: css`
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  `,
  statLabel: css`
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  `,
  statSub: css`
    font-size: 0.75rem;
    color: #9ca3af;
    margin: 0.25rem 0 0 0;
  `,
  actionsGrid: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    @media (min-width: 768px) { grid-template-columns: 1fr 1fr; }
    @media (min-width: 1024px) { grid-template-columns: 1fr 1fr 1fr; }
  `,
  actionCard: css`
    background-color: #ffffff;
    border: 2px solid #e5e7eb;
    cursor: pointer;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    text-align: left;
    transition: all 0.2s;
    &:hover { box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1); border-color: #93c5fd; }
  `,
  actionIcon: css`
    width: 2.5rem;
    height: 2.5rem;
    color: #374151;
    margin-bottom: 1rem;
  `,
  actionTitle: css`
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem 0;
  `,
  actionDesc: css`
    color: #6b7280;
    margin: 0;
    font-size: 0.875rem;
  `,
};