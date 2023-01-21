import type { Locale } from "@prisma/client";
import { Link, useNavigate } from "@remix-run/react";
import { useEffect } from "react";
import Avatar from "~/components/atoms/Avatar";
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

    socket.on("chat start", ({ room }) => {
      navigate(`/app/${room}`);
    });

    socket.emit("join-room", { locale: localeName });
  }, [localeName, navigate, socket]);

  const goBack = () => {
    navigate(-1);
    socket?.disconnect();
  };

  return (
    <section className="flex h-full grow flex-col items-center justify-center text-center text-white">
      <Avatar
        discordUserData={{
          id,
          avatar,
          username,
        }}
        size={64}
      />
      <p className="mt-6 text-xl">Matching</p>
      <Link
        onClick={goBack}
        to="/app"
        className="mt-6 flex w-32 items-center justify-center rounded-lg bg-blue-500 px-2.5 py-2 font-medium text-white hover:bg-blue-600"
      >
        Cancel
      </Link>
    </section>
  );
}
