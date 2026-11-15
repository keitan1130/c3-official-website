import styles from "./index.module.css";

import { PAGES } from "@/config/site";
import EntryCard from "@/features/EntryCard";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import PageMeta from "@/shared/ui/PageMeta";
import { CONTENT } from "@/util/contentRepository";

const NewsPage = () => {
  const entries = CONTENT.news;
  return (
    <section className={styles["page"]}>
      <PageMeta title={PAGES.news.title} />
      <Breadcrumbs isPageHeading items={[{ label: PAGES.news.title }]} />
      <div className={styles["grid"]}>
        {entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>
      {!entries.length && <p>該当するお知らせはありません。</p>}
    </section>
  );
};
export default NewsPage;
