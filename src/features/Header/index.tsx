import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ArticleIcon from "@mui/icons-material/Article";
import CloseIcon from "@mui/icons-material/Close";
import GitHubIcon from "@mui/icons-material/GitHub";
import GroupsIcon from "@mui/icons-material/Groups";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import LaptopMacIcon from "@mui/icons-material/LaptopMac";
import MenuIcon from "@mui/icons-material/Menu";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PaletteIcon from "@mui/icons-material/Palette";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";

import styles from "./index.module.css";

import c3Logo from "@/assets/c3-logo.webp";
import toyboxIcon from "@/assets/toybox-icon.png";
import ThemeToggle from "@/features/ThemeToggle";
import { CONTENT } from "@/util/contentRepository";
import { lockPageScroll } from "@/util/pageScroll";

const NAVIGATION = [
  { title: "HOME", url: "/", icon: <HomeIcon /> },
  { title: "C3について", url: "/about", icon: <GroupsIcon /> },
  { title: "お知らせ", url: "/news", icon: <InfoIcon /> },
  { title: "ブログ", url: "/blog", icon: <ArticleIcon /> },
] as const;
const COMMUNITY_ICONS = {
  game: <SportsEsportsIcon />,
  "3dcg": <ViewInArIcon />,
  hack: <LaptopMacIcon />,
  "2dcg": <PaletteIcon />,
  music: <MusicNoteIcon />,
} as const;
const LINK_ICONS = {
  ToyBox: <img src={toyboxIcon} alt="" width={20} height={20} />,
  Twitter: <XIcon />,
  GitHub: <GitHubIcon />,
  YouTube: <YouTubeIcon />,
} as const;
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
                <img className={styles["logo"]} src={c3Logo} alt="C3" />
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
                {CONTENT.communities.map((item) => (
                  <li key={item.slug}>
                    <Link to={`/community/${item.slug}`}>
                      {
                        COMMUNITY_ICONS[
                          item.slug as keyof typeof COMMUNITY_ICONS
                        ]
                      }
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul>
                {CONTENT.site.links.map((item) => (
                  <li key={item.url}>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      {LINK_ICONS[item.title as keyof typeof LINK_ICONS]}
                      {item.title}
                      <OpenInNewIcon />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
};
export default Header;
