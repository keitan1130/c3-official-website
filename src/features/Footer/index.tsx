import GitHubIcon from "@mui/icons-material/GitHub";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";

import styles from "./index.module.css";

import { CONTENT } from "@/util/contentRepository";

const ICONS = {
  ToyBox: Inventory2Icon,
  Twitter: TwitterIcon,
  GitHub: GitHubIcon,
  YouTube: YouTubeIcon,
};
const Footer = () => (
  <footer className={styles["footer"]}>
    <div className={styles["identity"]}>
      <img src={CONTENT.site.logo} alt="C3" width="120" height="120" />
      <span>C3 Official Website</span>
    </div>
    <div className={styles["center"]}>
      <div className={styles["links"]}>
        {CONTENT.site.links.map((link) => {
          const Icon = ICONS[link.title as keyof typeof ICONS];
          return (
            <a
              key={link.url}
              href={link.url}
              aria-label={link.title}
              target="_blank"
              rel="noreferrer"
            >
              {Icon ? <Icon /> : link.title}
            </a>
          );
        })}
      </div>
      <p className={styles["copyright"]}>
        © 2021 - {new Date().getFullYear()} Composite Computer Club
      </p>
    </div>
    <a className={styles["top"]} href="#top">
      <KeyboardArrowUpIcon />
      <br />
      PAGE TOP
    </a>
  </footer>
);
export default Footer;
