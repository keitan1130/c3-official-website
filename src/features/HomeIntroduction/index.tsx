import { Link } from "react-router-dom";

import styles from "./index.module.css";

import c3Logo from "@/assets/c3-logo.webp";
import { CONTENT } from "@/util/contentRepository";

const HomeIntroduction = () => (
  <section className={styles["introduction"]}>
    <img src={c3Logo} alt="C3アイコン" loading="lazy" />
    <div className={styles["text"]}>
      <h2>C3について</h2>
      <p>{CONTENT.about.summary}</p>
      <Link to="/about">詳しく見る</Link>
    </div>
  </section>
);
export default HomeIntroduction;
