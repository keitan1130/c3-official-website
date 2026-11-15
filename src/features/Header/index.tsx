import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ArticleIcon from "@mui/icons-material/Article";
import CloseIcon from "@mui/icons-material/Close";
import GroupsIcon from "@mui/icons-material/Groups";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import MenuIcon from "@mui/icons-material/Menu";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import styles from "./index.module.css";

import { COMMUNITIES } from "@/config/communities";
import { EXTERNAL_LINKS, PAGE_TITLES, SITE } from "@/config/site";
import CommunityIcon from "@/features/CommunityIcon";
import ExternalLinkIcon from "@/features/ExternalLinkIcon";
import ThemeToggle from "@/features/ThemeToggle";
import Button from "@/shared/ui/Button";
import { lockPageScroll } from "@/util/pageScroll";

const HEADER_LINK_ORDER = ["toybox", "x", "github", "youtube"] as const;

const NAVIGATION = [
  {
    title: "HOME",
    url: "/",
    icon: <HomeIcon />,
  },
  {
    title: PAGE_TITLES.about,
    url: "/about",
    icon: <GroupsIcon />,
  },
  {
    title: PAGE_TITLES.news,
    url: "/news",
    icon: <InfoIcon />,
  },
  {
    title: PAGE_TITLES.blog,
    url: "/blog",
    icon: <ArticleIcon />,
  },
] as const;
const Header = () => {
  const [menuLocationKey, setMenuLocationKey] = useState<string | null>(null);
  const [isHidden, setIsHidden] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const isOpen = menuLocationKey === location.key;
  useEffect(() => {
    void location.key;
    setMenuLocationKey(null);
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
  // Release the previous page's lock before AppLayout scrolls the new page.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const unlock = lockPageScroll();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuLocationKey(null);
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
          onClick={() => setMenuLocationKey(null)}
        />
      )}
      <header className={styles["header"]} data-hidden={isHidden || undefined}>
        <div className={styles["wrapper"]}>
          <div className={styles["bar"]}>
            <div className={styles["brand"]}>
              <Button
                ref={toggleRef}
                variant="ghost"
                isIconOnly
                className={styles["menu-button"]}
                aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
                aria-expanded={isOpen}
                aria-controls="site-navigation"
                onClick={() => setMenuLocationKey(isOpen ? null : location.key)}
                icon={isOpen ? <CloseIcon /> : <MenuIcon />}
              />
              <Link to="/" aria-label="C3 ホーム">
                <img className={styles["logo"]} src={SITE.logo} alt="C3" />
              </Link>
            </div>
            <ThemeToggle />
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
                    <Link to={item.url}>
                      {item.icon}
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul>
                {COMMUNITIES.map((item) => (
                  <li key={item.slug}>
                    <Link to={`/community/${item.slug}`}>
                      <CommunityIcon slug={item.slug} />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul>
                {HEADER_LINK_ORDER.map((id) => {
                  const item = EXTERNAL_LINKS[id];
                  return (
                    <li key={id}>
                      <a href={item.url} target="_blank" rel="noreferrer">
                        <ExternalLinkIcon id={id} />
                        {item.label}
                        <OpenInNewIcon />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
};
export default Header;
