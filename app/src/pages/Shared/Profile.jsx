import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Lock,
  CheckCircle,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../../components/NotificationBell";
import UserMenu from "../../components/UserMenu";

const TICKETS_API = "https://w25037936.nuwebspace.co.uk/KV6027/CAETS/api/tickets/index.php";

const Profile = ({ portal }) => {
  const navigate = useNavigate();
  const { user, changePassword } = useAuth();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  const isLecturer = portal === "lecturer";
  const accentColor = isLecturer ? "#4f46e5" : "#2563eb";
  const accentHover = isLecturer ? "#4338ca" : "#1d4ed8";
  const portalPath = isLecturer ? "/lecturer" : "/student";

  // Fetch lecturer's assigned modules
  useEffect(() => {
    if (!isLecturer) return;

    const fetchModules = async () => {
      setModulesLoading(true);
      try {
        const res = await fetch(`${TICKETS_API}?action=my-modules`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.modules) {
          setModules(data.modules);
        }
      } catch {
        // Silently fail - modules section just won't show
      } finally {
        setModulesLoading(false);
      }
    };
    fetchModules();
  }, [isLecturer]);

  const handlePasswordSubmit = async () => {
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const message = await changePassword(currentPassword, newPassword, confirmPassword);
      setSuccess(message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setShowPasswordForm(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabel = {
    student: "Student",
    lecturer: "Lecturer",
    admin: "Administrator",
  };

  return (
    <div className={s.pageWrapper}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerInner}>
          <div className={s.headerLeft}>
            <button onClick={() => navigate(portalPath)} className={s.backButton}>
              <ArrowLeft className={s.backIcon} />
            </button>
            <div>
              <h1 className={s.pageTitle}>My Profile</h1>
            </div>
          </div>
          <div className={s.headerRight}>
            <NotificationBell portal={portal} />
            <UserMenu portal={portal} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={s.scrollArea}>
        <div className={s.contentWrapper}>
          {/* Profile Card */}
          <div className={s.profileCard}>
            <div className={s.avatarSection}>
              <div
                className={s.avatarCircle}
                style={{ backgroundColor: accentColor }}
              >
                <User className={s.avatarIcon} />
              </div>
              <div>
                <h2 className={s.userName}>
                  {user.first_name} {user.last_name}
                </h2>
                <span
                  className={s.roleBadge}
                  style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                >
                  {roleLabel[user.role] || user.role}
                </span>
              </div>
            </div>

            <div className={s.divider} />

            {/* Info Fields */}
            <div className={s.infoList}>
              <div className={s.infoRow}>
                <div className={s.infoLabel}>
                  <User className={s.infoIcon} />
                  <span>Full Name</span>
                </div>
                <p className={s.infoValue}>
                  {user.first_name} {user.last_name}
                </p>
              </div>

              <div className={s.infoRow}>
                <div className={s.infoLabel}>
                  <Mail className={s.infoIcon} />
                  <span>Email Address</span>
                </div>
                <p className={s.infoValue}>{user.email}</p>
              </div>

              <div className={s.infoRow}>
                <div className={s.infoLabel}>
                  <Shield className={s.infoIcon} />
                  <span>Role</span>
                </div>
                <p className={s.infoValue}>{roleLabel[user.role] || user.role}</p>
              </div>
            </div>
          </div>

          {/* Assigned Modules — lecturer only */}
          {isLecturer && (
            <div className={s.modulesCard}>
              <div className={s.modulesHeader}>
                <BookOpen className={s.modulesIcon} />
                <div>
                  <h3 className={s.modulesTitle}>Assigned Modules</h3>
                  <p className={s.modulesSubtitle}>
                    Modules you are responsible for
                  </p>
                </div>
              </div>

              {modulesLoading ? (
                <p className={s.modulesEmpty}>Loading modules...</p>
              ) : modules.length === 0 ? (
                <p className={s.modulesEmpty}>You have no modules assigned.</p>
              ) : (
                <ul className={s.modulesList}>
                  {modules.map((m) => (
                    <li key={m.module_id} className={s.moduleItem}>
                      <span className={s.moduleCode}>{m.module_code}</span>
                      <span className={s.moduleName}>{m.module_name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Change Password Section */}
          <div className={s.passwordCard}>
            <div className={s.passwordHeader}>
              <div className={s.passwordHeaderLeft}>
                <Lock className={s.passwordIcon} />
                <div>
                  <h3 className={s.passwordTitle}>Password</h3>
                  <p className={s.passwordSubtitle}>Update your account password</p>
                </div>
              </div>
              {!showPasswordForm && (
                <button
                  onClick={() => {
                    setShowPasswordForm(true);
                    setError("");
                    setSuccess("");
                  }}
                  className={s.changePasswordButton}
                  style={{ backgroundColor: accentColor }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = accentHover)}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = accentColor)}
                >
                  Change Password
                </button>
              )}
            </div>

            {showPasswordForm && (
              <div className={s.passwordForm}>
                {error && (
                  <div className={s.errorBox}>
                    <AlertCircle className={s.alertIcon} />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className={s.successBox}>
                    <CheckCircle className={s.alertIcon} />
                    <span>{success}</span>
                  </div>
                )}

                <div className={s.fieldGroup}>
                  <label className={s.label}>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className={s.input}
                  />
                </div>

                <div className={s.fieldGroup}>
                  <label className={s.label}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={s.input}
                  />
                </div>

                <div className={s.fieldGroup}>
                  <label className={s.label}>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={s.input}
                  />
                </div>

                <div className={s.formActions}>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setError("");
                      setSuccess("");
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className={s.cancelButton}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordSubmit}
                    disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
                    className={s.submitButton}
                    style={{ backgroundColor: accentColor }}
                    onMouseEnter={(e) => {
                      if (!e.target.disabled) e.target.style.backgroundColor = accentHover;
                    }}
                    onMouseLeave={(e) => {
                      if (!e.target.disabled) e.target.style.backgroundColor = accentColor;
                    }}
                  >
                    {isSubmitting ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

/* ========================
   Styles
   ======================== */
const s = {
  pageWrapper: css`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #f9fafb;
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
    flex: none;
  `,
  contentWrapper: css`
    max-width: 80rem;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    @media (min-width: 1024px) {
      padding-left: 2rem;
      padding-right: 2rem;
    }
  `,

  /* Profile Card */
  profileCard: css`
    background-color: #ffffff;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
  `,
  avatarSection: css`
    display: flex;
    align-items: center;
    gap: 1rem;
  `,
  avatarCircle: css`
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  `,
  avatarIcon: css`
    width: 1.75rem;
    height: 1.75rem;
    color: #ffffff;
  `,
  userName: css`
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.375rem 0;
  `,
  roleBadge: css`
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
  `,
  divider: css`
    height: 1px;
    background-color: #f3f4f6;
    margin: 1.25rem 0;
  `,
  infoList: css`
    display: flex;
    flex-direction: column;
    gap: 1rem;
  `,
  infoRow: css`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  `,
  infoLabel: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: #6b7280;
  `,
  infoIcon: css`
    width: 0.875rem;
    height: 0.875rem;
  `,
  infoValue: css`
    font-size: 0.9375rem;
    font-weight: 500;
    color: #111827;
    margin: 0;
    padding-left: 1.375rem;
  `,

  /* Modules Card */
  modulesCard: css`
    background-color: #ffffff;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
  `,
  modulesHeader: css`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  `,
  modulesIcon: css`
    width: 1.25rem;
    height: 1.25rem;
    color: #6b7280;
  `,
  modulesTitle: css`
    font-size: 0.9375rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  `,
  modulesSubtitle: css`
    font-size: 0.8125rem;
    color: #6b7280;
    margin: 0.125rem 0 0 0;
  `,
  modulesEmpty: css`
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    padding: 0.5rem 0;
  `,
  modulesList: css`
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  `,
  moduleItem: css`
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.75rem 1rem;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  `,
  moduleCode: css`
    font-family: monospace;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #4f46e5;
    background-color: #eef2ff;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    flex-shrink: 0;
  `,
  moduleName: css`
    font-size: 0.875rem;
    color: #374151;
  `,

  /* Password Card */
  passwordCard: css`
    background-color: #ffffff;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
  `,
  passwordHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  `,
  passwordHeaderLeft: css`
    display: flex;
    align-items: center;
    gap: 0.75rem;
  `,
  passwordIcon: css`
    width: 1.25rem;
    height: 1.25rem;
    color: #6b7280;
  `,
  passwordTitle: css`
    font-size: 0.9375rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  `,
  passwordSubtitle: css`
    font-size: 0.8125rem;
    color: #6b7280;
    margin: 0.125rem 0 0 0;
  `,
  changePasswordButton: css`
    padding: 0.5rem 1rem;
    color: #ffffff;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  `,
  passwordForm: css`
    margin-top: 1.25rem;
    padding-top: 1.25rem;
    border-top: 1px solid #f3f4f6;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  `,
  errorBox: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    color: #991b1b;
    font-size: 0.8125rem;
  `,
  successBox: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 0.5rem;
    color: #166534;
    font-size: 0.8125rem;
  `,
  alertIcon: css`
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
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
    transition: border-color 0.2s, box-shadow 0.2s;
    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
    &::placeholder { color: #9ca3af; }
  `,
  formActions: css`
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 0.5rem;
  `,
  cancelButton: css`
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background-color: #ffffff;
    color: #374151;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover { background-color: #f3f4f6; }
  `,
  submitButton: css`
    padding: 0.5rem 1rem;
    color: #ffffff;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
};