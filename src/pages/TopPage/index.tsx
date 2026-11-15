import styles from "./index.module.css";

import { PAGES } from "@/config/site";
import FeaturedWorks from "@/features/FeaturedWorks";
import HomeBlog from "@/features/HomeBlog";
import HomeCommunity from "@/features/HomeCommunity";
import HomeHero from "@/features/HomeHero";
import HomeIntroduction from "@/features/HomeIntroduction";
import PageMeta from "@/shared/ui/PageMeta";
import { CONTENT } from "@/util/contentRepository";

const TopPage = () => (
  <>
    <PageMeta title={PAGES.home.title} />
    <HomeHero />
    <div className={styles["section"]}>
      <HomeIntroduction />
    </div>
    {CONTENT.communities.map((community, index) => (
      <div className={styles["section"]} key={community.slug}>
        <HomeCommunity community={community} isReversed={index % 2 === 1} />
      </div>
    ))}
    <section className={styles["section"]}>
      <h2 className={styles["title"]}>作品</h2>
      <FeaturedWorks />
    </section>
    <div className={styles["section"]}>
      <HomeBlog />
    </div>
  </>
);
export default TopPage;
