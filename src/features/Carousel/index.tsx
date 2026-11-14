import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import styles from "./index.module.css";

import { getTag } from "@/util/contentRepository";
import { formatDateTime } from "@/util/formatDateTime";

import type { BlogEntry, Entry } from "@/shared/types/content";

interface CarouselProps {
  entries: (Entry | BlogEntry)[];
  kind: "news" | "blog";
  label: string;
}
const Carousel = ({ entries, kind, label }: CarouselProps) => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchRef = useRef(0);
  useEffect(() => {
    if (isPaused || entries.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((value) => (value + 1) % entries.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [entries.length, isPaused]);
  const entry = entries[index % entries.length];
  if (!entry) return null;
  const blog = "source" in entry ? entry : undefined;
  const tags =
    blog?.tags ??
    entry.tagIds.flatMap((id) => {
      const tag = getTag(id);
      return tag ? [tag] : [];
    });
  const move = (delta: number) =>
    setIndex((value) => (value + delta + entries.length) % entries.length);
  return (
    <section
      className={styles["carousel"]}
      aria-label={label}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setIsPaused(false);
      }}
      onTouchStart={(event) => {
        touchRef.current = event.touches[0].clientX;
        setIsPaused(true);
      }}
      onTouchEnd={(event) => {
        const delta = event.changedTouches[0].clientX - touchRef.current;
        if (Math.abs(delta) > 50) move(delta > 0 ? -1 : 1);
      }}
    >
      <Link
        className={styles["slide"]}
        to={`/${kind}/${encodeURIComponent(entry.id)}`}
      >
        <img src={entry.thumbnail} alt="" draggable={false} />
        <div className={styles["caption"]}>
          <span className={styles["title"]}>{entry.title}</span>
          <div className={styles["tags"]}>
            {tags.map((tag) => (
              <span key={tag.id}>{tag.name}</span>
            ))}
          </div>
          <span className={styles["date"]}>
            {formatDateTime(entry.updatedAt)}
          </span>
        </div>
      </Link>
      {entries.length > 1 && (
        <>
          <button
            type="button"
            className={styles["previous"]}
            aria-label={`${label}の前のスライド`}
            onClick={() => move(-1)}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className={styles["next"]}
            aria-label={`${label}の次のスライド`}
            onClick={() => move(1)}
          >
            <ChevronRightIcon />
          </button>
          <div className={styles["dots"]}>
            {entries.map((item, position) => (
              <button
                key={item.id}
                type="button"
                aria-label={`${label}のスライド${position + 1}を表示`}
                aria-current={
                  position === index % entries.length ? "true" : undefined
                }
                onClick={() => setIndex(position)}
              />
            ))}
          </div>
          <button
            className={styles["pause"]}
            type="button"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? "自動切替を再開" : "自動切替を停止"}
          </button>
        </>
      )}
    </section>
  );
};
export default Carousel;
