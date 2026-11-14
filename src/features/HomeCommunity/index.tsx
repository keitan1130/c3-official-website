import { Link } from "react-router-dom";

import styles from "./index.module.css";

import { CONTENT } from "@/util/contentRepository";

import type { Community } from "@/shared/types/content";

interface HomeCommunityProps {
  community: Community;
  isReversed: boolean;
}
const HomeCommunity = ({ community, isReversed }: HomeCommunityProps) => (
  <section
    className={styles["community"]}
    data-reversed={isReversed || undefined}
  >
    <Link
      className={styles["media"]}
      to={`/community/${community.slug}`}
      aria-label={`${community.name}を詳しく見る`}
    >
      <video
        poster={CONTENT.site.poster}
        preload="metadata"
        playsInline
        muted
        autoPlay
        loop
      >
        <source src={community.webm} type="video/webm" />
        <source src={community.mp4} type="video/mp4" />
      </video>
    </Link>
    <div className={styles["text"]}>
      <h2>{community.name}</h2>
      <p>{community.domain}</p>
      <Link to={`/community/${community.slug}`}>詳しく見る</Link>
    </div>
  </section>
);
export default HomeCommunity;
