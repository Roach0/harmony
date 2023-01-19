import { useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { authenticate, getUserData } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  const client_id = process.env.CLIENT_ID as string;
  const client_secret = process.env.CLIENT_SECRET as string;

  const authData = await authenticate({
    request,
    client_id,
    client_secret,
  });

  const userData = await getUserData(authData);

  return json(userData);
}

export default function AppIndexPage() {
  const {
    id: userId,
    username,
    avatar,
    accent_color,
  } = useLoaderData<typeof loader>();
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white">
      <section
        className={`mx-auto w-64 rounded-2xl ${
          accent_color ? `bg-[#${accent_color}]` : "bg-gray-600"
        } px-8 py-6 text-center shadow-lg`}
      >
        {avatar ? (
          <img
            className="mx-auto w-28 rounded-full"
            src={`https://cdn.discordapp.com/avatars/${userId}/${avatar}.png`}
            alt={username}
          />
        ) : (
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
        )}
        <div className="mt-6 text-xl text-white">{`${username}`}</div>
      </section>
    </main>
  );
}
