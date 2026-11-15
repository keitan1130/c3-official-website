import GitHubIcon from "@mui/icons-material/GitHub";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";

import toyboxIcon from "@/assets/toybox-icon.png";

import type { ExternalLinkId } from "@/config/site";

interface ExternalLinkIconProps {
  id: ExternalLinkId;
  size?: number;
}
const ExternalLinkIcon = ({ id, size = 20 }: ExternalLinkIconProps) => {
  if (id === "toybox")
    return <img src={toyboxIcon} alt="" width={size} height={size} />;
  const Icon = { x: XIcon, github: GitHubIcon, youtube: YouTubeIcon }[id];
  return <Icon />;
};
export default ExternalLinkIcon;
