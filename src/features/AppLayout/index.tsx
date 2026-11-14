import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import styles from "./index.module.css";

import Footer from "@/features/Footer";
import Header from "@/features/Header";

const AppLayout = () => {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname && !location.hash)
      window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, location.hash]);
  return (
    <>
      <div id="top" />
      <a className={styles["skip"]} href="#main">
        本文へ移動
      </a>
      <Header />
      <main id="main" className={styles["main"]}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};
export default AppLayout;
