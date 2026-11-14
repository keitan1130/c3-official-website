import { Route, Routes } from "react-router-dom";

import AppLayout from "@/features/AppLayout";
import AboutPage from "@/pages/AboutPage";
import AuthorPage from "@/pages/AuthorPage";
import BlogDetailPage from "@/pages/BlogDetailPage";
import BlogPage from "@/pages/BlogPage";
import CommunityPage from "@/pages/CommunityPage";
import NewsDetailPage from "@/pages/NewsDetailPage";
import NewsPage from "@/pages/NewsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import TopPage from "@/pages/TopPage";

const App = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<TopPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:id" element={<BlogDetailPage />} />
      <Route path="/news/:id" element={<NewsDetailPage />} />
      <Route path="/author/:id" element={<AuthorPage />} />
      <Route path="/community/:slug" element={<CommunityPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);
export default App;
