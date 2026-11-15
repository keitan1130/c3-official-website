import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { SITE } from "@/config/site";
import { createPageMetadata } from "@/util/pageMetadata";

interface PageMetaProps {
  title: string;
  description?: string;
  image?: string;
  isNoIndex?: boolean;
}
const PageMeta = ({
  title,
  description = SITE.description,
  image,
  isNoIndex = false,
}: PageMetaProps) => {
  const location = useLocation();
  useEffect(() => {
    const meta = createPageMetadata({
      title,
      description,
      image,
      pathname: location.pathname,
    });
    document.title = meta.title;
    const setMeta = (key: string, content: string, property = false) => {
      const attribute = property ? "property" : "name";
      let element = document.head.querySelector<HTMLMetaElement>(
        `meta[${attribute}="${key}"]`,
      );
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.append(element);
      }
      element.content = content;
    };
    if (isNoIndex) setMeta("robots", "noindex");
    else document.head.querySelector('meta[name="robots"]')?.remove();
    setMeta("description", meta.description);
    setMeta("og:title", meta.ogTitle, true);
    setMeta("og:description", meta.description, true);
    setMeta("og:url", meta.url, true);
    setMeta("og:image", meta.image, true);
    let link = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.append(link);
    }
    link.href = meta.url;
  }, [title, description, image, isNoIndex, location.pathname]);
  return null;
};
export default PageMeta;
