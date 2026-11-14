import { useSyncExternalStore } from "react";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import { getCurrentTheme, setTheme, subscribeTheme } from "@/util/theme";

const ThemeToggle = () => {
  const theme = useSyncExternalStore(subscribeTheme, getCurrentTheme);
  const label =
    theme === "light" ? "ダークモードに切り替え" : "ライトモードに切り替え";
  const handleThemeToggle = () =>
    setTheme(theme === "light" ? "dark" : "light");
  return (
    <Button
      variant="ghost"
      isIconOnly
      className={styles["toggle"]}
      onClick={handleThemeToggle}
      aria-label={label}
      title={label}
      icon={
        theme === "light" ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />
      }
    />
  );
};
export default ThemeToggle;
