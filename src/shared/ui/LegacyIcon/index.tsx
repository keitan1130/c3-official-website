import ICON_PATHS from "./icons";

interface LegacyIconProps {
  name: keyof typeof ICON_PATHS;
  className?: string;
}
const LegacyIcon = ({ name, className }: LegacyIconProps) => {
  const icon = ICON_PATHS[name];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={icon.viewBox}
      className={className}
      fill="currentColor"
      width="1em"
      height="1em"
    >
      {icon.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
};
export default LegacyIcon;
