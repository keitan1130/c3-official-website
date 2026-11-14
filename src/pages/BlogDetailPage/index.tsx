import { useParams, useSearchParams } from "react-router-dom";
import useSWR from "swr";

import styles from "./index.module.css";

import BlogStatus from "@/features/BlogStatus";
import EntryDetail from "@/features/EntryDetail";
import NotFoundPage from "@/pages/NotFoundPage";
import { getBlog, getBlogs } from "@/util/blogRepository";

const BlogDetailPage = () => {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const source = params.get("source") ?? undefined;
  const isValidSource =
    !source || source === "contentful" || source === "toybox";
  const entry = useSWR(
    isValidSource ? ["blog", id, source ?? "auto"] : null,
    () => getBlog(id, source),
    { shouldRetryOnError: false },
  );
  const recent = useSWR("blogs", getBlogs, { shouldRetryOnError: false });
  if (!isValidSource) return <NotFoundPage />;
  if (entry.error || entry.isLoading)
    return (
      <div className={styles["status"]}>
        <BlogStatus
          isLoading={entry.isLoading}
          hasError={!!entry.error}
          onRetry={() => void entry.mutate()}
        />
      </div>
    );
  return entry.data ? (
    <EntryDetail
      entry={entry.data}
      kind="blog"
      recent={recent.data?.entries ?? []}
    />
  ) : (
    <NotFoundPage />
  );
};
export default BlogDetailPage;
