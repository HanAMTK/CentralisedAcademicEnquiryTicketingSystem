import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const API_BASE = "https://w25037936.nuwebspace.co.uk/KV6027/CAETS/api/auth/index.php";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on app load
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch(`${API_BASE}?action=session`, {
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}?action=login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}?action=logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Logout even if request fails
    }
    setUser(null);
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    const res = await fetch(`${API_BASE}?action=change-password`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Password change failed");
    }

    // Update user state to reflect password changed
    setUser((prev) => ({ ...prev, must_change_password: false }));
    return data.message;
  };

  const forgotPassword = async (email) => {
    const res = await fetch(`${API_BASE}?action=forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data.message;
  };

  const resetPassword = async (token, newPassword, confirmPassword) => {
    const res = await fetch(`${API_BASE}?action=reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Reset failed");
    }

    return data.message;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        changePassword,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};