import { useSearchParams } from "react-router-dom";
import useSWR from "swr";

import styles from "./index.module.css";

import { PAGES } from "@/config/site";
import BlogStatus from "@/features/BlogStatus";
import EntryGrid from "@/features/EntryGrid";
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
      <PageMeta title={PAGES.blog.title} />
      <Breadcrumbs isPageHeading items={[{ label: PAGES.blog.title }]} />
      {tag && <p>タグ：{tag}</p>}
      <BlogStatus
        isLoading={isLoading}
        hasError={!!error}
        unavailableSources={data?.unavailableSources}
        onRetry={() => void mutate()}
      />
      <EntryGrid entries={entries ?? []} />
      {entries?.length === 0 && <p>該当するブログはありません。</p>}
    </section>
  );
};
export default BlogPage;
