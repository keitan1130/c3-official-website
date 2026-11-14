import { useParams } from "react-router-dom";

import styles from "./index.module.css";

import BodyContent from "@/features/BodyContent";
import NotFoundPage from "@/pages/NotFoundPage";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import { CONTENT, getCommunity } from "@/util/contentRepository";

const CommunityPage = () => {
  const { slug } = useParams();
  const community = getCommunity(slug ?? "");
  if (!community) return <NotFoundPage />;
  return (
    <div className={styles["page"]}>
      <Breadcrumbs items={[{ label: community.name }]} />
      <h1 className={styles["title"]}>{community.name}</h1>
      <div className={styles["video"]}>
        <video
          key={community.id}
          poster={CONTENT.site.poster}
          preload="metadata"
          playsInline
          muted
          autoPlay
          loop
          aria-label={`${community.name}紹介動画`}
        >
          <source src={community.webm} type="video/webm" />
          <source src={community.mp4} type="video/mp4" />
        </video>
      </div>
      <BodyContent load={community.body} />
    </div>
  );
};
export default CommunityPage;
