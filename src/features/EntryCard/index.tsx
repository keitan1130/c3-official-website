import { Link } from "react-router-dom";

import styles from "./index.module.css";

import AuthorBadge from "@/features/AuthorBadge";
import { getTag } from "@/util/contentRepository";
import { formatDateTime } from "@/util/formatDateTime";

import type { BlogEntry, Entry } from "@/shared/types/content";

interface EntryCardProps {
  entry: Entry | BlogEntry;
  kind: "news" | "blog";
}
const EntryCard = ({ entry, kind }: EntryCardProps) => {
  const blog = "source" in entry ? entry : undefined;
  const url = `/${kind}/${entry.id}${blog ? `?source=${blog.source}` : ""}`;
  const tags =
    blog?.tags ??
    entry.tagIds.flatMap((id) => {
      const tag = getTag(id);
      return tag ? [tag] : [];
    });
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
        <div className={styles["authors"]}>
          {entry.authorIds.map((id) => (
            <AuthorBadge
              key={id}
              id={id}
              author={blog?.authors.find((author) => author.id === id)}
            />
          ))}
        </div>
        <p className={styles["digest"]}>{entry.digest}</p>
        <div className={styles["dates"]}>
          <div>作成日：{formatDateTime(entry.createdAt)}</div>
          <div>更新日：{formatDateTime(entry.updatedAt)}</div>
        </div>
      </div>
    </article>
  );
};
export default EntryCard;
