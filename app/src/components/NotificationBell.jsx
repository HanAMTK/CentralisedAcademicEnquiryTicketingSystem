import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MessageSquare, ArrowRightLeft, UserCheck, Ticket } from "lucide-react";
import { css } from "@emotion/css";
import { format } from "date-fns";

const API_BASE = "https://w25037936.nuwebspace.co.uk/KV6027/CAETS/api/notifications/index.php";

const typeIcons = {
  ticket_assigned: Ticket,
  new_reply: MessageSquare,
  status_changed: ArrowRightLeft,
  ticket_claimed: UserCheck,
};

const typeColors = {
  ticket_assigned: css`background-color: #eff6ff; color: #2563eb;`,
  new_reply: css`background-color: #faf5ff; color: #7c3aed;`,
  status_changed: css`background-color: #fef9c3; color: #854d0e;`,
  ticket_claimed: css`background-color: #dcfce7; color: #166534;`,
};

const NotificationBell = ({ portal }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

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

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}?action=list`, {
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch {
      // Silently fail
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?action=mark-read`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      if (res.ok) {
        setUnreadCount(0);
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true }))
        );
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await fetch(`${API_BASE}?action=mark-read`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notification_ids: [notification.notification_id] }),
        });
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notification.notification_id
              ? { ...n, is_read: true }
              : n
          )
        );
      } catch {
        // Silently fail
      }
    }

    // Navigate to ticket
    setIsOpen(false);
    navigate(`/${portal}/ticket/${notification.ticket_id}`);
  };

  return (
    <div className={s.wrapper} ref={menuRef}>
      <button className={s.trigger} onClick={handleToggle} title="Notifications">
        <Bell className={s.bellIcon} />
        {unreadCount > 0 && (
          <span className={s.badge}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={s.dropdown}>
          {/* Header */}
          <div className={s.dropdownHeader}>
            <h3 className={s.dropdownTitle}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className={s.markAllButton}
              >
                {loading ? "..." : "Mark all read"}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className={s.list}>
            {notifications.length === 0 ? (
              <div className={s.emptyState}>
                <Bell className={s.emptyIcon} />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((n) => {
                const IconComponent = typeIcons[n.type] || Bell;
                return (
                  <button
                    key={n.notification_id}
                    onClick={() => handleNotificationClick(n)}
                    className={`${s.item} ${!n.is_read ? s.itemUnread : ""}`}
                  >
                    <div className={`${s.iconCircle} ${typeColors[n.type] || ""}`}>
                      <IconComponent className={s.itemIcon} />
                    </div>
                    <div className={s.itemContent}>
                      <p className={s.itemMessage}>{n.message}</p>
                      <div className={s.itemMeta}>
                        <span className={s.itemTicket}>{n.ticket_number}</span>
                        <span className={s.itemTime}>
                          {format(new Date(n.created_at), "dd MMM, HH:mm")}
                        </span>
                      </div>
                    </div>
                    {!n.is_read && <div className={s.unreadDot} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

/* ========================
   Styles
   ======================== */
const s = {
  wrapper: css`
    position: relative;
  `,
  trigger: css`
    position: relative;
    padding: 0.5rem;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 0.5rem;
    transition: background-color 0.2s;
    &:hover { background-color: #f3f4f6; }
  `,
  bellIcon: css`
    width: 1.25rem;
    height: 1.25rem;
    color: #4b5563;
  `,
  badge: css`
    position: absolute;
    top: 0.125rem;
    right: 0.125rem;
    min-width: 1.125rem;
    height: 1.125rem;
    padding: 0 0.25rem;
    background-color: #ef4444;
    color: #ffffff;
    font-size: 0.625rem;
    font-weight: 700;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  `,
  dropdown: css`
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    width: 22rem;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
    z-index: 50;
    overflow: hidden;
  `,
  dropdownHeader: css`
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,
  dropdownTitle: css`
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  `,
  markAllButton: css`
    font-size: 0.75rem;
    color: #2563eb;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    &:hover { text-decoration: underline; }
    &:disabled { color: #9ca3af; cursor: default; }
  `,
  list: css`
    max-height: 24rem;
    overflow-y: auto;
  `,
  emptyState: css`
    padding: 2rem;
    text-align: center;
    color: #9ca3af;
    font-size: 0.875rem;
    & p { margin: 0.5rem 0 0 0; }
  `,
  emptyIcon: css`
    width: 2rem;
    height: 2rem;
    margin: 0 auto;
    color: #d1d5db;
  `,
  item: css`
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border: none;
    border-bottom: 1px solid #f9fafb;
    background: none;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s;
    &:hover { background-color: #f9fafb; }
    &:last-child { border-bottom: none; }
  `,
  itemUnread: css`
    background-color: #fefce8;
    &:hover { background-color: #fef9c3; }
  `,
  iconCircle: css`
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  `,
  itemIcon: css`
    width: 0.875rem;
    height: 0.875rem;
  `,
  itemContent: css`
    flex: 1;
    min-width: 0;
  `,
  itemMessage: css`
    font-size: 0.8125rem;
    color: #374151;
    margin: 0;
    line-height: 1.4;
  `,
  itemMeta: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
  `,
  itemTicket: css`
    font-size: 0.6875rem;
    font-family: monospace;
    color: #6b7280;
  `,
  itemTime: css`
    font-size: 0.6875rem;
    color: #9ca3af;
  `,
  unreadDot: css`
    width: 0.5rem;
    height: 0.5rem;
    background-color: #2563eb;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 0.375rem;
  `,
};