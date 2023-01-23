import type { Locale } from "@prisma/client";
import { useNavigate } from "@remix-run/react";
import { useEffect } from "react";
import Avatar from "~/components/atoms/Avatar";
import Link from "~/components/atoms/Link";
import { useSocket } from "~/context";
import type { User } from "~/models/user.server";
import type { DiscordUserData } from "~/types";
import { useMatchesData } from "~/utils";

export default function AppMatchPage() {
  const socket = useSocket();
  const navigate = useNavigate();

  const {
    discordUserData: { id, username, avatar },
    locale: { discordId: localeName },
  } = useMatchesData("routes/app") as {
    discordUserData: DiscordUserData;
    userData: User;
    locale: Locale;
  };

  useEffect(() => {
    if (!socket) return;
    socket.connect();

    socket.on("join-room", (data) => {
      console.log(data);
    });

    socket.on("chat-start", (peerDiscordUserData: DiscordUserData) => {
      console.log("navigating to chat", peerDiscordUserData);
      navigate(`/app/${peerDiscordUserData.id}`, {
        state: peerDiscordUserData,
      });
    });

    socket.emit("join-room", { locale: localeName });
  }, [localeName, navigate, socket]);

  const goBack = () => {
    socket?.emit("cancel-match");
    navigate(-1);
  };

  return (
    <section className="flex h-full grow flex-col items-center justify-center text-center text-white">
      <Avatar
        discordUserData={{
          id,
          avatar,
          username,
        }}
        size="lg"
      />
      <p className="mt-6 text-xl">Matching</p>
      <Link onClick={goBack} to="/app" className="mt-6">
        Cancel
      </Link>
    </section>
  );
}
