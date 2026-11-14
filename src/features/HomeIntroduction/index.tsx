import { Link } from "react-router-dom";

import styles from "./index.module.css";

import { CONTENT } from "@/util/contentRepository";

const HomeIntroduction = () => (
  <section className={styles["introduction"]}>
    <img src={CONTENT.site.logo} alt="C3アイコン" loading="lazy" />
    <div className={styles["text"]}>
      <h2>C3について</h2>
      <p>{CONTENT.about.summary}</p>
      <Link to="/about">詳しく見る</Link>
    </div>
  </section>
);
export default HomeIntroduction;
