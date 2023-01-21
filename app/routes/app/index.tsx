import {
  Form,
  Link,
  useLoaderData,
  useSubmit,
  useTransition,
} from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import type { User } from "~/models/user.server";
import { updateUserLocale } from "~/models/user.server";
import type { DiscordUserData } from "~/types";
import { json } from "@remix-run/server-runtime";
import Avatar from "~/components/atoms/Avatar";
import { useMatchesData } from "~/utils";
import { getLocaleList } from "~/models/locale.server";

export async function loader({ request }: LoaderArgs) {
  const localeList = await getLocaleList();
  return json(localeList);
}

export async function action({ request }: ActionArgs) {
  const form = await request.formData();
  const localeId = form.get("locale") as string;

  updateUserLocale(request, localeId);

  return json({ success: true });
}

export default function AppIndexPage() {
  const localeList = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const transition = useTransition();

  const {
    discordUserData: { id, username, avatar },
    userData: { localeId },
  } = useMatchesData("routes/app") as {
    discordUserData: DiscordUserData;
    userData: User;
  };

  const handleChange: React.FormEventHandler<HTMLFormElement> = (event) => {
    submit(event.currentTarget, event.currentTarget.value);
  };

  return (
    <section className="flex h-full grow flex-col items-center justify-center">
      <section className={`mx-auto text-center`}>
        <Avatar
          discordUserData={{
            id,
            avatar,
            username,
          }}
        />
        <div className="mt-6 text-xl text-white">{username}</div>
      </section>
      <section className="mt-6 flex flex-col text-center">
        <label htmlFor="locale" className="text-white">
          Language
        </label>
        <Form action="/app?index" method="post" onChange={handleChange}>
          <select
            disabled={transition.state === "submitting"}
            name="locale"
            defaultValue={localeId}
            className="mt-3 block w-32 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          >
            {localeList.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </Form>
        <Link
          to="match"
          style={{
            pointerEvents: transition.state === "submitting" ? "none" : "auto",
            backgroundColor:
              transition.state === "submitting" ? "#ccccccae" : undefined,
          }}
          className="mt-6 flex w-32 items-center justify-center rounded-lg bg-blue-500 px-2.5 py-2 font-medium text-white hover:bg-blue-600"
        >
          Match
        </Link>
      </section>
    </section>
  );
}
