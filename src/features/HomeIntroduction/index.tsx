import styles from "./index.module.css";

import c3Logo from "@/assets/c3-logo.webp";
import LinkButton from "@/shared/ui/LinkButton";
import { CONTENT } from "@/util/contentRepository";

const HomeIntroduction = () => (
  <section className={styles["introduction"]}>
    <img src={c3Logo} alt="C3アイコン" loading="lazy" />
    <div className={styles["text"]}>
      <h2>C3について</h2>
      <p>{CONTENT.about.summary}</p>
      <LinkButton to="/about">詳しく見る</LinkButton>
    </div>
  </section>
);
export default HomeIntroduction;
