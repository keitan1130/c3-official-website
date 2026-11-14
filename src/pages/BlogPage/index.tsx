import { useSearchParams } from "react-router-dom";
import useSWR from "swr";

import styles from "./index.module.css";

import BlogStatus from "@/features/BlogStatus";
import EntryCard from "@/features/EntryCard";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import PageMeta from "@/shared/ui/PageMeta";
import { getBlogs } from "@/util/blogRepository";

const BlogPage = () => {
  const [params] = useSearchParams();
  const tag = params.get("tag");
  const { data, error, isLoading, mutate } = useSWR("blogs", getBlogs, {
    shouldRetryOnError: false,
  });
  const entries = data?.entries.filter(
    (entry) => !tag || entry.tags.some((item) => item.name === tag),
  );
  return (
    <section className={styles["page"]}>
      <PageMeta title="ブログ" />
      <Breadcrumbs items={[{ label: "ブログ一覧" }]} />
      <h1>ブログ</h1>
      {tag && <p>タグ：{tag}</p>}
      <BlogStatus
        isLoading={isLoading}
        hasError={!!error}
        unavailableSources={data?.unavailableSources}
        onRetry={() => void mutate()}
      />
      <div className={styles["grid"]}>
        {entries?.map((entry) => (
          <EntryCard key={entry.id} entry={entry} kind="blog" />
        ))}
      </div>
      {entries?.length === 0 && <p>該当するブログはありません。</p>}
    </section>
  );
};
export default BlogPage;
