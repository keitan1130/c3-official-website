import { Link } from "react-router-dom";
import useSWR from "swr";

import styles from "./index.module.css";

import { getAuthor } from "@/util/authorRepository";
import { CONTENT } from "@/util/contentRepository";

import type { Author } from "@/shared/types/content";

interface AuthorBadgeProps {
  id: string;
  author?: Author;
}
const AuthorBadge = ({ id, author }: AuthorBadgeProps) => {
  const { data, error } = useSWR(
    author ? null : ["author", id],
    () => getAuthor(id),
    { shouldRetryOnError: false },
  );
  const value = author ?? data;
  const label = value?.name || (error ? "著者情報を取得できません" : "著者");
  const children = (
    <>
      {value?.avatar && <img src={value.avatar} alt="" loading="lazy" />}
      <span>{label}</span>
    </>
  );
  return value?.source === "toybox" ? (
    <a
      className={styles["badge"]}
      href={`${CONTENT.site.worksUrl}users/${encodeURIComponent(id)}`}
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
