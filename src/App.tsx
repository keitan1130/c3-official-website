import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import AppLayout from "@/features/AppLayout";

const TopPage = lazy(() => import("@/pages/TopPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const CommunityPage = lazy(() => import("@/pages/CommunityPage"));
const NewsPage = lazy(() => import("@/pages/NewsPage"));
const NewsDetailPage = lazy(() => import("@/pages/NewsDetailPage"));
const AuthorPage = lazy(() => import("@/pages/AuthorPage"));
const BlogPage = lazy(() => import("@/pages/BlogPage"));
const BlogDetailPage = lazy(() => import("@/pages/BlogDetailPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const App = () => (
  <Suspense fallback={<p role="status">読み込み中…</p>}>
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<TopPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/community/:slug" element={<CommunityPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:id" element={<NewsDetailPage />} />
        <Route path="/author/:id" element={<AuthorPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:id" element={<BlogDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </Suspense>
);
export default App;
