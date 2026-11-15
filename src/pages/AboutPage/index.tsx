import styles from "./index.module.css";

import { PAGES, SITE } from "@/config/site";
import BodyContent from "@/features/BodyContent";
import CommunityLinks from "@/features/CommunityLinks";
import FeaturedWorks from "@/features/FeaturedWorks";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import PageMeta from "@/shared/ui/PageMeta";
import Paper from "@/shared/ui/Paper";
import { CONTENT } from "@/util/contentRepository";

const AboutPage = () => (
  <div className={styles["page"]}>
    <PageMeta title={PAGES.about.title} description={CONTENT.about.summary} />
    <Breadcrumbs isPageHeading items={[{ label: PAGES.about.title }]} />
    <Paper>
      <img className={styles["logo"]} src={SITE.logo} alt="C3" />
      <BodyContent load={CONTENT.about.body} />
      <h2 className={styles["section-title"]}>各分野について</h2>
      <CommunityLinks />
      <h2 className={styles["section-title"]}>作品</h2>
      <FeaturedWorks />
    </Paper>
  </div>
);
export default AboutPage;
