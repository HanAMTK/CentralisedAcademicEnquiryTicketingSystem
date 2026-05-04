import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import {
  ArrowLeft,
  Plus,
  Search,
  Edit2,
  X,
  CheckCircle,
  AlertCircle,
  Users,
} from "lucide-react";
import UserMenu from "../../components/UserMenu";

const API_BASE = "https://w25037936.nuwebspace.co.uk/KV6027/CAETS/api/admin/index.php";

const AdminModuleManagement = () => {
  const navigate = useNavigate();

  const [modules, setModules] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newModule, setNewModule] = useState({ module_code: "", module_name: "", lecturer_id: "" });
  const [createLoading, setCreateLoading] = useState(false);

  // Edit modal
  const [editModule, setEditModule] = useState(null);
  const [editData, setEditData] = useState({ module_name: "", lecturer_id: "", is_active: true });
  const [editLoading, setEditLoading] = useState(false);

  // Cohort assignment modal
  const [cohortModalModule, setCohortModalModule] = useState(null);
  const [selectedCohortIds, setSelectedCohortIds] = useState([]);
  const [cohortAssignLoading, setCohortAssignLoading] = useState(false);

  // Feedback
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const fetchModules = async () => {
    try {
      const res = await fetch(`${API_BASE}?action=modules`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setModules(data.modules);
    } catch {
      console.error("Failed to fetch modules");
    } finally {
      setLoading(false);
    }
  };

  const fetchLecturers = async () => {
    try {
      const res = await fetch(`${API_BASE}?action=users`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setLecturers(data.users.filter((u) => u.role === "lecturer" && u.is_active));
      }
    } catch {
      console.error("Failed to fetch lecturers");
    }
  };

  const fetchCohorts = async () => {
    try {
      const res = await fetch(`${API_BASE}?action=cohorts`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setCohorts(data.cohorts);
    } catch {
      console.error("Failed to fetch cohorts");
    }
  };

  useEffect(() => {
    fetchModules();
    fetchLecturers();
    fetchCohorts();
  }, []);

  const filteredModules = modules.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.module_code.toLowerCase().includes(q) ||
      m.module_name.toLowerCase().includes(q) ||
      (m.lecturer_first_name || "").toLowerCase().includes(q) ||
      (m.lecturer_last_name || "").toLowerCase().includes(q);
  });

  const handleCreate = async () => {
    setCreateLoading(true);
    setFeedback({ type: "", message: "" });
    try {
      const res = await fetch(`${API_BASE}?action=create-module`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newModule),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setFeedback({ type: "success", message: "Module created successfully" });
      setShowCreateModal(false);
      setNewModule({ module_code: "", module_name: "", lecturer_id: "" });
      await fetchModules();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async () => {
    setEditLoading(true);
    setFeedback({ type: "", message: "" });
    try {
      const res = await fetch(`${API_BASE}?action=update-module`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_id: editModule.module_id, ...editData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setFeedback({ type: "success", message: "Module updated successfully" });
      setEditModule(null);
      await fetchModules();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setEditLoading(false);
    }
  };

  const openEdit = (mod) => {
    setEditModule(mod);
    setEditData({
      module_name: mod.module_name,
      lecturer_id: mod.lecturer_id || "",
      is_active: !!mod.is_active,
    });
  };

  // Open the cohorts-for-this-module modal
  const openCohortModal = async (mod) => {
    setCohortModalModule(mod);
    setSelectedCohortIds([]);
    setFeedback({ type: "", message: "" });

    try {
      const checks = await Promise.all(
        cohorts.map(async (c) => {
          const res = await fetch(`${API_BASE}?action=cohort-modules&cohort_id=${c.cohort_id}`, {
            credentials: "include",
          });
          const data = await res.json();
          if (res.ok && data.module_ids.includes(mod.module_id)) {
            return c.cohort_id;
          }
          return null;
        })
      );
      setSelectedCohortIds(checks.filter((id) => id !== null));
    } catch {
      // If anything fails, just start with empty selection
    }
  };

  const toggleCohort = (cohortId) => {
    setSelectedCohortIds((prev) =>
      prev.includes(cohortId) ? prev.filter((id) => id !== cohortId) : [...prev, cohortId]
    );
  };

  const handleSaveCohortAssignments = async () => {
    if (!cohortModalModule) return;
    setCohortAssignLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      await Promise.all(
        cohorts.map(async (c) => {
          const res = await fetch(`${API_BASE}?action=cohort-modules&cohort_id=${c.cohort_id}`, {
            credentials: "include",
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);

          const currentIds = new Set(data.module_ids);
          const shouldHave = selectedCohortIds.includes(c.cohort_id);
          const alreadyHas = currentIds.has(cohortModalModule.module_id);

          let newIds;
          if (shouldHave && !alreadyHas) {
            newIds = [...currentIds, cohortModalModule.module_id];
          } else if (!shouldHave && alreadyHas) {
            newIds = [...currentIds].filter((id) => id !== cohortModalModule.module_id);
          } else {
            return; // No change needed for this cohort
          }

          const setRes = await fetch(`${API_BASE}?action=set-cohort-modules`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cohort_id: c.cohort_id,
              module_ids: newIds,
            }),
          });
          const setData = await setRes.json();
          if (!setRes.ok) throw new Error(setData.message);
        })
      );

      setFeedback({ type: "success", message: "Cohort assignments updated" });
      setCohortModalModule(null);
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setCohortAssignLoading(false);
    }
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
            <h1 className={s.pageTitle}>Module Management</h1>
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

          {/* Toolbar */}
          <div className={s.toolbar}>
            <div className={s.searchWrap}>
              <Search className={s.searchIcon} />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={s.searchInput}
              />
            </div>
            <button onClick={() => setShowCreateModal(true)} className={s.createBtn}>
              <Plus className={s.createBtnIcon} />
              Add Module
            </button>
          </div>

          {/* Modules Table */}
          <div className={s.tableCard}>
            {loading ? (
              <div className={s.emptyState}>Loading modules...</div>
            ) : filteredModules.length === 0 ? (
              <div className={s.emptyState}>No modules found</div>
            ) : (
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead className={s.thead}>
                    <tr>
                      <th className={s.th}>Module Code</th>
                      <th className={s.th}>Module Name</th>
                      <th className={s.th}>Assigned Lecturer</th>
                      <th className={s.th}>Status</th>
                      <th className={s.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={s.tbody}>
                    {filteredModules.map((mod) => (
                      <tr key={mod.module_id} className={s.row}>
                        <td className={s.td}>
                          <span className={s.moduleCode}>{mod.module_code}</span>
                        </td>
                        <td className={s.td}>
                          <span className={s.moduleName}>{mod.module_name}</span>
                        </td>
                        <td className={s.td}>
                          <span className={s.lecturerName}>
                            {mod.lecturer_first_name
                              ? `${mod.lecturer_first_name} ${mod.lecturer_last_name}`
                              : "Unassigned"}
                          </span>
                          {mod.lecturer_email && (
                            <span className={s.lecturerEmail}>{mod.lecturer_email}</span>
                          )}
                        </td>
                        <td className={s.td}>
                          <span className={mod.is_active ? s.activeBadge : s.inactiveBadge}>
                            {mod.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className={s.td}>
                          <div className={s.actions}>
                            <button onClick={() => openEdit(mod)} className={s.editBtn}>
                              <Edit2 className={s.editBtnIcon} />
                              Edit
                            </button>
                            <button onClick={() => openCohortModal(mod)} className={s.cohortBtn}>
                              <Users className={s.editBtnIcon} />
                              Cohorts
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
        </div>
      </div>

      {/* Create Module Modal */}
      {showCreateModal && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>Add New Module</h2>
              <button onClick={() => setShowCreateModal(false)} className={s.modalClose}>
                <X className={s.modalCloseIcon} />
              </button>
            </div>
            <div className={s.modalBody}>
              <div className={s.fieldGroup}>
                <label className={s.label}>Module Code</label>
                <input type="text" value={newModule.module_code} onChange={(e) => setNewModule({ ...newModule, module_code: e.target.value })} placeholder="e.g. KV6027" className={s.input} />
              </div>
              <div className={s.fieldGroup}>
                <label className={s.label}>Module Name</label>
                <input type="text" value={newModule.module_name} onChange={(e) => setNewModule({ ...newModule, module_name: e.target.value })} placeholder="e.g. Individual Computing Project" className={s.input} />
              </div>
              <div className={s.fieldGroup}>
                <label className={s.label}>Assign Lecturer</label>
                <select value={newModule.lecturer_id} onChange={(e) => setNewModule({ ...newModule, lecturer_id: e.target.value })} className={s.input}>
                  <option value="">Select a lecturer</option>
                  {lecturers.map((l) => (
                    <option key={l.user_id} value={l.user_id}>
                      {l.first_name} {l.last_name} ({l.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={s.modalFooter}>
              <button onClick={() => setShowCreateModal(false)} className={s.cancelButton}>Cancel</button>
              <button
                onClick={handleCreate}
                disabled={createLoading || !newModule.module_code || !newModule.module_name || !newModule.lecturer_id}
                className={s.submitButton}
              >
                {createLoading ? "Creating..." : "Create Module"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Module Modal */}
      {editModule && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>Edit {editModule.module_code}</h2>
              <button onClick={() => setEditModule(null)} className={s.modalClose}>
                <X className={s.modalCloseIcon} />
              </button>
            </div>
            <div className={s.modalBody}>
              <div className={s.fieldGroup}>
                <label className={s.label}>Module Name</label>
                <input type="text" value={editData.module_name} onChange={(e) => setEditData({ ...editData, module_name: e.target.value })} className={s.input} />
              </div>
              <div className={s.fieldGroup}>
                <label className={s.label}>Assign Lecturer</label>
                <select value={editData.lecturer_id} onChange={(e) => setEditData({ ...editData, lecturer_id: e.target.value })} className={s.input}>
                  <option value="">Select a lecturer</option>
                  {lecturers.map((l) => (
                    <option key={l.user_id} value={l.user_id}>
                      {l.first_name} {l.last_name} ({l.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className={s.fieldGroup}>
                <label className={s.label}>Status</label>
                <select value={editData.is_active ? "true" : "false"} onChange={(e) => setEditData({ ...editData, is_active: e.target.value === "true" })} className={s.input}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className={s.modalFooter}>
              <button onClick={() => setEditModule(null)} className={s.cancelButton}>Cancel</button>
              <button onClick={handleEdit} disabled={editLoading} className={s.submitButton}>
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cohort Assignment Modal */}
      {cohortModalModule && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>Cohorts for {cohortModalModule.module_code}</h2>
              <button onClick={() => setCohortModalModule(null)} className={s.modalClose}>
                <X className={s.modalCloseIcon} />
              </button>
            </div>
            <div className={s.modalBody}>
              <p className={s.modalSubtext}>
                Select which cohorts have access to this module. Students in selected cohorts will be able to file tickets against this module.
              </p>
              {cohorts.length === 0 ? (
                <p className={s.emptyHint}>No cohorts exist yet. Create cohorts on the User Management page.</p>
              ) : (
                <div className={s.checkboxList}>
                  {cohorts.map((c) => (
                    <label key={c.cohort_id} className={s.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={selectedCohortIds.includes(c.cohort_id)}
                        onChange={() => toggleCohort(c.cohort_id)}
                      />
                      <div>
                        <span className={s.checkboxName}>{c.name}</span>
                        {c.description && <span className={s.checkboxDesc}>{c.description}</span>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className={s.modalFooter}>
              <button onClick={() => setCohortModalModule(null)} className={s.cancelButton}>Cancel</button>
              <button
                onClick={handleSaveCohortAssignments}
                disabled={cohortAssignLoading || cohorts.length === 0}
                className={s.submitButton}
              >
                {cohortAssignLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModuleManagement;

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
  toolbar: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
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
  moduleCode: css`
    font-weight: 600;
    color: #111827;
    font-family: monospace;
  `,
  moduleName: css`
    color: #374151;
  `,
  lecturerName: css`
    font-weight: 500;
    color: #111827;
    display: block;
  `,
  lecturerEmail: css`
    font-size: 0.75rem;
    color: #6b7280;
    display: block;
    margin-top: 0.125rem;
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
  actions: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `,
  editBtn: css`
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
  cohortBtn: css`
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
  editBtnIcon: css`
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
  modalHeader: css`
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
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
  checkboxList: css`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 18rem;
    overflow-y: auto;
  `,
  checkboxRow: css`
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
    padding: 0.625rem 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    & input {
      margin-top: 0.25rem;
      cursor: pointer;
    }
    &:hover {
      background-color: #f9fafb;
    }
  `,
  checkboxName: css`
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
  `,
  checkboxDesc: css`
    display: block;
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.125rem;
  `,
  modalFooter: css`
    padding: 1rem 1.5rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    background-color: #f9fafb;
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