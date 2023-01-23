import { discordPhotoUrl } from "~/helpers/urls";
import type { DiscordUserData } from "~/types";

interface AvatarProps {
  discordUserData?: Partial<DiscordUserData>;
  size?: "sm" | "md" | "lg";
}

export default function Avatar({ discordUserData, size = "md" }: AvatarProps) {
  const { id: discordId, username, avatar } = discordUserData || {};

  const sizeMap = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-28 h-28",
    lg: "w-64 h-64",
  };
  if (discordId && avatar) {
    return (
      <div className={`${sizeMap[size]} mx-auto`}>
        <img
          className={`w-full rounded-full object-contain`}
          src={discordPhotoUrl(discordId, avatar)}
          alt={username || "Discord user"}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative mx-auto h-28 w-28 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-600`}
    >
      <svg
        className={`absolute -left-2 h-32 w-32 text-gray-400`}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
          clipRule="evenodd"
        ></path>
      </svg>
    </div>
  );
}
