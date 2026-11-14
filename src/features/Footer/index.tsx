import GitHubIcon from "@mui/icons-material/GitHub";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";

import styles from "./index.module.css";

import toyboxIcon from "@/assets/toybox-icon.png";
import { CONTENT } from "@/util/contentRepository";

const FOOTER_EXTERNAL_LINKS = [
  {
    href: CONTENT.site.worksUrl,
    label: "Toybox",
    icon: <img src={toyboxIcon} alt="" width={24} height={24} />,
  },
  {
    href: "https://x.com/c3_kyutech",
    label: "C3 X",
    icon: <XIcon />,
  },
  {
    href: "https://www.youtube.com/@compositecomputerclub2597",
    label: "C3 Youtubeチャンネル",
    icon: <YouTubeIcon />,
  },
  {
    href: "https://github.com/Kyutech-C3",
    label: "C3 GitHub",
    icon: <GitHubIcon />,
  },
];

const Footer = () => (
  <footer className={styles["footer"]}>
    <nav className={styles["external-links"]} aria-label="C3 外部リンク">
      {FOOTER_EXTERNAL_LINKS.map(({ href, label, icon }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={label}
          className={styles["external-link"]}
        >
          <span className={styles["link-icon"]} aria-hidden="true">
            {icon}
          </span>
          <span className={styles["link-label"]}>{label}</span>
        </a>
      ))}
    </nav>
    <small className={styles["copyright"]}>
      © {new Date().getFullYear()} Composite Computer Club
    </small>
  </footer>
);

export default Footer;
