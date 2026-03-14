import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import { useAuth } from "../../context/AuthContext";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect
  if (user && !user.must_change_password) {
    const path = user.role === "lecturer" ? "/lecturer" : "/student";
    navigate(path, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const loggedInUser = await login(email, password);

      if (loggedInUser.must_change_password) {
        navigate("/change-password", { replace: true });
      } else {
        const path = loggedInUser.role === "lecturer" ? "/lecturer" : "/student";
        navigate(path, { replace: true });
      }
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
          <h1 className={s.title}>Welcome</h1>
          <p className={s.subtitle}>Sign in to the Academic Enquiry System</p>
        </div>

        {/* Error */}
        {error && (
          <div className={s.errorBox}>
            <AlertCircle className={s.errorIcon} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <div onSubmit={handleSubmit}>
          <div className={s.fieldGroup}>
            <label className={s.label}>Email Address</label>
            <div className={s.inputWrapper}>
              <Mail className={s.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className={s.input}
              />
            </div>
          </div>

          <div className={s.fieldGroup}>
            <label className={s.label}>Password</label>
            <div className={s.inputWrapper}>
              <Lock className={s.inputIcon} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className={s.input}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !email || !password}
            className={s.submitButton}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </div>

        {/* Footer link */}
        <div className={s.footer}>
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className={s.link}
          >
            Forgot your password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

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
  link: css`
    font-size: 0.875rem;
    color: #2563eb;
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    &:hover {
      text-decoration: underline;
    }
  `,
};