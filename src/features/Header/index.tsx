import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import styles from "./index.module.css";

import ThemeToggle from "@/features/ThemeToggle";
import { CONTENT } from "@/util/contentRepository";
import { lockPageScroll } from "@/util/pageScroll";

const NAVIGATION = [
  { title: "HOME", url: "/" },
  { title: "C3について", url: "/about" },
  { title: "お知らせ", url: "/news" },
  { title: "ブログ", url: "/blog" },
];
const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  useEffect(() => {
    void location.key;
    setIsOpen(false);
    setIsHidden(false);
  }, [location.key]);
  useEffect(() => {
    let last = window.scrollY;
    const handleScroll = () => {
      const next = window.scrollY;
      setIsHidden(!isOpen && next > last && next > 240);
      last = next;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const unlock = lockPageScroll();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);
  return (
    <>
      {isOpen && (
        <button
          type="button"
          className={styles["mask"]}
          aria-label="メニューを閉じる"
          tabIndex={-1}
          onClick={() => setIsOpen(false)}
        />
      )}
      <header className={styles["header"]} data-hidden={isHidden || undefined}>
        <div className={styles["wrapper"]}>
          <div className={styles["bar"]}>
            <div className={styles["brand"]}>
              <button
                ref={toggleRef}
                type="button"
                className={styles["menu-button"]}
                aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
                aria-expanded={isOpen}
                aria-controls="site-navigation"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
              <Link to="/" aria-label="C3 ホーム">
                <img
                  className={styles["logo"]}
                  src={CONTENT.site.logo}
                  alt="C3"
                />
              </Link>
            </div>
            <div className={styles["desktop-theme"]}>
              <ThemeToggle />
            </div>
          </div>
          <nav
            id="site-navigation"
            aria-label="メインメニュー"
            hidden={!isOpen}
            className={styles["navigation"]}
          >
            <div className={styles["columns"]}>
              <ul>
                {NAVIGATION.map((item) => (
                  <li key={item.url}>
                    <Link to={item.url}>{item.title}</Link>
                  </li>
                ))}
              </ul>
              <ul>
                {CONTENT.communities.map((item) => (
                  <li key={item.slug}>
                    <Link to={`/community/${item.slug}`}>{item.name}</Link>
                  </li>
                ))}
              </ul>
              <ul>
                {CONTENT.site.links.map((item) => (
                  <li key={item.url}>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      {item.title}
                      <OpenInNewIcon />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles["mobile-theme"]}>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>
    </>
  );
};
export default Header;
