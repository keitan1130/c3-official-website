import { Link } from "react-router-dom";

import styles from "./index.module.css";

import LegacyIcon from "@/shared/ui/LegacyIcon";

const AREAS = [
  { slug: "game", name: "GAME", icon: "gamepad" },
  { slug: "3dcg", name: "3DCG", icon: "cubes" },
  { slug: "hack", name: "HACK", icon: "laptop-code" },
  { slug: "2dcg", name: "2DCG", icon: "palette" },
  { slug: "music", name: "MUSIC", icon: "music" },
] as const;
const CommunityLinks = () => (
  <div className={styles["links"]}>
    {AREAS.map(({ slug, name, icon }) => (
      <Link key={slug} to={`/community/${slug}`}>
        <LegacyIcon name={icon} />
        <span>{name}</span>
      </Link>
    ))}
  </div>
);
export default CommunityLinks;
