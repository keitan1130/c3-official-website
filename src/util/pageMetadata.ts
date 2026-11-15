import { SITE } from "../config/site.ts";

interface PageMetadataInput {
  title: string;
  pathname: string;
  description?: string;
  image?: string;
}
export const createPageMetadata = ({
  title,
  pathname,
  description = SITE.description,
  image,
}: PageMetadataInput) => ({
  title: `${title} | ${SITE.shortName}`,
  ogTitle: title,
  description,
  url: new URL(pathname, SITE.origin).href,
  image: new URL(image || SITE.defaultImage, SITE.origin).href,
});
