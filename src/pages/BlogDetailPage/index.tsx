import { useParams } from "react-router-dom";
import useSWR from "swr";

import styles from "./index.module.css";

import { PAGE_TITLES } from "@/config/site";
import BlogStatus from "@/features/BlogStatus";
import EntryDetail from "@/features/EntryDetail";
import NotFoundPage from "@/pages/NotFoundPage";
import PageMeta from "@/shared/ui/PageMeta";
import { getBlog, getBlogs } from "@/util/blogRepository";

const BlogDetailPage = () => {
  const { id = "" } = useParams();
  const entry = useSWR(["blog", id], () => getBlog(id), {
    shouldRetryOnError: false,
  });
  const recent = useSWR("blogs", getBlogs, {
    shouldRetryOnError: false,
  });
  if (!entry.data && (entry.error || entry.isLoading))
    return (
      <div className={styles["status"]}>
        <PageMeta title={PAGE_TITLES.blog} />
        <BlogStatus
          isLoading={entry.isLoading}
          hasError={!!entry.error}
          onRetry={() => void entry.mutate()}
        />
      </div>
    );
  return entry.data ? (
    <>
      {entry.error && (
        <div className={styles["status"]}>
          <BlogStatus
            isLoading={false}
            hasError
            onRetry={() => void entry.mutate()}
          />
        </div>
      )}
      <EntryDetail entry={entry.data} recent={recent.data?.entries ?? []} />
    </>
  ) : (
    <NotFoundPage />
  );
};
export default BlogDetailPage;
