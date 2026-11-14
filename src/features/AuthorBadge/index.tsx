import { Link } from "react-router-dom";
import useSWRImmutable from "swr/immutable";

import styles from "./index.module.css";

import { getAuthors } from "@/util/authorRepository";
import { CONTENT } from "@/util/contentRepository";

import type { Author } from "@/shared/types/content";

interface AuthorBadgeProps {
  id: string;
  author?: Author;
}
const AuthorBadge = ({ id, author }: AuthorBadgeProps) => {
  const { data, error } = useSWRImmutable(
    author ? null : "authors",
    () => getAuthors(),
    { shouldRetryOnError: false },
  );
  const value = author ?? data?.find((item) => item.id === id);
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
