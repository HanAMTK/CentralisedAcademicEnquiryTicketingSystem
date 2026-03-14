import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, ChevronDown } from "lucide-react";
import { css } from "@emotion/css";
import { useAuth } from "../context/AuthContext";

const UserMenu = ({ portal }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const handleProfile = () => {
    setIsOpen(false);
    navigate(`/${portal}/profile`);
  };

  return (
    <div className={s.wrapper} ref={menuRef}>
      <button
        className={s.trigger}
        onClick={() => setIsOpen(!isOpen)}
        title="User menu"
      >
        <div className={s.avatar}>
          <User className={s.avatarIcon} />
        </div>
        {user && (
          <span className={s.userName}>
            {user.first_name} {user.last_name}
          </span>
        )}
        <ChevronDown className={`${s.chevron} ${isOpen ? s.chevronOpen : ""}`} />
      </button>

      {isOpen && (
        <div className={s.dropdown}>
          {/* User info */}
          {user && (
            <div className={s.userInfo}>
              <p className={s.userFullName}>
                {user.first_name} {user.last_name}
              </p>
              <p className={s.userEmail}>{user.email}</p>
            </div>
          )}

          <div className={s.divider} />

          {/* Menu items */}
          <button className={s.menuItem} onClick={handleProfile}>
            <User className={s.menuIcon} />
            <span>Profile</span>
          </button>

          <div className={s.divider} />

          <button className={s.menuItemDanger} onClick={handleLogout}>
            <LogOut className={s.menuIcon} />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;

/* ========================
   Styles
   ======================== */
const s = {
  wrapper: css`
    position: relative;
  `,
  trigger: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.625rem;
    border: 1px solid #e5e7eb;
    background-color: #ffffff;
    cursor: pointer;
    border-radius: 0.5rem;
    transition: all 0.2s;
    &:hover {
      background-color: #f9fafb;
      border-color: #d1d5db;
    }
  `,
  avatar: css`
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background-color: #eff6ff;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  avatarIcon: css`
    width: 1rem;
    height: 1rem;
    color: #3b82f6;
  `,
  userName: css`
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    @media (max-width: 640px) {
      display: none;
    }
  `,
  chevron: css`
    width: 0.875rem;
    height: 0.875rem;
    color: #9ca3af;
    transition: transform 0.2s;
  `,
  chevronOpen: css`
    transform: rotate(180deg);
  `,
  dropdown: css`
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    width: 16rem;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
    z-index: 50;
    overflow: hidden;
  `,
  userInfo: css`
    padding: 0.75rem 1rem;
  `,
  userFullName: css`
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  `,
  userEmail: css`
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0.125rem 0 0 0;
  `,
  divider: css`
    height: 1px;
    background-color: #f3f4f6;
  `,
  menuItem: css`
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.625rem 1rem;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 0.875rem;
    color: #374151;
    transition: background-color 0.15s;
    text-align: left;
    &:hover {
      background-color: #f9fafb;
    }
  `,
  menuItemDanger: css`
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.625rem 1rem;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 0.875rem;
    color: #dc2626;
    transition: background-color 0.15s;
    text-align: left;
    &:hover {
      background-color: #fef2f2;
    }
  `,
  menuIcon: css`
    width: 1rem;
    height: 1rem;
  `,
};