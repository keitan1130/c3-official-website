import styles from "./index.module.css";

import videoLoading from "@/assets/video-loading.png";
import AutoplayVideo from "@/shared/ui/AutoplayVideo";
import LinkButton from "@/shared/ui/LinkButton";

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
    <div className={styles["media"]}>
      <AutoplayVideo
        src={community.mp4}
        poster={videoLoading}
        aria-label={`${community.name}紹介動画`}
      />
    </div>
    <div className={styles["text"]}>
      <h2>{community.name}</h2>
      <p>{community.domain}</p>
      <LinkButton
        className={styles["more"]}
        to={`/community/${community.slug}`}
      >
        詳しく見る
      </LinkButton>
    </div>
  </section>
);
export default HomeCommunity;
