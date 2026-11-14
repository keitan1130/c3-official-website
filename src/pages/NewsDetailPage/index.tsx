import { useParams } from "react-router-dom";

import EntryDetail from "@/features/EntryDetail";
import NotFoundPage from "@/pages/NotFoundPage";
import { CONTENT, getNews } from "@/util/contentRepository";

const NewsDetailPage = () => {
  const { id } = useParams();
  const entry = getNews(id ?? "");
  return entry ? (
    <EntryDetail entry={entry} kind="news" recent={CONTENT.news} />
  ) : (
    <NotFoundPage />
  );
};
export default NewsDetailPage;
