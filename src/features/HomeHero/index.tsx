import styles from "./index.module.css";

import { SITE } from "@/config/site";
import Carousel from "@/features/Carousel";
import LinkButton from "@/shared/ui/LinkButton";
import { CONTENT } from "@/util/contentRepository";

const HomeHero = () => {
  const news = CONTENT.news.slice(0, 5);
  return (
    <section className={styles["hero"]}>
      <div className={styles["left"]}>
        <h1 className={styles["title"]}>
          {SITE.title.split(" ").map((word) => (
            <span key={word}>{word}</span>
          ))}
        </h1>
      </div>
      <div className={styles["carousel"]}>
        <Carousel entries={news} label="お知らせ" />
      </div>
      <LinkButton className={styles["all"]} to="/news">
        お知らせ一覧を見る
      </LinkButton>
    </section>
  );
};
export default HomeHero;
