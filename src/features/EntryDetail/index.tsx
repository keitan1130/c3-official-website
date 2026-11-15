import { Link } from "react-router-dom";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";

import styles from "./index.module.css";

import { PAGES } from "@/config/site";
import AuthorBadge from "@/features/AuthorBadge";
import BodyContent from "@/features/BodyContent";
import EntryDates from "@/features/EntryDates";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import LoadingImage from "@/shared/ui/LoadingImage";
import PageMeta from "@/shared/ui/PageMeta";
import Paper from "@/shared/ui/Paper";

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
        description={entry.digest.trim() || undefined}
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
                <LoadingImage
                  src={entry.thumbnail}
                  alt={`${entry.title}のサムネイル`}
                />
              </div>
            )}
            <header className={styles["article-header"]}>
              <h1>{entry.title}</h1>
              {tags.length > 0 && (
                <div className={styles["tags"]}>
                  <LocalOfferOutlinedIcon
                    className={styles["meta-icon"]}
                    aria-hidden="true"
                  />
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
              <EntryDates entry={entry} />
              {entry.kind === "blog" && entry.authors.length > 0 && (
                <div className={styles["authors"]}>
                  {entry.authors.map(({ id, profile }) => (
                    <AuthorBadge key={id} id={id} author={profile} />
                  ))}
                </div>
              )}
              {entry.digest.trim() && (
                <p className={styles["summary"]}>{entry.digest.trim()}</p>
              )}
            </header>
            <hr className={styles["divider"]} />
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
