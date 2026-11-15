import { useState } from "react";
import { Link } from "react-router-dom";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import styles from "./index.module.css";

import AuthorBadge from "@/features/AuthorBadge";
import EntryDates from "@/features/EntryDates";
import Batch from "@/shared/ui/Batch";
import LoadingImage from "@/shared/ui/LoadingImage";
import { normalizeTagNameInput } from "@/util/tagName";

import type { EntrySummary } from "@/shared/types/content";

interface EntryCardProps {
  entry: EntrySummary;
}
const EntryCard = ({ entry }: EntryCardProps) => {
  const [failedThumbnail, setFailedThumbnail] = useState<string>();
  const hasThumbnail = !!entry.thumbnail && failedThumbnail !== entry.thumbnail;
  const tags = entry.kind === "blog" ? entry.tags : [];
  const url = `/${entry.kind}/${encodeURIComponent(entry.id)}`;
  return (
    <article className={styles["card"]}>
      <div className={styles["image"]}>
        {hasThumbnail ? (
          <LoadingImage
            className={styles["thumbnail"]}
            src={entry.thumbnail}
            alt=""
            loading="lazy"
            onError={() => setFailedThumbnail(entry.thumbnail)}
          />
        ) : (
          <span className={styles["placeholder"]} aria-hidden="true">
            <ImageOutlinedIcon fontSize="inherit" />
          </span>
        )}
      </div>
      <div className={styles["content"]}>
        <div className={styles["tags"]}>
          {tags.map((tag) => (
            <Link key={tag.id} to={`/blog?tag=${encodeURIComponent(tag.name)}`}>
              <Batch color="selected">{normalizeTagNameInput(tag.name)}</Batch>
            </Link>
          ))}
        </div>
        <h2 className={styles["title"]} title={entry.title}>
          <Link className={styles["primary"]} to={url}>
            {entry.title}
          </Link>
        </h2>
        <p className={styles["summary"]}>{entry.digest.trim() || null}</p>
        <div className={styles["meta"]}>
          {entry.kind === "blog" && (
            <div className={styles["authors"]}>
              {entry.authors.map(({ id, profile }) => (
                <AuthorBadge key={id} id={id} author={profile} />
              ))}
            </div>
          )}
          <EntryDates entry={entry} isCompact />
        </div>
      </div>
    </article>
  );
};
export default EntryCard;
