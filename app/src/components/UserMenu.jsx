import React from "react";
import { User } from "lucide-react";
import { css } from "@emotion/css";

const menuButton = css`
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

const UserMenu = ({ portal }) => {
  return (
    <button className={menuButton} title="User menu">
      <User className={icon} />
    </button>
  );
};

export default UserMenu;