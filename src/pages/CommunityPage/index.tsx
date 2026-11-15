import { useParams } from "react-router-dom";

import styles from "./index.module.css";

import videoLoading from "@/assets/video-loading.png";
import BodyContent from "@/features/BodyContent";
import NotFoundPage from "@/pages/NotFoundPage";
import AutoplayVideo from "@/shared/ui/AutoplayVideo";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import PageMeta from "@/shared/ui/PageMeta";
import Paper from "@/shared/ui/Paper";
import { getCommunity } from "@/util/contentRepository";

const CommunityPage = () => {
  const { slug } = useParams();
  const community = getCommunity(slug ?? "");
  if (!community) return <NotFoundPage />;
  return (
    <div className={styles["page"]}>
      <PageMeta title={community.name} description={community.domain} />
      <Breadcrumbs isPageHeading items={[{ label: community.name }]} />
      <Paper>
        <div className={styles["video"]}>
          <AutoplayVideo
            src={community.mp4}
            poster={videoLoading}
            key={community.slug}
            aria-label={`${community.name}紹介動画`}
          />
        </div>
        <BodyContent load={community.body} />
      </Paper>
    </div>
  );
};
export default CommunityPage;
