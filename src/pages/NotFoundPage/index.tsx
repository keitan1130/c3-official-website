import { Link } from "react-router-dom";

import styles from "./index.module.css";

const NotFoundPage = () => (
  <section className={styles["page"]}>
    <h1>404</h1>
    <p>ページが見つかりません。</p>
    <Link to="/">ホームへ戻る</Link>
  </section>
);
export default NotFoundPage;
