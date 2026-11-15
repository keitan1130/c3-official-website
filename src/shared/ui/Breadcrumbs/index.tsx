import { Link } from "react-router-dom";

import styles from "./index.module.css";

interface BreadcrumbsProps {
  items: { label: string; url?: string }[];
  isPageHeading?: boolean;
}
const Breadcrumbs = ({ items, isPageHeading = false }: BreadcrumbsProps) => (
  <nav className={styles["breadcrumbs"]} aria-label="パンくずリスト">
    <ol>
      <li>
        <Link to="/">ホーム</Link>
      </li>
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1;
        const Current = isCurrent && isPageHeading ? "h1" : "span";
        return (
          <li key={item.url ?? item.label}>
            {item.url && !isCurrent ? (
              <Link to={item.url}>{item.label}</Link>
            ) : (
              <Current
                className={styles["current"]}
                aria-current={isCurrent ? "page" : undefined}
              >
                {item.label}
              </Current>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);
export default Breadcrumbs;
