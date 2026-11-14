import styles from "./index.module.css";

import BodyContent from "@/features/BodyContent";
import CommunityLinks from "@/features/CommunityLinks";
import FeaturedWorks from "@/features/FeaturedWorks";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import { CONTENT } from "@/util/contentRepository";

const AboutPage = () => (
  <div className={styles["page"]}>
    <Breadcrumbs items={[{ label: "C3について" }]} />
    <h1 className={styles["title"]}>C3について</h1>
    <img className={styles["logo"]} src={CONTENT.site.logo} alt="C3" />
    <BodyContent load={CONTENT.about.body} />
    <h2 className={styles["section-title"]}>各分野について</h2>
    <CommunityLinks />
    <h2 className={styles["section-title"]}>作品</h2>
    <FeaturedWorks />
  </div>
);
export default AboutPage;
