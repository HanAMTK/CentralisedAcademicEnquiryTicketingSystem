import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { css } from "@emotion/css";

const spinner = css`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 1rem;
  color: #6b7280;
`;

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className={spinner}>Loading...</div>;
  }

  // Not logged in — redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Must change password — redirect to change password page
  if (user.must_change_password) {
    return <Navigate to="/change-password" replace />;
  }

  // Role check — if allowedRoles is provided, verify user has permission
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own portal
    const portalPath = user.role === "lecturer" ? "/lecturer" : "/student";
    return <Navigate to={portalPath} replace />;
  }

  return children;
};

export default ProtectedRoute;