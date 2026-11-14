import { Link } from "react-router-dom";

import styles from "./index.module.css";

import PageMeta from "@/shared/ui/PageMeta";

const NotFoundPage = () => (
  <section className={styles["page"]}>
    <PageMeta title="404" isNoIndex />
    <h1>404</h1>
    <p>ページが見つかりません。</p>
    <Link to="/">ホームへ戻る</Link>
  </section>
);
export default NotFoundPage;
