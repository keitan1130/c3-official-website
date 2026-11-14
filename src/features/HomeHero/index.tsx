import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import styles from "./index.module.css";

import Carousel from "@/features/Carousel";
import { CONTENT } from "@/util/contentRepository";
import { formatDateTime } from "@/util/formatDateTime";

const HomeHero = () => {
  const [index, setIndex] = useState(0);
  const news = CONTENT.news.slice(0, 5);
  useEffect(() => {
    if (news.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((value) => (value + 1) % news.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [news.length]);
  const selected = news[index % news.length];
  const ticker = (
    <>
      <div className={styles["ticker-heading"]}>
        <span>お知らせ</span>
        <Link to="/news">一覧を見る</Link>
      </div>
      {selected && (
        <Link className={styles["ticker-link"]} to={`/news/${selected.id}`}>
          {formatDateTime(selected.updatedAt)} {selected.title}
        </Link>
      )}
    </>
  );
  return (
    <section className={styles["hero"]}>
      <div className={styles["left"]}>
        <h1 className={styles["title"]}>
          <span>Composite</span>
          <span>Computer</span>
          <span>Club</span>
        </h1>
        <div className={styles["desktop-news"]}>{ticker}</div>
      </div>
      <div className={styles["carousel"]}>
        <Carousel entries={CONTENT.news} kind="news" label="重要なお知らせ" />
      </div>
      <div className={styles["mobile-news"]}>{ticker}</div>
    </section>
  );
};
export default HomeHero;
