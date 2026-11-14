import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import useSWR from "swr";

import styles from "./index.module.css";

import { CONTENT } from "@/util/contentRepository";
import {
  getPublicWorks,
  WORKS_API_BASE_URL,
  WORKS_LIMIT,
} from "@/util/workRepository";

const FeaturedWorks = () => {
  const { data, error, isLoading, mutate } = useSWR(
    ["public-works", WORKS_API_BASE_URL, WORKS_LIMIT],
    getPublicWorks,
    { shouldRetryOnError: false },
  );
  return (
    <div className={styles["works"]}>
      <div className={styles["background"]} aria-hidden="true">
        {[0, 1].map((copy) => (
          <div key={copy} className={styles["strip"]}>
            {data
              ?.filter((work) => work.thumbnail)
              .map((work) => (
                <img
                  key={work.id}
                  src={work.thumbnail}
                  alt=""
                  title={work.title}
                  loading="lazy"
                />
              ))}
          </div>
        ))}
      </div>
      <div className={styles["foreground"]}>
        {isLoading && <p role="status">作品を読み込み中…</p>}
        {error && (
          <div role="alert">
            <p>作品を読み込めませんでした。</p>
            <button type="button" onClick={() => void mutate()}>
              再試行
            </button>
          </div>
        )}
        {!isLoading && !error && data?.length === 0 && (
          <p role="status">公開作品はまだありません。</p>
        )}
        <a href={CONTENT.site.worksUrl} target="_blank" rel="noreferrer">
          <OpenInNewIcon />
          作品を見る
        </a>
      </div>
    </div>
  );
};
export default FeaturedWorks;
