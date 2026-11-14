import { useSearchParams } from "react-router-dom";

import styles from "./index.module.css";

import EntryCard from "@/features/EntryCard";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import PageMeta from "@/shared/ui/PageMeta";
import { CONTENT, getTag } from "@/util/contentRepository";

const NewsPage = () => {
  const [params] = useSearchParams();
  const tag = params.get("tag");
  const entries = CONTENT.news.filter(
    (entry) => !tag || entry.tagIds.some((id) => getTag(id)?.name === tag),
  );
  return (
    <section className={styles["page"]}>
      <PageMeta title="お知らせ" />
      <Breadcrumbs items={[{ label: "お知らせ一覧" }]} />
      <h1>お知らせ</h1>
      {tag && <p>タグ：{tag}</p>}
      <div className={styles["grid"]}>
        {entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} kind="news" />
        ))}
      </div>
      {!entries.length && <p>該当するお知らせはありません。</p>}
    </section>
  );
};
export default NewsPage;
