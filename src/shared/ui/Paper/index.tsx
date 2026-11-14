import styles from "./index.module.css";

import type { ReactNode } from "react";

interface PaperProps {
  children: ReactNode;
  className?: string;
}

const Paper = ({ children, className }: PaperProps) => (
  <div className={[styles["paper"], className].filter(Boolean).join(" ")}>
    {children}
  </div>
);

export default Paper;
