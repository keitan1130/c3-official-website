import { Link } from "react-router-dom";

import styles from "./index.module.css";

interface BreadcrumbsProps {
  items: { label: string; url?: string }[];
}
const Breadcrumbs = ({ items }: BreadcrumbsProps) => (
  <nav className={styles["breadcrumbs"]} aria-label="パンくず">
    <ol>
      <li>
        <Link to="/">ホーム</Link>
      </li>
      {items.map((item, index) => (
        <li key={item.url ?? item.label}>
          {item.url && index < items.length - 1 ? (
            <Link to={item.url}>{item.label}</Link>
          ) : (
            <span
              aria-current={index === items.length - 1 ? "page" : undefined}
            >
              {item.label}
            </span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);
export default Breadcrumbs;
