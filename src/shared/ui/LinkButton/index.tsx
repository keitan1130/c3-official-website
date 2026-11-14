import { Link } from "react-router-dom";

import styles from "./index.module.css";

import type { ComponentProps } from "react";

type LinkButtonProps = ComponentProps<typeof Link>;

const LinkButton = ({ className, ...props }: LinkButtonProps) => (
  <Link
    {...props}
    className={[styles["link-button"], className].filter(Boolean).join(" ")}
  />
);
export default LinkButton;
