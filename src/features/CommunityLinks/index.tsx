import { Link } from "react-router-dom";
import LaptopMacIcon from "@mui/icons-material/LaptopMac";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PaletteIcon from "@mui/icons-material/Palette";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import ViewInArIcon from "@mui/icons-material/ViewInAr";

import styles from "./index.module.css";

const AREAS = [
  { slug: "game", name: "GAME", icon: <SportsEsportsIcon /> },
  { slug: "3dcg", name: "3DCG", icon: <ViewInArIcon /> },
  { slug: "hack", name: "HACK", icon: <LaptopMacIcon /> },
  { slug: "2dcg", name: "2DCG", icon: <PaletteIcon /> },
  { slug: "music", name: "MUSIC", icon: <MusicNoteIcon /> },
] as const;
const CommunityLinks = () => (
  <div className={styles["links"]}>
    {AREAS.map(({ slug, name, icon }) => (
      <Link key={slug} to={`/community/${slug}`}>
        {icon}
        <span>{name}</span>
      </Link>
    ))}
  </div>
);
export default CommunityLinks;
