import styles from "./index.module.css";

import { EXTERNAL_LINKS, SITE } from "@/config/site";
import ExternalLinkIcon from "@/features/ExternalLinkIcon";

const FOOTER_LINK_ORDER = ["toybox", "x", "youtube", "github"] as const;

const Footer = () => (
  <footer className={styles["footer"]}>
    <nav className={styles["external-links"]} aria-label="C3 外部リンク">
      {FOOTER_LINK_ORDER.map((id) => {
        const { url: href, label } = EXTERNAL_LINKS[id];
        return (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            className={styles["external-link"]}
          >
            <span className={styles["link-icon"]} aria-hidden="true">
              <ExternalLinkIcon id={id} size={24} />
            </span>
            <span className={styles["link-label"]}>{label}</span>
          </a>
        );
      })}
    </nav>
    <small className={styles["copyright"]}>
      © {new Date().getFullYear()} {SITE.title}
    </small>
  </footer>
);

export default Footer;
