import styles from "./index.module.css";

import type { Author } from "@/shared/types/content";

interface AuthorProfileProps {
  author: Author;
}
const AuthorProfile = ({ author }: AuthorProfileProps) => (
  <section className={styles["profile"]}>
    {author.avatar && (
      <img
        className={styles["avatar"]}
        src={author.avatar}
        alt={`${author.name}のアイコン`}
      />
    )}
    <h1>{author.name}</h1>
    <p>{author.introduction}</p>
    <div className={styles["links"]}>
      {Object.entries(author.links).map(([title, url]) => (
        <a key={title} href={url} target="_blank" rel="noreferrer">
          {title}
        </a>
      ))}
    </div>
  </section>
);
export default AuthorProfile;
