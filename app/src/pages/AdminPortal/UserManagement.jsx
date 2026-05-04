import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import {
  ArrowLeft,
  UserPlus,
  Search,
  Shield,
  ShieldOff,
  KeyRound,
  X,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Users,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import UserMenu from "../../components/UserMenu";

const API_BASE = "https://w25037936.nuwebspace.co.uk/KV6027/CAETS/api/admin/index.php";

const AdminUserManagement = () => {
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState("users"); // "users" | "cohorts"

  // Users
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Cohorts (used by both tabs)
  const [cohorts, setCohorts] = useState([]);
  const [cohortsLoading, setCohortsLoading] = useState(true);

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", first_name: "", last_name: "", role: "student", password: "default123" });
  const [createLoading, setCreateLoading] = useState(false);

  // Cohort CRUD modal
  const [showCohortModal, setShowCohortModal] = useState(false);
  const [editingCohort, setEditingCohort] = useState(null);
  const [cohortForm, setCohortForm] = useState({ name: "", description: "" });
  const [cohortLoading, setCohortLoading] = useState(false);

  // Member picker modal
  const [memberModalCohort, setMemberModalCohort] = useState(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [memberSaveLoading, setMemberSaveLoading] = useState(false);

  // Feedback
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}?action=users`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setUsers(data.users);
    } catch {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchCohorts = async () => {
    try {
      const res = await fetch(`${API_BASE}?action=cohorts`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setCohorts(data.cohorts);
    } catch {
      console.error("Failed to fetch cohorts");
    } finally {
      setCohortsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCohorts();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = !searchQuery ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.last_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === "all" || u.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, filterRole]);

  // Students filtered by member-picker search
  const filteredStudentsForPicker = useMemo(() => {
    const students = users.filter((u) => u.role === "student");
    if (!memberSearch) return students;
    const q = memberSearch.toLowerCase();
    return students.filter((u) =>
      u.email.toLowerCase().includes(q) ||
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q)
    );
  }, [users, memberSearch]);

  const handleCreateUser = async () => {
    setCreateLoading(true);
    setFeedback({ type: "", message: "" });
    try {
      const res = await fetch(`${API_BASE}?action=create-user`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setFeedback({ type: "success", message: `User created. Password: ${data.user.password}` });
      setShowCreateModal(false);
      setNewUser({ email: "", first_name: "", last_name: "", role: "student", password: "default123" });
      await fetchUsers();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}?action=toggle-user`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setFeedback({ type: "success", message: data.message });
      await fetchUsers();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleResetPassword = async (userId) => {
    if (!confirm("Reset this user's password to 'default123'?")) return;

    try {
      const res = await fetch(`${API_BASE}?action=reset-user-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setFeedback({ type: "success", message: data.message });
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleAssignCohort = async (userId, cohortId) => {
    try {
      const res = await fetch(`${API_BASE}?action=assign-cohort`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          cohort_id: cohortId === "" ? null : parseInt(cohortId, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setFeedback({ type: "success", message: data.message });
      await fetchUsers();
      await fetchCohorts();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  // Cohort CRUD handlers
  const openCreateCohort = () => {
    setEditingCohort(null);
    setCohortForm({ name: "", description: "" });
    setShowCohortModal(true);
  };

  const openEditCohort = (cohort) => {
    setEditingCohort(cohort);
    setCohortForm({ name: cohort.name, description: cohort.description || "" });
    setShowCohortModal(true);
  };

  const handleSaveCohort = async () => {
    setCohortLoading(true);
    setFeedback({ type: "", message: "" });
    try {
      const url = editingCohort
        ? `${API_BASE}?action=update-cohort`
        : `${API_BASE}?action=create-cohort`;
      const body = editingCohort
        ? { cohort_id: editingCohort.cohort_id, ...cohortForm }
        : cohortForm;

      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setFeedback({
        type: "success",
        message: editingCohort ? "Cohort updated" : "Cohort created",
      });
      setShowCohortModal(false);
      await fetchCohorts();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setCohortLoading(false);
    }
  };

  const handleDeleteCohort = async (cohort) => {
    if (!confirm(
      `Delete cohort "${cohort.name}"?\n\nStudents will be unassigned. Module assignments to this cohort will be removed.`
    )) return;

    try {
      const res = await fetch(`${API_BASE}?action=delete-cohort`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cohort_id: cohort.cohort_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setFeedback({ type: "success", message: data.message });
      await fetchCohorts();
      await fetchUsers();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  // Member picker handlers
  const openMemberModal = (cohort) => {
    setMemberModalCohort(cohort);
    setMemberSearch("");
    // Pre-tick students currently in this cohort
    const currentMemberIds = users
      .filter((u) => u.role === "student" && u.cohort_id === cohort.cohort_id)
      .map((u) => u.user_id);
    setSelectedMemberIds(currentMemberIds);
    setFeedback({ type: "", message: "" });
  };

  const toggleMember = (userId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSaveMembers = async () => {
    if (!memberModalCohort) return;
    setMemberSaveLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch(`${API_BASE}?action=bulk-assign-cohort`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cohort_id: memberModalCohort.cohort_id,
          user_ids: selectedMemberIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setFeedback({ type: "success", message: data.message });
      setMemberModalCohort(null);
      await fetchUsers();
      await fetchCohorts();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setMemberSaveLoading(false);
    }
  };

  const roleColors = {
    student: css`
      background-color: #dbeafe;
      color: #1e40af;
    `,
    lecturer: css`
      background-color: #faf5ff;
      color: #7c3aed;
    `,
    admin: css`
      background-color: #fef9c3;
      color: #854d0e;
    `,
  };

  return (
    <div className={s.pageWrapper}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerInner}>
          <div className={s.headerLeft}>
            <button onClick={() => navigate("/admin")} className={s.backButton}>
              <ArrowLeft className={s.backIcon} />
            </button>
            <h1 className={s.pageTitle}>User Management</h1>
          </div>
          <UserMenu portal="admin" />
        </div>
      </div>

      <div className={s.scrollArea}>
        <div className={s.contentWrapper}>
          {/* Feedback */}
          {feedback.message && (
            <div className={feedback.type === "success" ? s.successBox : s.errorBox}>
              {feedback.type === "success" ? <CheckCircle className={s.alertIcon} /> : <AlertCircle className={s.alertIcon} />}
              <span>{feedback.message}</span>
              <button onClick={() => setFeedback({ type: "", message: "" })} className={s.dismissBtn}>
                <X className={s.dismissIcon} />
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className={s.tabsRow}>
            <button
              className={activeTab === "users" ? s.tabActive : s.tabInactive}
              onClick={() => setActiveTab("users")}
            >
              Users
            </button>
            <button
              className={activeTab === "cohorts" ? s.tabActive : s.tabInactive}
              onClick={() => setActiveTab("cohorts")}
            >
              Cohorts
            </button>
          </div>

          {activeTab === "users" && (
            <>
              {/* Toolbar */}
              <div className={s.toolbar}>
                <div className={s.toolbarLeft}>
                  <div className={s.searchWrap}>
                    <Search className={s.searchIcon} />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={s.searchInput}
                    />
                  </div>
                  <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={s.select}>
                    <option value="all">All Roles</option>
                    <option value="student">Students</option>
                    <option value="lecturer">Lecturers</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
                <button onClick={() => setShowCreateModal(true)} className={s.createBtn}>
                  <UserPlus className={s.createBtnIcon} />
                  Create User
                </button>
              </div>

              {/* Users Table */}
              <div className={s.tableCard}>
                {loading ? (
                  <div className={s.emptyState}>Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className={s.emptyState}>No users found</div>
                ) : (
                  <div className={s.tableScroll}>
                    <table className={s.table}>
                      <thead className={s.thead}>
                        <tr>
                          <th className={s.th}>Name</th>
                          <th className={s.th}>Email</th>
                          <th className={s.th}>Role</th>
                          <th className={s.th}>Cohort</th>
                          <th className={s.th}>Status</th>
                          <th className={s.th}>Created</th>
                          <th className={s.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className={s.tbody}>
                        {filteredUsers.map((user) => (
                          <tr key={user.user_id} className={s.row}>
                            <td className={s.td}>
                              <span className={s.userName}>{user.first_name} {user.last_name}</span>
                            </td>
                            <td className={s.td}>
                              <span className={s.userEmail}>{user.email}</span>
                            </td>
                            <td className={s.td}>
                              <span className={`${s.roleBadge} ${roleColors[user.role] || ""}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className={s.td}>
                              {user.role === "student" ? (
                                <select
                                  value={user.cohort_id ?? ""}
                                  onChange={(e) => handleAssignCohort(user.user_id, e.target.value)}
                                  className={s.cohortSelect}
                                >
                                  <option value="">— None —</option>
                                  {cohorts.map((c) => (
                                    <option key={c.cohort_id} value={c.cohort_id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className={s.dashText}>—</span>
                              )}
                            </td>
                            <td className={s.td}>
                              <span className={user.is_active ? s.activeBadge : s.inactiveBadge}>
                                {user.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className={s.td}>
                              <span className={s.dateText}>
                                {format(new Date(user.created_at), "dd MMM yyyy")}
                              </span>
                            </td>
                            <td className={s.td}>
                              <div className={s.actions}>
                                <button
                                  onClick={() => handleToggleStatus(user.user_id)}
                                  className={user.is_active ? s.deactivateBtn : s.activateBtn}
                                  title={user.is_active ? "Deactivate" : "Activate"}
                                >
                                  {user.is_active ? <ShieldOff className={s.actionBtnIcon} /> : <Shield className={s.actionBtnIcon} />}
                                  {user.is_active ? "Deactivate" : "Activate"}
                                </button>
                                <button
                                  onClick={() => handleResetPassword(user.user_id)}
                                  className={s.resetBtn}
                                  title="Reset password"
                                >
                                  <KeyRound className={s.actionBtnIcon} />
                                  Reset PW
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "cohorts" && (
            <>
              <div className={s.toolbar}>
                <p className={s.cohortHelp}>
                  
                </p>
                <button onClick={openCreateCohort} className={s.createBtn}>
                  <Plus className={s.createBtnIcon} />
                  Create Cohort
                </button>
              </div>

              <div className={s.tableCard}>
                {cohortsLoading ? (
                  <div className={s.emptyState}>Loading cohorts...</div>
                ) : cohorts.length === 0 ? (
                  <div className={s.emptyState}>No cohorts yet. Create one to get started.</div>
                ) : (
                  <div className={s.tableScroll}>
                    <table className={s.table}>
                      <thead className={s.thead}>
                        <tr>
                          <th className={s.th}>Name</th>
                          <th className={s.th}>Description</th>
                          <th className={s.th}>Students</th>
                          <th className={s.th}>Modules</th>
                          <th className={s.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className={s.tbody}>
                        {cohorts.map((c) => (
                          <tr key={c.cohort_id} className={s.row}>
                            <td className={s.td}>
                              <span className={s.userName}>{c.name}</span>
                            </td>
                            <td className={s.td}>
                              <span className={s.userEmail}>{c.description || "—"}</span>
                            </td>
                            <td className={s.td}>
                              <span className={s.countBadge}>
                                <Users className={s.countIcon} />
                                {c.student_count}
                              </span>
                            </td>
                            <td className={s.td}>
                              <span className={s.dateText}>{c.module_count} module{c.module_count !== 1 ? "s" : ""}</span>
                            </td>
                            <td className={s.td}>
                              <div className={s.actions}>
                                <button onClick={() => openMemberModal(c)} className={s.membersBtn}>
                                  <UserCheck className={s.actionBtnIcon} />
                                  Members
                                </button>
                                <button onClick={() => openEditCohort(c)} className={s.resetBtn}>
                                  <Edit2 className={s.actionBtnIcon} />
                                  Edit
                                </button>
                                <button onClick={() => handleDeleteCohort(c)} className={s.deactivateBtn}>
                                  <Trash2 className={s.actionBtnIcon} />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>Create New User</h2>
              <button onClick={() => setShowCreateModal(false)} className={s.modalClose}>
                <X className={s.modalCloseIcon} />
              </button>
            </div>
            <div className={s.modalBody}>
              <div className={s.fieldGroup}>
                <label className={s.label}>First Name</label>
                <input type="text" value={newUser.first_name} onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })} className={s.input} />
              </div>
              <div className={s.fieldGroup}>
                <label className={s.label}>Last Name</label>
                <input type="text" value={newUser.last_name} onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })} className={s.input} />
              </div>
              <div className={s.fieldGroup}>
                <label className={s.label}>Email</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className={s.input} />
              </div>
              <div className={s.fieldGroup}>
                <label className={s.label}>Role</label>
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className={s.input}>
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={s.fieldGroup}>
                <label className={s.label}>Default Password</label>
                <input type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className={s.input} />
              </div>
            </div>
            <div className={s.modalFooter}>
              <button onClick={() => setShowCreateModal(false)} className={s.cancelButton}>Cancel</button>
              <button
                onClick={handleCreateUser}
                disabled={createLoading || !newUser.email || !newUser.first_name || !newUser.last_name}
                className={s.submitButton}
              >
                {createLoading ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cohort Create/Edit Modal */}
      {showCohortModal && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>{editingCohort ? "Edit Cohort" : "Create Cohort"}</h2>
              <button onClick={() => setShowCohortModal(false)} className={s.modalClose}>
                <X className={s.modalCloseIcon} />
              </button>
            </div>
            <div className={s.modalBody}>
              <div className={s.fieldGroup}>
                <label className={s.label}>Name</label>
                <input
                  type="text"
                  value={cohortForm.name}
                  onChange={(e) => setCohortForm({ ...cohortForm, name: e.target.value })}
                  placeholder="e.g. BSc Computer Science Year 2"
                  className={s.input}
                />
              </div>
              <div className={s.fieldGroup}>
                <label className={s.label}>Description (optional)</label>
                <input
                  type="text"
                  value={cohortForm.description}
                  onChange={(e) => setCohortForm({ ...cohortForm, description: e.target.value })}
                  placeholder="Short note about this cohort"
                  className={s.input}
                />
              </div>
            </div>
            <div className={s.modalFooter}>
              <button onClick={() => setShowCohortModal(false)} className={s.cancelButton}>Cancel</button>
              <button
                onClick={handleSaveCohort}
                disabled={cohortLoading || !cohortForm.name.trim()}
                className={s.submitButton}
              >
                {cohortLoading ? "Saving..." : editingCohort ? "Save Changes" : "Create Cohort"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Picker Modal */}
      {memberModalCohort && (
        <div className={s.modalOverlay}>
          <div className={s.modalLarge}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>Members of {memberModalCohort.name}</h2>
              <button onClick={() => setMemberModalCohort(null)} className={s.modalClose}>
                <X className={s.modalCloseIcon} />
              </button>
            </div>
            <div className={s.modalBody}>
              <p className={s.modalSubtext}>
                Select students to assign to this cohort. {selectedMemberIds.length} selected.
                Students currently in another cohort will be moved to this one.
              </p>

              <div className={s.searchWrap}>
                <Search className={s.searchIcon} />
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className={s.searchInputFull}
                />
              </div>

              <div className={s.memberList}>
                {filteredStudentsForPicker.length === 0 ? (
                  <p className={s.emptyHint}>No students match your search.</p>
                ) : (
                  filteredStudentsForPicker.map((student) => {
                    const isSelected = selectedMemberIds.includes(student.user_id);
                    const inOtherCohort =
                      student.cohort_id &&
                      student.cohort_id !== memberModalCohort.cohort_id;
                    return (
                      <label key={student.user_id} className={s.memberRow}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMember(student.user_id)}
                        />
                        <div className={s.memberInfo}>
                          <span className={s.memberName}>
                            {student.first_name} {student.last_name}
                          </span>
                          <span className={s.memberEmail}>{student.email}</span>
                        </div>
                        {inOtherCohort && (
                          <span className={s.otherCohortPill}>
                            in {student.cohort_name}
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            <div className={s.modalFooter}>
              <button onClick={() => setMemberModalCohort(null)} className={s.cancelButton}>Cancel</button>
              <button
                onClick={handleSaveMembers}
                disabled={memberSaveLoading}
                className={s.submitButton}
              >
                {memberSaveLoading ? "Saving..." : "Save Members"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;

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
    background-color: #fff;
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
  successBox: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 0.5rem;
    color: #166534;
    font-size: 0.875rem;
  `,
  errorBox: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    color: #991b1b;
    font-size: 0.875rem;
  `,
  alertIcon: css`
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  `,
  dismissBtn: css`
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
  `,
  dismissIcon: css`
    width: 0.875rem;
    height: 0.875rem;
    color: #6b7280;
  `,

  tabsRow: css`
    display: flex;
    gap: 0.25rem;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 1.5rem;
  `,
  tabActive: css`
    padding: 0.625rem 1.25rem;
    background: none;
    border: none;
    border-bottom: 2px solid #2563eb;
    color: #2563eb;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: -1px;
  `,
  tabInactive: css`
    padding: 0.625rem 1.25rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    margin-bottom: -1px;
    &:hover {
      color: #374151;
    }
  `,

  toolbar: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  `,
  toolbarLeft: css`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  `,
  cohortHelp: css`
    margin: 0;
    font-size: 0.8125rem;
    color: #6b7280;
    max-width: 40rem;
  `,
  searchWrap: css`
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
    padding: 0.5rem 0.75rem 0.5rem 2.25rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    outline: none;
    box-sizing: border-box;
    width: 16rem;
    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
  `,
  searchInputFull: css`
    width: 100%;
    padding: 0.5rem 0.75rem 0.5rem 2.25rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    outline: none;
    box-sizing: border-box;
    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
  `,
  select: css`
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    outline: none;
    background: #fff;
    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
  `,
  cohortSelect: css`
    padding: 0.375rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    outline: none;
    background: #fff;
    min-width: 9rem;
    &:focus {
      border-color: #3b82f6;
    }
  `,
  createBtn: css`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: #059669;
    color: #fff;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    &:hover {
      background-color: #047857;
    }
  `,
  createBtnIcon: css`
    width: 1rem;
    height: 1rem;
  `,

  tableCard: css`
    background-color: #fff;
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
    white-space: nowrap;
  `,
  tbody: css`
    & > tr + tr {
      border-top: 1px solid #e5e7eb;
    }
  `,
  row: css`
    transition: background-color 0.15s;
    &:hover {
      background-color: #f9fafb;
    }
  `,
  td: css`
    padding: 0.875rem 1.5rem;
    font-size: 0.875rem;
    white-space: nowrap;
  `,
  userName: css`
    font-weight: 500;
    color: #111827;
  `,
  userEmail: css`
    color: #6b7280;
  `,
  roleBadge: css`
    display: inline-flex;
    padding: 0.125rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  `,
  activeBadge: css`
    display: inline-flex;
    padding: 0.125rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    background-color: #dcfce7;
    color: #166534;
  `,
  inactiveBadge: css`
    display: inline-flex;
    padding: 0.125rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    background-color: #fee2e2;
    color: #991b1b;
  `,
  countBadge: css`
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
    background-color: #eef2ff;
    color: #4338ca;
    font-size: 0.8125rem;
    font-weight: 500;
  `,
  countIcon: css`
    width: 0.75rem;
    height: 0.75rem;
  `,
  dateText: css`
    font-size: 0.8125rem;
    color: #6b7280;
  `,
  dashText: css`
    color: #9ca3af;
  `,
  actions: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `,
  deactivateBtn: css`
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.625rem;
    border: 1px solid #fecaca;
    background: #fff;
    color: #dc2626;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    cursor: pointer;
    &:hover {
      background-color: #fef2f2;
    }
  `,
  activateBtn: css`
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.625rem;
    border: 1px solid #bbf7d0;
    background: #fff;
    color: #16a34a;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    cursor: pointer;
    &:hover {
      background-color: #f0fdf4;
    }
  `,
  resetBtn: css`
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.625rem;
    border: 1px solid #d1d5db;
    background: #fff;
    color: #374151;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    cursor: pointer;
    &:hover {
      background-color: #f3f4f6;
    }
  `,
  membersBtn: css`
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.625rem;
    border: 1px solid #c7d2fe;
    background: #eef2ff;
    color: #4338ca;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    cursor: pointer;
    &:hover {
      background-color: #e0e7ff;
    }
  `,
  actionBtnIcon: css`
    width: 0.75rem;
    height: 0.75rem;
  `,
  emptyState: css`
    padding: 3rem;
    text-align: center;
    color: #6b7280;
  `,

  modalOverlay: css`
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
  `,
  modal: css`
    background-color: #fff;
    border-radius: 0.75rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 28rem;
    overflow: hidden;
  `,
  modalLarge: css`
    background-color: #fff;
    border-radius: 0.75rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 36rem;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,
  modalHeader: css`
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  `,
  modalTitle: css`
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  `,
  modalClose: css`
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    &:hover {
      background-color: #f3f4f6;
      border-radius: 0.25rem;
    }
  `,
  modalCloseIcon: css`
    width: 1.25rem;
    height: 1.25rem;
    color: #6b7280;
  `,
  modalBody: css`
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
    flex: 1;
  `,
  modalSubtext: css`
    margin: 0;
    font-size: 0.8125rem;
    color: #6b7280;
  `,
  emptyHint: css`
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    padding: 1rem;
    background-color: #f9fafb;
    border-radius: 0.5rem;
    text-align: center;
  `,
  modalFooter: css`
    padding: 1rem 1.5rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    background-color: #f9fafb;
    flex-shrink: 0;
  `,

  /* Member picker */
  memberList: css`
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    max-height: 22rem;
    overflow-y: auto;
  `,
  memberRow: css`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    & input {
      cursor: pointer;
      flex-shrink: 0;
    }
    &:hover {
      background-color: #f9fafb;
    }
  `,
  memberInfo: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  `,
  memberName: css`
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
  `,
  memberEmail: css`
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.125rem;
  `,
  otherCohortPill: css`
    flex-shrink: 0;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.6875rem;
    background-color: #fef3c7;
    color: #92400e;
    font-weight: 500;
  `,

  fieldGroup: css`
    display: flex;
    flex-direction: column;
  `,
  label: css`
    font-size: 0.8125rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.375rem;
  `,
  input: css`
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    outline: none;
    box-sizing: border-box;
    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
  `,
  cancelButton: css`
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: #fff;
    color: #374151;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    &:hover {
      background-color: #f3f4f6;
    }
  `,
  submitButton: css`
    padding: 0.5rem 1rem;
    background-color: #059669;
    color: #fff;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    &:hover {
      background-color: #047857;
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
};