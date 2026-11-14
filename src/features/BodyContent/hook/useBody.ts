import { useEffect, useState } from "react";

import type { BodyLoader } from "@/shared/types/content";

interface UseBodyParams {
  load: BodyLoader;
}
interface UseBodyReturn {
  content: string;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}
const useBody = ({ load }: UseBodyParams): UseBodyReturn => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let isActive = true;
    void attempt;
    setContent("");
    setIsLoading(true);
    setError(null);
    load()
      .then((value) => {
        if (isActive) setContent(value);
      })
      .catch(() => {
        if (isActive) setError("本文を読み込めませんでした。");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [load, attempt]);
  return {
    content,
    isLoading,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
};
export default useBody;
