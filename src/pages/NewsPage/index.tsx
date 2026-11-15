import styles from "./index.module.css";

import { PAGE_TITLES } from "@/config/site";
import EntryGrid from "@/features/EntryGrid";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import PageMeta from "@/shared/ui/PageMeta";
import { CONTENT } from "@/util/contentRepository";

const NewsPage = () => {
  const entries = CONTENT.news;
  return (
    <section className={styles["page"]}>
      <PageMeta title={PAGE_TITLES.news} />
      <Breadcrumbs isPageHeading items={[{ label: PAGE_TITLES.news }]} />
      <EntryGrid entries={entries ?? []} />
      {!entries.length && <p>該当するお知らせはありません。</p>}
    </section>
  );
};
export default NewsPage;
