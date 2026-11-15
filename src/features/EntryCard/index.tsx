import { Link } from "react-router-dom";

import styles from "./index.module.css";

import AuthorBadge from "@/features/AuthorBadge";
import { formatDate } from "@/util/formatDate";
import { formatDateTime } from "@/util/formatDateTime";

import type { EntrySummary } from "@/shared/types/content";

interface EntryCardProps {
  entry: EntrySummary;
}
const EntryCard = ({ entry }: EntryCardProps) => {
  const tags = entry.kind === "blog" ? entry.tags : [];
  const kind = entry.kind;
  const url = `/${kind}/${encodeURIComponent(entry.id)}`;
  return (
    <article className={styles["card"]}>
      <Link className={styles["primary"]} to={url}>
        <div className={styles["image"]}>
          {entry.thumbnail && (
            <img src={entry.thumbnail} alt="" loading="lazy" />
          )}
        </div>
        <h2>{entry.title}</h2>
      </Link>
      <div className={styles["content"]}>
        {tags.length > 0 && (
          <div className={styles["tags"]}>
            {tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/${kind}?tag=${encodeURIComponent(tag.name)}`}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
        {entry.kind === "blog" && (
          <div className={styles["authors"]}>
            {entry.authors.map(({ id, profile }) => (
              <AuthorBadge key={id} id={id} author={profile} />
            ))}
          </div>
        )}
        <p className={styles["digest"]}>{entry.digest}</p>
        <div className={styles["dates"]}>
          {entry.kind === "news" ? (
            <div>投稿日：{formatDate(entry.publishedDate)}</div>
          ) : (
            <>
              <div>作成日：{formatDateTime(entry.createdAt)}</div>
              <div>更新日：{formatDateTime(entry.updatedAt)}</div>
            </>
          )}
        </div>
      </div>
    </article>
  );
};
export default EntryCard;
