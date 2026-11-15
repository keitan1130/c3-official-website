import GitHubIcon from "@mui/icons-material/GitHub";
import LanguageIcon from "@mui/icons-material/Language";
import XIcon from "@mui/icons-material/X";

import styles from "./index.module.css";

import qiitaIcon from "@/assets/qiita-icon.png";
import zennIcon from "@/assets/zenn-icon.svg";
import Avatar from "@/shared/ui/Avatar";
import PageMeta from "@/shared/ui/PageMeta";

import type { ReactNode } from "react";
import type { Author } from "@/shared/types/content";

const AUTHOR_LINKS: Record<string, { label: string; icon: ReactNode }> = {
  gitHub: {
    label: "GitHub",
    icon: <GitHubIcon fontSize="small" aria-hidden="true" />,
  },
  twitter: { label: "X", icon: <XIcon fontSize="small" aria-hidden="true" /> },
  qiita: {
    label: "Qiita",
    icon: <img className={styles["service-icon"]} src={qiitaIcon} alt="" />,
  },
  zenn: {
    label: "Zenn",
    icon: <img className={styles["service-icon"]} src={zennIcon} alt="" />,
  },
  homePage: {
    label: "Webサイト",
    icon: <LanguageIcon fontSize="small" aria-hidden="true" />,
  },
};

const getAccountId = (service: string, url: string): string | undefined => {
  if (!["gitHub", "twitter", "qiita", "zenn"].includes(service))
    return undefined;
  try {
    const id = new URL(url).pathname.split("/").filter(Boolean)[0];
    return id ? decodeURIComponent(id) : undefined;
  } catch {
    return undefined;
  }
};

interface AuthorProfileProps {
  author: Author;
}
const AuthorProfile = ({ author }: AuthorProfileProps) => (
  <section className={styles["profile-section"]}>
    <PageMeta
      title={author.name}
      description={author.introduction}
      image={author.avatar ?? undefined}
    />
    <div className={styles["profile-card"]}>
      <div className={styles["profile-avatar"]}>
        <Avatar
          avatarURL={author.avatar ?? undefined}
          alt={`${author.name}のプロフィール画像`}
          size="profile"
        />
      </div>
      <div className={styles["profile-main"]}>
        <h1 className={styles["display-name"]}>{author.name}</h1>
        {Object.keys(author.links).length > 0 && (
          <nav
            className={styles["social-links"]}
            aria-label="ソーシャルアカウント"
          >
            {Object.entries(author.links).map(([title, url]) => {
              const { label, icon } = AUTHOR_LINKS[title] ?? {
                label: title,
                icon: <LanguageIcon fontSize="small" aria-hidden="true" />,
              };
              const accountId = getAccountId(title, url);
              return (
                <a
                  className={styles["social-link"]}
                  key={title}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={accountId ? `${label}: ${accountId}` : label}
                >
                  {icon}
                  <span>{accountId ?? label}</span>
                </a>
              );
            })}
          </nav>
        )}
      </div>
      {author.introduction && (
        <p className={styles["profile-text"]}>{author.introduction}</p>
      )}
    </div>
  </section>
);
export default AuthorProfile;
