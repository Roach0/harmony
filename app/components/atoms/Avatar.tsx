import { discordPhotoUrl } from "~/helpers/urls";
import type { DiscordUserData } from "~/types";

interface AvatarProps {
  discordUserData?: Partial<DiscordUserData>;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  xs: "w-8 h-8",
  sm: "w-12 h-12",
  md: "w-28 h-28",
  lg: "w-64 h-64",
};
const URL_SIZE_MAP = {
  xs: 32,
  sm: 64,
  md: 128,
  lg: 256,
};

const AVATAR_SIZE_MAP = {
  xs: "w-12 h-12",
  sm: "w-16 h-16",
  md: "w-32 h-32",
  lg: "w-68 h-68",
};

export default function Avatar({ discordUserData, size = "md" }: AvatarProps) {
  const { id: discordId, username, avatar } = discordUserData || {};

  if (discordId && avatar) {
    return (
      <div className={`${SIZE_MAP[size]} mx-auto`}>
        <img
          className={`w-full rounded-full object-contain`}
          src={discordPhotoUrl(discordId, avatar, URL_SIZE_MAP[size])}
          alt={username || "Discord user"}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative mx-auto ${SIZE_MAP[size]} overflow-hidden rounded-full bg-gray-100 dark:bg-gray-600`}
    >
      <svg
        className={`absolute -left-2 ${AVATAR_SIZE_MAP[size]} text-gray-400`}
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
