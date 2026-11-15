import { useState } from "react";
import { Link } from "react-router-dom";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

import styles from "./index.module.css";

import { EXTERNAL_LINKS } from "@/config/site";
import { useAuthors } from "@/features/AuthorProfile/hook/useAuthors";

import type { Author } from "@/shared/types/content";

interface AuthorBadgeProps {
  id: string;
  author?: Author;
}
const AuthorBadge = ({ id, author }: AuthorBadgeProps) => {
  const [failedAvatar, setFailedAvatar] = useState<string>();
  const { data, error } = useAuthors({ isEnabled: !author });
  const value = author ?? data?.find((item) => item.id === id);
  const label = value?.name || (error ? "著者情報を取得できません" : "著者");
  const children = (
    <>
      {value?.avatar && failedAvatar !== value.avatar ? (
        <img
          src={value.avatar}
          alt=""
          loading="lazy"
          onError={() => setFailedAvatar(value.avatar ?? undefined)}
        />
      ) : (
        <AccountCircleOutlinedIcon
          className={styles["avatar"]}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </>
  );
  return value?.source === "toybox" ? (
    <a
      className={styles["badge"]}
      href={`${EXTERNAL_LINKS.toybox.url}users/${encodeURIComponent(id)}`}
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ) : (
    <Link className={styles["badge"]} to={`/author/${id}`}>
      {children}
    </Link>
  );
};
export default AuthorBadge;
