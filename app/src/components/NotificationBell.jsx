import React from "react";
import { Bell } from "lucide-react";
import { css } from "@emotion/css";

const bellButton = css`
  position: relative;
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
  &:hover {
    background-color: #f3f4f6;
  }
`;

const icon = css`
  width: 1.25rem;
  height: 1.25rem;
  color: #4b5563;
`;

const NotificationBell = ({ portal, userId }) => {
  return (
    <button className={bellButton} title="Notifications">
      <Bell className={icon} />
    </button>
  );
};

export default NotificationBell;