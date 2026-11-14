import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import styles from "./index.module.css";

import { CONTENT } from "@/util/contentRepository";

const FeaturedWorks = () => (
  <div className={styles["works"]}>
    <div className={styles["background"]} aria-hidden="true">
      {[0, 1].map((copy) => (
        <div key={copy} className={styles["strip"]}>
          {CONTENT.works.map((work) => (
            <img
              key={work.id}
              src={work.thumbnail}
              alt=""
              title={work.title}
              loading="lazy"
            />
          ))}
        </div>
      ))}
    </div>
    <a href={CONTENT.site.worksUrl} target="_blank" rel="noreferrer">
      <OpenInNewIcon />
      作品を見る
    </a>
  </div>
);
export default FeaturedWorks;
