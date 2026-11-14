import { Route, Routes } from "react-router-dom";

import AppLayout from "@/features/AppLayout";
import AboutPage from "@/pages/AboutPage";
import CommunityPage from "@/pages/CommunityPage";
import NotFoundPage from "@/pages/NotFoundPage";
import TopPage from "@/pages/TopPage";

const App = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<TopPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/community/:slug" element={<CommunityPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);
export default App;
