import { Link } from "react-router-dom";

import styles from "./index.module.css";

import { PAGES } from "@/config/site";
import AuthorBadge from "@/features/AuthorBadge";
import BodyContent from "@/features/BodyContent";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import PageMeta from "@/shared/ui/PageMeta";
import Paper from "@/shared/ui/Paper";
import { formatDate } from "@/util/formatDate";
import { formatDateTime } from "@/util/formatDateTime";

import type { Entry, EntrySummary } from "@/shared/types/content";

interface EntryDetailProps {
  entry: Entry;
  recent: EntrySummary[];
}
const EntryDetail = ({ entry, recent }: EntryDetailProps) => {
  const kind = entry.kind;
  const label = PAGES[kind].title;
  const tags = entry.kind === "blog" ? entry.tags : [];
  return (
    <section className={styles["entry"]}>
      <PageMeta
        title={entry.title}
        description={entry.digest}
        image={entry.thumbnail}
      />
      <Breadcrumbs
        items={[{ label, url: PAGES[kind].path }, { label: entry.title }]}
      />
      <div className={styles["layout"]}>
        <Paper className={styles["article"]}>
          <article>
            {entry.thumbnail && (
              <div className={styles["hero"]}>
                <img src={entry.thumbnail} alt={`${entry.title}のサムネイル`} />
              </div>
            )}
            <h1>{entry.title}</h1>
            {tags.length > 0 && (
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
            )}
            {entry.kind === "blog" && (
              <div className={styles["authors"]}>
                ユーザー：
                {entry.authors.map(({ id, profile }) => (
                  <AuthorBadge key={id} id={id} author={profile} />
                ))}
              </div>
            )}
            <p className={styles["date"]}>
              投稿日：
              {entry.kind === "news"
                ? formatDate(entry.publishedDate)
                : formatDateTime(entry.createdAt)}
            </p>
            {entry.kind === "blog" && (
              <p className={styles["date"]}>
                更新日：{formatDateTime(entry.updatedAt)}
              </p>
            )}
            <div className={styles["body"]}>
              <BodyContent load={entry.body} />
            </div>
          </article>
        </Paper>
        <aside className={styles["recent"]} aria-label={`最近の${label}`}>
          <h2>最近の{label}</h2>
          <div className={styles["recent-grid"]}>
            {recent
              .filter((item) => item.id !== entry.id)
              .slice(0, 4)
              .map((item) => (
                <Link
                  key={item.id}
                  to={`/${kind}/${encodeURIComponent(item.id)}`}
                >
                  <span className={styles["recent-thumbnail"]}>
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt="" loading="lazy" />
                    )}
                  </span>
                  <span className={styles["recent-title"]}>{item.title}</span>
                </Link>
              ))}
          </div>
        </aside>
      </div>
    </section>
  );
};
export default EntryDetail;
