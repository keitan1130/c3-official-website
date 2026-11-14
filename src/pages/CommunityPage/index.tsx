import { useParams } from "react-router-dom";

import styles from "./index.module.css";

import videoLoading from "@/assets/video-loading.png";
import BodyContent from "@/features/BodyContent";
import NotFoundPage from "@/pages/NotFoundPage";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import PageMeta from "@/shared/ui/PageMeta";
import { getCommunity } from "@/util/contentRepository";

const CommunityPage = () => {
  const { slug } = useParams();
  const community = getCommunity(slug ?? "");
  if (!community) return <NotFoundPage />;
  return (
    <div className={styles["page"]}>
      <PageMeta title={community.name} description={community.domain} />
      <Breadcrumbs items={[{ label: community.name }]} />
      <h1 className={styles["title"]}>{community.name}</h1>
      <div className={styles["video"]}>
        <video
          poster={videoLoading}
          key={community.id}
          preload="metadata"
          playsInline
          muted
          autoPlay
          loop
          aria-label={`${community.name}紹介動画`}
        >
          <source src={community.mp4} type="video/mp4" />
        </video>
      </div>
      <BodyContent load={community.body} />
    </div>
  );
};
export default CommunityPage;
