import { useParams } from "react-router-dom";
import useSWR from "swr";

import styles from "./index.module.css";

import AuthorProfile from "@/features/AuthorProfile";
import { useAuthors } from "@/features/AuthorProfile/hook/useAuthors";
import EntryGrid from "@/features/EntryGrid";
import NotFoundPage from "@/pages/NotFoundPage";
import Button from "@/shared/ui/Button";
import { getAuthorBlogs } from "@/util/blogRepository";

const AuthorPage = () => {
  const { id = "" } = useParams();
  const authors = useAuthors();
  const author = authors.data?.find((item) => item.id === id);
  const blogs = useSWR(
    author ? ["author-blogs", id] : null,
    () => getAuthorBlogs(id),
    { shouldRetryOnError: false },
  );
  const entries = blogs.data ?? [];
  if (authors.error)
    return (
      <div className={styles["status"]} role="alert">
        著者情報を読み込めませんでした。
        <Button onClick={() => void authors.mutate()}>再試行</Button>
      </div>
    );
  if (authors.isLoading)
    return (
      <p className={styles["status"]} role="status">
        読み込み中…
      </p>
    );
  if (!author) return <NotFoundPage />;
  return (
    <div className={styles["page"]}>
      <AuthorProfile author={author} />
      <h2 className={styles["tab"]}>ブログ</h2>
      {blogs.isLoading && <p role="status">ブログを読み込み中…</p>}
      {blogs.error && (
        <div role="alert">
          ブログを読み込めませんでした。
          <Button onClick={() => void blogs.mutate()}>再試行</Button>
        </div>
      )}
      <EntryGrid entries={entries ?? []} />
      {blogs.data?.length === 0 && <p>ブログはまだありません。</p>}
    </div>
  );
};
export default AuthorPage;
