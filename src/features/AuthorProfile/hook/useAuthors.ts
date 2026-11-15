import useSWRImmutable from "swr/immutable";

import { getAuthors } from "@/util/authorRepository";

import type { SWRResponse } from "swr";
import type { Author } from "@/shared/types/content";

interface UseAuthorsParams {
  isEnabled?: boolean;
}
type UseAuthorsReturn = SWRResponse<Author[], Error>;
export const useAuthors = ({
  isEnabled = true,
}: UseAuthorsParams = {}): UseAuthorsReturn =>
  useSWRImmutable(isEnabled ? "authors" : null, () => getAuthors(), {
    shouldRetryOnError: false,
  });
