import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { CONTENT } from "@/util/contentRepository";

interface PageMetaProps {
  title: string;
  description?: string;
  image?: string;
  isNoIndex?: boolean;
}
const PageMeta = ({
  title,
  description = CONTENT.site.description,
  image,
  isNoIndex = false,
}: PageMetaProps) => {
  const location = useLocation();
  useEffect(() => {
    document.title = `${title} | C3`;
    const canonical = new URL(location.pathname, CONTENT.site.canonicalOrigin);
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
    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:url", canonical.href, true);
    setMeta(
      "og:image",
      new URL(image || "/ogp/site.webp", canonical).href,
      true,
    );
    let link = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.append(link);
    }
    link.href = canonical.href;
  }, [title, description, image, isNoIndex, location.pathname]);
  return null;
};
export default PageMeta;
