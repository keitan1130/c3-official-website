import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";

import styles from "./index.module.css";

import { formatDate } from "@/util/formatDate";
import { formatDateTime } from "@/util/formatDateTime";

import type { EntrySummary } from "@/shared/types/content";

interface EntryDatesProps {
  entry: EntrySummary;
  isCompact?: boolean;
}
const EntryDates = ({ entry, isCompact = false }: EntryDatesProps) => (
  <div className={styles["dates"]} data-compact={isCompact || undefined}>
    <span className={styles["date"]}>
      <AccessTimeRoundedIcon aria-hidden="true" fontSize="inherit" />
      <span>
        <span className={styles["date-label"]}>投稿日：</span>
        <time
          title={
            entry.kind === "news"
              ? `投稿日：${formatDate(entry.publishedDate)}`
              : `投稿日：${formatDateTime(entry.createdAt)}`
          }
          dateTime={
            entry.kind === "news" ? entry.publishedDate : entry.createdAt
          }
        >
          {entry.kind === "news"
            ? formatDate(entry.publishedDate)
            : isCompact
              ? formatDateTime(entry.createdAt).split(" ")[0]
              : formatDateTime(entry.createdAt)}
        </time>
      </span>
    </span>
    {entry.kind === "blog" && !isCompact && (
      <span className={styles["date"]}>
        <AutorenewRoundedIcon aria-hidden="true" fontSize="inherit" />
        <span>
          <span className={styles["date-label"]}>更新日：</span>
          <time
            dateTime={entry.updatedAt}
            title={`更新日：${formatDateTime(entry.updatedAt)}`}
          >
            {isCompact
              ? formatDateTime(entry.updatedAt).split(" ")[0]
              : formatDateTime(entry.updatedAt)}
          </time>
        </span>
      </span>
    )}
  </div>
);
export default EntryDates;
