import LaptopMacIcon from "@mui/icons-material/LaptopMac";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PaletteIcon from "@mui/icons-material/Palette";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import ViewInArIcon from "@mui/icons-material/ViewInAr";

import type { CommunitySlug } from "@/config/communities";

const COMMUNITY_ICONS = {
  game: SportsEsportsIcon,
  "3dcg": ViewInArIcon,
  hack: LaptopMacIcon,
  "2dcg": PaletteIcon,
  music: MusicNoteIcon,
};
interface CommunityIconProps {
  slug: CommunitySlug;
}
const CommunityIcon = ({ slug }: CommunityIconProps) => {
  const Icon = COMMUNITY_ICONS[slug];
  return <Icon />;
};
export default CommunityIcon;
