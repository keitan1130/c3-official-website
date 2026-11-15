import { Link } from "react-router-dom";

import styles from "./index.module.css";

import { ABOUT_COMMUNITY_ORDER, COMMUNITIES } from "@/config/communities";
import CommunityIcon from "@/features/CommunityIcon";

const CommunityLinks = () => (
  <div className={styles["links"]}>
    {ABOUT_COMMUNITY_ORDER.map((slug) => (
      <Link key={slug} to={`/community/${slug}`}>
        <CommunityIcon slug={slug} />
        <span>{COMMUNITIES.find((item) => item.slug === slug)?.name}</span>
      </Link>
    ))}
  </div>
);
export default CommunityLinks;
