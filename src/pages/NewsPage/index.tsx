import styles from "./index.module.css";

import { PAGES } from "@/config/site";
import EntryGrid from "@/features/EntryGrid";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import PageMeta from "@/shared/ui/PageMeta";
import { CONTENT } from "@/util/contentRepository";

const NewsPage = () => {
  const entries = CONTENT.news;
  return (
    <section className={styles["page"]}>
      <PageMeta title={PAGES.news.title} />
      <Breadcrumbs isPageHeading items={[{ label: PAGES.news.title }]} />
      <EntryGrid entries={entries ?? []} />
      {!entries.length && <p>該当するお知らせはありません。</p>}
    </section>
  );
};
export default NewsPage;
