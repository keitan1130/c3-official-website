import { Link } from "react-router-dom";

import Avatar from "../Avatar";
import styles from "./index.module.css";

type UserButtonProps = {
  to: string;
  isExternal?: boolean;
  displayName: string;
  avatarURL?: string;
  size?: "compact" | "default";
};

const UserButton = ({
  to,
  isExternal = false,
  displayName,
  avatarURL,
  size = "default",
}: UserButtonProps) => {
  const children = (
    <>
      <Avatar
        avatarURL={avatarURL}
        alt={`${displayName}のアバター`}
        size={size === "compact" ? "small" : "default"}
      />
      <span className={styles["display-name"]}>{displayName}</span>
    </>
  );
  const props = {
    className: styles["user-button"],
    "data-size": size,
    "aria-label": `${displayName}のユーザーページを開く`,
  };
  return isExternal ? (
    <a {...props} href={to} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <Link {...props} to={to}>
      {children}
    </Link>
  );
};

export default UserButton;
