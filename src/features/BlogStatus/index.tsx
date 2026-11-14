import Button from "@/shared/ui/Button";

interface BlogStatusProps {
  isLoading: boolean;
  hasError: boolean;
  unavailableSources?: string[];
  onRetry: () => void;
}
const BlogStatus = ({
  isLoading,
  hasError,
  unavailableSources = [],
  onRetry,
}: BlogStatusProps) => {
  if (isLoading) return <p role="status">ブログを読み込み中…</p>;
  if (hasError || unavailableSources.length)
    return (
      <div role="alert">
        {hasError
          ? "ブログを読み込めませんでした。"
          : "一部のブログを取得できませんでした。"}
        <Button onClick={onRetry}>再試行</Button>
      </div>
    );
  return null;
};
export default BlogStatus;
