import useBody from "./hook/useBody";
import styles from "./index.module.css";

import MarkdownPreview from "@/features/MarkdownPreview";
import Button from "@/shared/ui/Button";

import type { BodyLoader } from "@/shared/types/content";

interface BodyContentProps {
  load: BodyLoader;
}
const BodyContent = ({ load }: BodyContentProps) => {
  const { content, isLoading, error, retry } = useBody({ load });
  if (isLoading) return <p role="status">読み込み中…</p>;
  if (error)
    return (
      <div role="alert">
        {error}
        <Button onClick={retry}>再試行</Button>
      </div>
    );
  return (
    <div className={styles["body"]}>
      <MarkdownPreview content={content} />
    </div>
  );
};
export default BodyContent;
