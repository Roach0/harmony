import { Link, Outlet } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/node";
import { authenticate, getDiscordUserData } from "~/session.server";
import { getUserByDiscordId } from "~/models/user.server";
import { getLocaleById } from "~/models/locale.server";

export async function loader({ request }: LoaderArgs) {
  const client_id = process.env.CLIENT_ID as string;
  const client_secret = process.env.CLIENT_SECRET as string;

  const authData = await authenticate({
    request,
    client_id,
    client_secret,
  });

  const discordUserData = await getDiscordUserData(authData);
  const userData = await getUserByDiscordId(discordUserData.id);
  if (!userData) throw new Error("User not found");
  const locale = await getLocaleById(userData.localeId);
  return json({ discordUserData, userData, locale });
}

export default function AppIndexPage() {
  return (
    <>
      <nav className="border-b border-slate-400 bg-slate-800 px-3 py-4">
        <div className="flex items-center justify-end">
          <Link
            to="/logout"
            className="flex items-center justify-center rounded-lg bg-blue-500 px-2.5 py-2 font-medium text-white hover:bg-blue-600"
          >
            Logout
          </Link>
        </div>
      </nav>
      <main className="h-full bg-[#293445]">
        <Outlet />
      </main>
    </>
  );
}
