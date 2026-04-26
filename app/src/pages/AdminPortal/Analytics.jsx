import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import {
  ArrowLeft,
  Users,
  GraduationCap,
  ShieldCheck,
  Inbox,
  CheckCircle,
  Clock,
  Star,
  Target,
  BookOpen,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import NotificationBell from "../../components/NotificationBell";
import UserMenu from "../../components/UserMenu";

const API_BASE = "https://w25037936.nuwebspace.co.uk/KV6027/CAETS/api/admin/index.php";

const CATEGORY_COLORS = ["#4f46e5", "#7c3aed", "#06b6d4", "#10b981", "#f59e0b"];
const URGENCY_COLORS = {
  Critical: "#dc2626",
  High: "#ea580c",
  Medium: "#ca8a04",
  Low: "#2563eb",
};

const Analytics = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weeks, setWeeks] = useState(12);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}?action=stats&weeks=${weeks}`, {
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to load analytics");
        setStats(json.stats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [weeks]);

  if (loading) return <div className={s.loadingPage}>Loading analytics...</div>;
  if (error || !stats) {
    return (
      <div className={s.loadingPage}>
        <p>{error || "Failed to load analytics"}</p>
        <button onClick={() => navigate("/admin")} className={s.backLink}>
          ← Back to portal
        </button>
      </div>
    );
  }

  const u = stats.users;
  const t = stats.tickets;
  const p = stats.performance;

  // Format time series data
  const timeSeriesData = stats.tickets_over_time.map((row) => ({
    label: stats.bucket === "week"
      ? format(new Date(row.bucket), "dd MMM")
      : format(new Date(row.bucket), "MMM yyyy"),
    count: parseInt(row.count, 10),
  }));

  return (
    <div className={s.pageWrapper}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerInner}>
          <div className={s.headerLeft}>
            <button onClick={() => navigate("/admin")} className={s.backButton}>
              <ArrowLeft className={s.backIcon} />
            </button>
            <div>
              <h1 className={s.pageTitle}>System Analytics</h1>
              <p className={s.headerSubtitle}>System-wide performance metrics</p>
            </div>
          </div>
          <div className={s.headerRight}>
            <NotificationBell portal="admin" />
            <UserMenu portal="admin" />
          </div>
        </div>
      </div>

      <div className={s.scrollArea}>
        <div className={s.contentWrapper}>
          {/* Time window toggle */}
          <div className={s.toggleRow}>
            <span className={s.toggleLabel}>Time window:</span>
            <div className={s.toggleGroup}>
              {[
                { value: 4, label: "4 weeks" },
                { value: 12, label: "12 weeks" },
                { value: 52, label: "12 months" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setWeeks(opt.value)}
                  className={weeks === opt.value ? s.toggleActive : s.toggleInactive}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* User KPI Cards */}
          <div className={s.sectionHeader}>
            <h2 className={s.sectionTitle}>User Overview</h2>
          </div>
          <div className={s.kpiGrid}>
            <KpiCard
              icon={<Users className={s.kpiIcon} />}
              label="Students"
              value={u.students}
              color="#4f46e5"
            />
            <KpiCard
              icon={<GraduationCap className={s.kpiIcon} />}
              label="Lecturers"
              value={u.lecturers}
              color="#7c3aed"
            />
            <KpiCard
              icon={<ShieldCheck className={s.kpiIcon} />}
              label="Admins"
              value={u.admins}
              color="#0891b2"
            />
            <KpiCard
              icon={<BookOpen className={s.kpiIcon} />}
              label="Active Modules"
              value={stats.modules.total}
              color="#10b981"
            />
          </div>

          {/* Ticket KPIs */}
          <div className={s.sectionHeader}>
            <h2 className={s.sectionTitle}>Ticket Performance</h2>
          </div>
          <div className={s.kpiGrid}>
            <KpiCard
              icon={<Inbox className={s.kpiIcon} />}
              label="Total Tickets"
              value={t.total}
              color="#4f46e5"
            />
            <KpiCard
              icon={<CheckCircle className={s.kpiIcon} />}
              label="Resolved"
              value={t.resolved}
              color="#16a34a"
            />
            <KpiCard
              icon={<Clock className={s.kpiIcon} />}
              label="Avg Response"
              value={p.avg_response_hours !== null ? `${p.avg_response_hours}h` : "—"}
              color="#0891b2"
            />
            <KpiCard
              icon={<Target className={s.kpiIcon} />}
              label="SLA Compliance"
              value={p.sla_compliance !== null ? `${p.sla_compliance}%` : "—"}
              color={p.sla_compliance >= 80 ? "#16a34a" : p.sla_compliance >= 60 ? "#d97706" : "#dc2626"}
            />
            <KpiCard
              icon={<Star className={s.kpiIcon} />}
              label="Avg Rating"
              value={p.avg_rating !== null ? `${p.avg_rating} / 5` : "—"}
              subtext={p.total_ratings > 0 ? `${p.total_ratings} rating${p.total_ratings !== 1 ? "s" : ""}` : null}
              color="#fbbf24"
            />
          </div>

          {/* Charts Row 1 */}
          <div className={s.chartGrid}>
            <ChartCard title="Tickets Over Time" subtitle={stats.bucket === "week" ? "By week" : "By month"}>
              {timeSeriesData.length === 0 ? (
                <EmptyChart message="No tickets in this time window" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={{ fill: "#4f46e5", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Category Breakdown" subtitle="All time">
              {stats.category_breakdown.length === 0 ? (
                <EmptyChart message="No tickets yet" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.category_breakdown.map((c) => ({
                        name: c.category,
                        value: parseInt(c.count, 10),
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {stats.category_breakdown.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* Charts Row 2 */}
          <div className={s.chartGrid}>
            <ChartCard title="Urgency Distribution" subtitle="All time">
              {stats.urgency_distribution.length === 0 ? (
                <EmptyChart message="No tickets yet" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.urgency_distribution.map((u) => ({
                    urgency: u.urgency,
                    count: parseInt(u.count, 10),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="urgency" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stats.urgency_distribution.map((u, i) => (
                        <Cell key={i} fill={URGENCY_COLORS[u.urgency] || "#6b7280"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Rating Distribution" subtitle={`${p.total_ratings} ratings system-wide`}>
              {stats.rating_distribution.length === 0 ? (
                <EmptyChart message="No ratings yet" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[1, 2, 3, 4, 5].map((stars) => {
                    const found = stats.rating_distribution.find((r) => parseInt(r.stars, 10) === stars);
                    return { stars: `${stars}★`, count: found ? parseInt(found.count, 10) : 0 };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="stars" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* Lecturer leaderboard */}
          <div className={s.chartCard}>
            <h3 className={s.chartTitle}>Lecturer Performance</h3>
            <p className={s.chartSubtitle}>Sorted by ticket volume</p>

            {stats.lecturer_stats.length === 0 ? (
              <EmptyChart message="No lecturer data yet" />
            ) : (
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th className={s.th}>Lecturer</th>
                      <th className={s.thRight}>Tickets</th>
                      <th className={s.thRight}>Avg Response</th>
                      <th className={s.thRight}>SLA Compliance</th>
                      <th className={s.thRight}>Avg Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.lecturer_stats.map((l) => (
                      <tr key={l.user_id}>
                        <td className={s.td}>{l.name}</td>
                        <td className={s.tdRight}>{l.ticket_count}</td>
                        <td className={s.tdRight}>
                          {l.avg_response_hours !== null ? `${l.avg_response_hours}h` : "—"}
                        </td>
                        <td className={s.tdRight}>
                          {l.sla_compliance !== null ? (
                            <span style={{
                              color: l.sla_compliance >= 80 ? "#16a34a" : l.sla_compliance >= 60 ? "#d97706" : "#dc2626",
                              fontWeight: 600,
                            }}>
                              {l.sla_compliance}%
                            </span>
                          ) : "—"}
                        </td>
                        <td className={s.tdRight}>
                          {l.avg_rating !== null
                            ? `${l.avg_rating} ★ (${l.rating_count})`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top modules table */}
          <div className={s.chartCard}>
            <h3 className={s.chartTitle}>Top Modules by Ticket Volume</h3>
            <p className={s.chartSubtitle}>Highest enquiry-generating modules</p>

            {stats.top_modules.length === 0 ? (
              <EmptyChart message="No tickets yet" />
            ) : (
              <table className={s.table}>
                <thead>
                  <tr>
                    <th className={s.th}>Module Code</th>
                    <th className={s.th}>Module Name</th>
                    <th className={s.thRight}>Tickets</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_modules.map((m) => (
                    <tr key={m.module_code}>
                      <td className={s.tdCode}>{m.module_code}</td>
                      <td className={s.td}>{m.module_name}</td>
                      <td className={s.tdRight}>{m.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ icon, label, value, subtext, color }) => (
  <div className={s.kpiCard}>
    <div className={s.kpiIconWrap} style={{ backgroundColor: `${color}20`, color }}>
      {icon}
    </div>
    <div>
      <p className={s.kpiLabel}>{label}</p>
      <p className={s.kpiValue}>{value}</p>
      {subtext && <p className={s.kpiSubtext}>{subtext}</p>}
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children }) => (
  <div className={s.chartCard}>
    <h3 className={s.chartTitle}>{title}</h3>
    {subtitle && <p className={s.chartSubtitle}>{subtitle}</p>}
    {children}
  </div>
);

const EmptyChart = ({ message }) => (
  <div className={s.emptyChart}>
    <p>{message}</p>
  </div>
);

export default Analytics;

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

  /* Section headers */
  sectionHeader: css`
    margin-top: 0.5rem;
  `,
  sectionTitle: css`
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
  `,

  /* Toggle */
  toggleRow: css`
    display: flex;
    align-items: center;
    gap: 0.875rem;
  `,
  toggleLabel: css`
    font-size: 0.875rem;
    color: #4b5563;
    font-weight: 500;
  `,
  toggleGroup: css`
    display: inline-flex;
    border-radius: 0.5rem;
    border: 1px solid #d1d5db;
    background-color: #ffffff;
    padding: 0.25rem;
  `,
  toggleActive: css`
    padding: 0.375rem 0.875rem;
    border-radius: 0.375rem;
    font-weight: 500;
    font-size: 0.8125rem;
    background-color: #4f46e5;
    color: #ffffff;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  `,
  toggleInactive: css`
    padding: 0.375rem 0.875rem;
    border-radius: 0.375rem;
    font-weight: 500;
    font-size: 0.8125rem;
    background: none;
    color: #374151;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { color: #111827; }
  `,

  /* KPIs */
  kpiGrid: css`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    @media (min-width: 768px) {
      grid-template-columns: repeat(3, 1fr);
    }
    @media (min-width: 1280px) {
      grid-template-columns: repeat(5, 1fr);
    }
  `,
  kpiCard: css`
    background-color: #ffffff;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.875rem;
  `,
  kpiIconWrap: css`
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 0.625rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  `,
  kpiIcon: css`
    width: 1.375rem;
    height: 1.375rem;
  `,
  kpiLabel: css`
    margin: 0;
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  `,
  kpiValue: css`
    margin: 0.125rem 0 0 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    line-height: 1.2;
  `,
  kpiSubtext: css`
    margin: 0.125rem 0 0 0;
    font-size: 0.6875rem;
    color: #9ca3af;
  `,

  /* Charts */
  chartGrid: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    @media (min-width: 1024px) {
      grid-template-columns: 1fr 1fr;
    }
  `,
  chartCard: css`
    background-color: #ffffff;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;
    padding: 1.25rem;
  `,
  chartTitle: css`
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
  `,
  chartSubtitle: css`
    margin: 0 0 1rem 0;
    font-size: 0.8125rem;
    color: #6b7280;
  `,
  emptyChart: css`
    height: 250px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    font-size: 0.875rem;
  `,

  /* Table */
  tableScroll: css`
    overflow-x: auto;
  `,
  table: css`
    width: 100%;
    border-collapse: collapse;
  `,
  th: css`
    padding: 0.75rem 0.5rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e5e7eb;
  `,
  thRight: css`
    padding: 0.75rem 0.5rem;
    text-align: right;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e5e7eb;
  `,
  td: css`
    padding: 0.75rem 0.5rem;
    font-size: 0.875rem;
    color: #374151;
    border-bottom: 1px solid #f3f4f6;
  `,
  tdCode: css`
    padding: 0.75rem 0.5rem;
    font-size: 0.8125rem;
    color: #111827;
    font-family: monospace;
    font-weight: 600;
    border-bottom: 1px solid #f3f4f6;
  `,
  tdRight: css`
    padding: 0.75rem 0.5rem;
    text-align: right;
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    border-bottom: 1px solid #f3f4f6;
  `,
};