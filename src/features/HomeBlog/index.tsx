import { Link } from "react-router-dom";
import useSWR from "swr";

import styles from "./index.module.css";

import BlogStatus from "@/features/BlogStatus";
import Carousel from "@/features/Carousel";
import { getBlogs } from "@/util/blogRepository";

const HomeBlog = () => {
  const { data, error, isLoading, mutate } = useSWR("blogs", getBlogs, {
    shouldRetryOnError: false,
  });
  return (
    <section className={styles["blog"]}>
      <h2>ブログ</h2>
      <BlogStatus
        isLoading={isLoading}
        hasError={!!error}
        unavailableSources={data?.unavailableSources}
        onRetry={() => void mutate()}
      />
      {data?.entries.length ? (
        <div className={styles["carousel"]}>
          <Carousel
            entries={data.entries.slice(0, 5)}
            kind="blog"
            label="最新のブログ"
          />
        </div>
      ) : null}
      <Link className={styles["all"]} to="/blog">
        一覧を見る
      </Link>
    </section>
  );
};
export default HomeBlog;
