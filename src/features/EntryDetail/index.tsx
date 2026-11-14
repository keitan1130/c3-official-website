import { Link } from "react-router-dom";

import styles from "./index.module.css";

import AuthorBadge from "@/features/AuthorBadge";
import BodyContent from "@/features/BodyContent";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import PageMeta from "@/shared/ui/PageMeta";
import Paper from "@/shared/ui/Paper";
import { getTag } from "@/util/contentRepository";
import { formatDateTime } from "@/util/formatDateTime";

import type { BlogEntry, Entry } from "@/shared/types/content";

interface EntryDetailProps {
  entry: Entry | BlogEntry;
  kind: "news" | "blog";
  recent: (Entry | BlogEntry)[];
}
const EntryDetail = ({ entry, kind, recent }: EntryDetailProps) => {
  const label = kind === "news" ? "お知らせ" : "ブログ";
  const blog = "source" in entry ? entry : undefined;
  const tags =
    blog?.tags ??
    entry.tagIds.flatMap((id) => {
      const tag = getTag(id);
      return tag ? [tag] : [];
    });
  return (
    <section className={styles["entry"]}>
      <PageMeta
        title={entry.title}
        description={entry.digest}
        image={entry.thumbnail}
      />
      <div className={styles["heading"]}>
        <Breadcrumbs
          items={[{ label, url: `/${kind}` }, { label: entry.title }]}
        />
        <div className={styles["label"]}>C3 {label}</div>
      </div>
      <div
        className={`${styles["columns"]}${kind === "blog" ? ` ${styles["blog-columns"]}` : ""}`}
      >
        <Paper className={styles["article"]}>
          <article>
            {entry.thumbnail && (
              <div className={styles["hero"]}>
                <img src={entry.thumbnail} alt={`${entry.title}のサムネイル`} />
              </div>
            )}
            <h1>{entry.title}</h1>
            <div className={styles["tags"]}>
              タグ：
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
              ユーザー：
              {entry.authorIds.map((id) => (
                <AuthorBadge
                  key={id}
                  id={id}
                  author={blog?.authors.find((author) => author.id === id)}
                />
              ))}
            </div>
            <p className={styles["date"]}>
              投稿日：{formatDateTime(entry.createdAt)}
            </p>
            <p className={styles["date"]}>
              更新日：{formatDateTime(entry.updatedAt)}
            </p>
            <div className={styles["body"]}>
              <BodyContent load={entry.body} />
            </div>
          </article>
        </Paper>
        <aside className={styles["sidebar"]} aria-label={`最近の${label}`}>
          <h2>最近の{label}</h2>
          {recent
            .filter((item) => item.id !== entry.id)
            .slice(0, 3)
            .map((item) => (
              <Link
                key={item.id}
                to={`/${kind}/${encodeURIComponent(item.id)}`}
              >
                {item.thumbnail && (
                  <img src={item.thumbnail} alt="" loading="lazy" />
                )}
                <span>{item.title}</span>
              </Link>
            ))}
        </aside>
      </div>
    </section>
  );
};
export default EntryDetail;
