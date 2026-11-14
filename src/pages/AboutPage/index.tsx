import styles from "./index.module.css";

import c3Logo from "@/assets/c3-logo.webp";
import BodyContent from "@/features/BodyContent";
import CommunityLinks from "@/features/CommunityLinks";
import FeaturedWorks from "@/features/FeaturedWorks";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import PageMeta from "@/shared/ui/PageMeta";
import Paper from "@/shared/ui/Paper";
import { CONTENT } from "@/util/contentRepository";

const AboutPage = () => (
  <div className={styles["page"]}>
    <PageMeta title="C3について" description={CONTENT.about.summary} />
    <Breadcrumbs items={[{ label: "C3について" }]} />
    <Paper>
      <h1 className={styles["title"]}>C3について</h1>
      <img className={styles["logo"]} src={c3Logo} alt="C3" />
      <BodyContent load={CONTENT.about.body} />
      <h2 className={styles["section-title"]}>各分野について</h2>
      <CommunityLinks />
      <h2 className={styles["section-title"]}>作品</h2>
      <FeaturedWorks />
    </Paper>
  </div>
);
export default AboutPage;
