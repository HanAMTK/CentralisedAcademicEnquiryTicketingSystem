import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { css } from "@emotion/css";
import { useAuth } from "../../context/AuthContext";
import { Lock, ShieldCheck, AlertCircle, CheckCircle } from "lucide-react";

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user, changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Not logged in — redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isForced = user.must_change_password;

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const message = await changePassword(currentPassword, newPassword, confirmPassword);
      setSuccess(message);

      // Redirect to portal after short delay
      setTimeout(() => {
        const path = user.role === "lecturer" ? "/lecturer" : user.role === "admin" ? "/admin" : "/student";
        navigate(path, { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.card}>
        {/* Header */}
        <div className={s.header}>
          <div className={s.logoCircle}>
            <ShieldCheck className={s.logoIcon} />
          </div>
          <h1 className={s.title}>
            {isForced ? "Set New Password" : "Change Password"}
          </h1>
          <p className={s.subtitle}>
            {isForced
              ? "You must change your default password before continuing"
              : "Update your account password"}
          </p>
        </div>

        {/* Forced change notice */}
        {isForced && (
          <div className={s.noticeBox}>
            <AlertCircle className={s.noticeIcon} />
            <span>This is your first login. Please create a new password to secure your account.</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={s.errorBox}>
            <AlertCircle className={s.errorIcon} />
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className={s.successBox}>
            <CheckCircle className={s.successIcon} />
            <span>{success} Redirecting...</span>
          </div>
        )}

        {/* Form */}
        <div>
          <div className={s.fieldGroup}>
            <label className={s.label}>Current Password</label>
            <div className={s.inputWrapper}>
              <Lock className={s.inputIcon} />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className={s.input}
              />
            </div>
          </div>

          <div className={s.fieldGroup}>
            <label className={s.label}>New Password</label>
            <div className={s.inputWrapper}>
              <Lock className={s.inputIcon} />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={s.input}
              />
            </div>
          </div>

          <div className={s.fieldGroup}>
            <label className={s.label}>Confirm New Password</label>
            <div className={s.inputWrapper}>
              <Lock className={s.inputIcon} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={s.input}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
            className={s.submitButton}
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </div>

        {/* Back to portal (only if not forced) */}
        {!isForced && (
          <div className={s.footer}>
            <button
              onClick={() => navigate(-1)}
              className={s.backLink}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;

/* ========================
   Styles
   ======================== */
const s = {
  page: css`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f9fafb;
    padding: 1rem;
  `,
  card: css`
    width: 100%;
    max-width: 26rem;
    background-color: #ffffff;
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06);
    padding: 2.5rem;
  `,
  header: css`
    text-align: center;
    margin-bottom: 2rem;
  `,
  logoCircle: css`
    width: 3.5rem;
    height: 3.5rem;
    margin: 0 auto 1rem;
    background: linear-gradient(to right, #3b82f6, #2563eb);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  logoIcon: css`
    width: 1.5rem;
    height: 1.5rem;
    color: #ffffff;
  `,
  title: css`
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.5rem 0;
  `,
  subtitle: css`
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  `,
  noticeBox: css`
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 0.5rem;
    color: #1e40af;
    font-size: 0.8125rem;
    line-height: 1.4;
  `,
  noticeIcon: css`
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
  `,
  errorBox: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    color: #991b1b;
    font-size: 0.875rem;
  `,
  errorIcon: css`
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  `,
  successBox: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 0.5rem;
    color: #166534;
    font-size: 0.875rem;
  `,
  successIcon: css`
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  `,
  fieldGroup: css`
    margin-bottom: 1.25rem;
  `,
  label: css`
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.375rem;
  `,
  inputWrapper: css`
    position: relative;
  `,
  inputIcon: css`
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1.125rem;
    height: 1.125rem;
    color: #9ca3af;
  `,
  input: css`
    width: 100%;
    padding: 0.625rem 0.75rem 0.625rem 2.5rem;
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
    &::placeholder {
      color: #9ca3af;
    }
  `,
  submitButton: css`
    width: 100%;
    padding: 0.75rem;
    margin-top: 0.5rem;
    background: linear-gradient(to right, #3b82f6, #2563eb);
    color: #ffffff;
    font-size: 0.875rem;
    font-weight: 600;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
  footer: css`
    text-align: center;
    margin-top: 1.5rem;
  `,
  backLink: css`
    font-size: 0.875rem;
    color: #2563eb;
    background: none;
    border: none;
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  `,
};