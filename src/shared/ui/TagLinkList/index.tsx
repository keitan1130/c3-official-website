import { Link } from "react-router-dom";

import styles from "./index.module.css";

import Batch from "@/shared/ui/Batch";
import { normalizeTagNameInput } from "@/util/tagName";

type TagLinkListProps = {
  tags: { id: string; name: string }[];
};

const TagLinkList = ({ tags }: TagLinkListProps) => {
  if (tags.length === 0) return null;

  return (
    <div className={styles["tag-link-list"]}>
      {tags.map((tag) => (
        <Link
          key={tag.id}
          to={`/blog?tag=${encodeURIComponent(tag.name)}`}
          className={styles["tag-link"]}
          aria-label={`${normalizeTagNameInput(tag.name)}のブログを探す`}
        >
          <Batch color="selected">{normalizeTagNameInput(tag.name)}</Batch>
        </Link>
      ))}
    </div>
  );
};

export default TagLinkList;
