import { EXTERNAL_LINKS } from "@/config/site";
import { useAuthors } from "@/features/AuthorProfile/hook/useAuthors";
import UserButton from "@/shared/ui/UserButton";

import type { Author } from "@/shared/types/content";

interface AuthorBadgeProps {
  id: string;
  author?: Author;
  size?: "compact" | "default";
}
const AuthorBadge = ({ id, author, size = "default" }: AuthorBadgeProps) => {
  const { data, error } = useAuthors({ isEnabled: !author });
  const value = author ?? data?.find((item) => item.id === id);
  const label = value?.name || (error ? "著者情報を取得できません" : "著者");
  const isExternal = value?.source === "toybox";
  return (
    <UserButton
      to={
        isExternal
          ? `${EXTERNAL_LINKS.toybox.url}users/${encodeURIComponent(id)}`
          : `/author/${encodeURIComponent(id)}`
      }
      isExternal={isExternal}
      displayName={label}
      avatarURL={value?.avatar ?? undefined}
      size={size}
    />
  );
};
export default AuthorBadge;
