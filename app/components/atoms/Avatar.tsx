import { discordPhotoUrl } from "~/helpers/urls";
import type { DiscordUserData } from "~/types";

interface AvatarProps {
  discordUserData?: Partial<DiscordUserData>;
  size?: number;
}

export default function Avatar({ discordUserData, size = 28 }: AvatarProps) {
  const { id: discordId, username, avatar } = discordUserData || {};
  if (discordId && avatar) {
    return (
      <div className={`w- mx-auto${size} h-${size}`}>
        <img
          className={`w-full rounded-full object-contain`}
          src={discordPhotoUrl(discordId, avatar)}
          alt={username || "Discord user"}
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-600">
      <svg
        className="absolute -left-2 h-32 w-32 text-gray-400"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
          clip-rule="evenodd"
        ></path>
      </svg>
    </div>
  );
}
