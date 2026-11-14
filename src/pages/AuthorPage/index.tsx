import { useParams } from "react-router-dom";
import useSWR from "swr";

import styles from "./index.module.css";

import AuthorProfile from "@/features/AuthorProfile";
import EntryCard from "@/features/EntryCard";
import NotFoundPage from "@/pages/NotFoundPage";
import Button from "@/shared/ui/Button";
import { getAuthor } from "@/util/authorRepository";
import { getAuthorBlogs } from "@/util/blogRepository";

const AuthorPage = () => {
  const { id = "" } = useParams();
  const author = useSWR(["author", id], () => getAuthor(id), {
    shouldRetryOnError: false,
  });
  const blogs = useSWR(
    author.data ? ["author-blogs", id] : null,
    () => getAuthorBlogs(id),
    { shouldRetryOnError: false },
  );
  if (author.error)
    return (
      <div className={styles["status"]} role="alert">
        著者情報を読み込めませんでした。
        <Button onClick={() => void author.mutate()}>再試行</Button>
      </div>
    );
  if (author.isLoading)
    return (
      <p className={styles["status"]} role="status">
        読み込み中…
      </p>
    );
  if (!author.data) return <NotFoundPage />;
  return (
    <div className={styles["page"]}>
      <AuthorProfile author={author.data} />
      <h2 className={styles["tab"]}>ブログ</h2>
      {blogs.isLoading && <p role="status">ブログを読み込み中…</p>}
      {blogs.error && (
        <div role="alert">
          ブログを読み込めませんでした。
          <Button onClick={() => void blogs.mutate()}>再試行</Button>
        </div>
      )}
      <div className={styles["grid"]}>
        {blogs.data?.map((entry) => (
          <EntryCard key={entry.id} entry={entry} kind="blog" />
        ))}
      </div>
      {blogs.data?.length === 0 && <p>ブログはまだありません。</p>}
    </div>
  );
};
export default AuthorPage;
