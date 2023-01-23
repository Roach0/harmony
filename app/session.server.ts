import { createCookieSessionStorage, redirect } from "@remix-run/node";
import type { AxiosError } from "axios";
import axios from "axios";
import invariant from "tiny-invariant";

import type { User } from "~/models/user.server";
import { createUser } from "~/models/user.server";
import { getUserByDiscordId } from "~/models/user.server";
import { getUserById } from "~/models/user.server";
import { discordApiUrl, discordAuthUrl, getRedirectUri } from "~/helpers/urls";
import type { DiscordUserData } from "~/types";
import type { Socket } from "socket.io";

interface AuthData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

export const DISCORD_SESSION_KEY = "discordId";
export const USER_SESSION_KEY = "id";

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getSessionFromSocket(socket: Socket) {
  const cookie = socket.request.headers.cookie;
  return sessionStorage.getSession(cookie);
}

export async function getSessionDiscordId(
  request: Request
): Promise<User["discordId"] | undefined> {
  const session = await getSession(request);
  const discordId = session.get(DISCORD_SESSION_KEY);
  return discordId;
}

export async function getSessionUser(request: Request) {
  const discordId = await getSessionDiscordId(request);
  if (discordId === undefined) return null;

  const user = await getUserByDiscordId(discordId);
  if (user) return user;

  throw await logout(request);
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getSessionDiscordId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function requireUser(request: Request) {
  const userId = await requireUserId(request);

  const user = await getUserById(userId);
  if (user) return user;

  throw await logout(request);
}

export function newLogin(request: Request) {
  console.log("redirecting to discord auth");
  throw redirect(discordAuthUrl(getRedirectUri(request)));
}

export async function refresh(request: Request) {
  const session = await getSession(request);

  const refresh_token = session.get("refresh_token");

  console.log("refreshing");
  return login({
    request,
    refresh_token,
  }).catch(async () => {
    console.log("refresh failed");
    const code = new URL(request.url).searchParams.get("code");
    if (code) {
      console.log("trying to login with code");
      return login({ request, code }).catch((err: AxiosError | Response) => {
        if (err instanceof Response) {
          throw err;
        }
        console.log("login failed");
        throw newLogin(request);
      });
    }
    console.log("no code");
    throw newLogin(request);
  });
}

export async function getDiscordUserData(
  {
    request,
    authData,
  }: {
    request: Request;
    authData?: Pick<AuthData, "access_token" | "token_type">;
  },
  discordId?: string
): Promise<DiscordUserData> {
  const { access_token, token_type } =
    authData || (await authenticate(request));

  return axios
    .get<DiscordUserData>(`${discordApiUrl}/users/${discordId || "@me"}`, {
      headers: {
        authorization: `${token_type} ${access_token}`,
      },
    })
    .then((resp) => resp.data)
    .catch(async () => {
      console.log("discord api call failed for, refreshing token");
      const authData = await refresh(request);
      return getDiscordUserData({ request, authData }, discordId);
    });
}

export async function login({
  request,
  code,
  refresh_token,
  headers = new Headers(),
}: {
  request: Request;
  code?: string;
  refresh_token?: string;
  headers?: Headers;
}) {
  console.log("logging in", { code, refresh_token });
  const client_id = process.env.CLIENT_ID as string;
  const client_secret = process.env.CLIENT_SECRET as string;

  const authData: AuthData = await axios
    .post(
      `${discordApiUrl}/oauth2/token`,
      new URLSearchParams({
        client_id,
        client_secret,
        grant_type: refresh_token ? "refresh_token" : "authorization_code",
        scope: "identify",
        ...(code && { code }),
        ...(refresh_token && { refresh_token }),
        ...(!refresh_token && {
          redirect_uri: getRedirectUri(request),
        }),
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )
    .then((resp) => resp.data);

  const session = await getSession(request);
  session.set("access_token", authData.access_token);
  session.set("refresh_token", authData.refresh_token);
  session.set("token_type", authData.token_type);
  session.set("expires_in", Date.now() + authData.expires_in);

  const userData: DiscordUserData = await getDiscordUserData({
    request,
    authData,
  });

  session.set(DISCORD_SESSION_KEY, userData.id);
  session.set("discord_user_data", userData);

  let user = await getUserByDiscordId(userData.id);

  if (!user) {
    user = await createUser(userData.id, userData.locale);
  }

  session.set(USER_SESSION_KEY, user.id);

  headers.append("Set-Cookie", await sessionStorage.commitSession(session));

  if (request.method === "GET")
    throw redirect(request.url, {
      headers,
    });

  return authData;
}

export async function authenticate(
  request: Request
): Promise<Pick<AuthData, "access_token" | "token_type">> {
  console.log("authenticating");
  const session = await getSession(request);

  const access_token = session.get("access_token");
  const token_type = session.get("token_type");

  return { access_token, token_type };
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
