import { Link } from "react-router-dom";
import CodeIcon from "@mui/icons-material/Code";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PaletteIcon from "@mui/icons-material/Palette";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import ViewInArIcon from "@mui/icons-material/ViewInAr";

import styles from "./index.module.css";

const AREAS = [
  { slug: "game", name: "GAME", Icon: SportsEsportsIcon },
  { slug: "3dcg", name: "3DCG", Icon: ViewInArIcon },
  { slug: "hack", name: "HACK", Icon: CodeIcon },
  { slug: "2dcg", name: "2DCG", Icon: PaletteIcon },
  { slug: "music", name: "MUSIC", Icon: MusicNoteIcon },
];
const CommunityLinks = () => (
  <div className={styles["links"]}>
    {AREAS.map(({ slug, name, Icon }) => (
      <Link key={slug} to={`/community/${slug}`}>
        <Icon />
        <span>{name}</span>
      </Link>
    ))}
  </div>
);
export default CommunityLinks;
