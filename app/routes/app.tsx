import { Outlet } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/node";
import { getDiscordUserData } from "~/session.server";
import { getUserByDiscordId } from "~/models/user.server";
import { getLocaleById } from "~/models/locale.server";
import { useState, useEffect } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import { SocketProvider } from "~/context";
import Link from "~/components/atoms/Link";

export async function loader({ request }: LoaderArgs) {
  const discordUserData = await getDiscordUserData({ request });
  const userData = await getUserByDiscordId(discordUserData.id);
  if (!userData) throw new Error("User not found");
  const locale = await getLocaleById(userData.localeId);
  return json({ discordUserData, userData, locale });
}

export default function AppIndexPage() {
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    const socket = io();
    setSocket(socket);
    return () => {
      socket.close();
    };
  }, []);

  return (
    <>
      <nav className="border-b border-slate-400 bg-slate-800 px-3 py-4">
        <div className="flex items-center justify-end">
          <Link to="/logout">Logout</Link>
        </div>
      </nav>
      <main className="h-full bg-[#293445]">
        <SocketProvider socket={socket}>
          <Outlet />
        </SocketProvider>
      </main>
    </>
  );
}
