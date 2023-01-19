import { createCookieSessionStorage, redirect } from "@remix-run/node";
import axios from "axios";
import invariant from "tiny-invariant";

import type { User } from "~/models/user.server";
import { createUser } from "~/models/user.server";
import { getUserByDiscordId } from "~/models/user.server";
import { getUserById } from "~/models/user.server";
import { discordAuthUrl } from "./helpers/urls";

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

const USER_SESSION_KEY = "userId";

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getUserId(
  request: Request
): Promise<User["id"] | undefined> {
  const session = await getSession(request);
  const userId = session.get(USER_SESSION_KEY);
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (userId === undefined) return null;

  const user = await getUserById(userId);
  if (user) return user;

  throw await logout(request);
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getUserId(request);
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

interface AuthData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface UserData {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  accent_color?: number;
  locale: string;
}

export async function getUserData(
  authData: Pick<AuthData, "access_token" | "token_type">
): Promise<UserData> {
  return await axios
    .get("https://discord.com/api/users/@me", {
      headers: {
        authorization: `${authData.token_type} ${authData.access_token}`,
      },
    })
    .then((resp) => resp.data);
}

export async function login({
  request,
  client_id,
  client_secret,
  code,
  refresh_token,
  headers = new Headers(),
}: {
  request: Request;
  client_id: string;
  client_secret: string;
  code?: string;
  refresh_token?: string;
  headers?: Headers;
}) {
  const authData: AuthData = await axios
    .post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id,
        client_secret,
        grant_type: refresh_token ? "refresh_token" : "authorization_code",
        ...(code && { code }),
        ...(refresh_token && { refresh_token }),
        ...(!refresh_token && {
          redirect_uri: "http://localhost:3000/app",
          scope: "identify",
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
  session.set("accessToken", authData.access_token);
  session.set("refreshToken", authData.refresh_token);
  session.set("tokenType", authData.token_type);
  session.set("expirationDate", Date.now() + authData.expires_in);

  headers.append("Set-Cookie", await sessionStorage.commitSession(session));

  if (request.method === "GET") throw redirect(request.url, { headers });

  const userData: UserData = await axios
    .get("https://discord.com/api/users/@me", {
      headers: {
        authorization: `${authData.token_type} ${authData.access_token}`,
      },
    })
    .then((resp) => resp.data);

  let user = await getUserByDiscordId(userData.id);

  if (!user) {
    user = await createUser(userData.id, userData.locale);
  }

  return authData;
}

export async function authenticate({
  request,
  client_id,
  client_secret,
  headers = new Headers(),
}: {
  request: Request;
  client_id: string;
  client_secret: string;
  headers?: Headers;
}): Promise<Pick<AuthData, "access_token" | "token_type">> {
  const session = await getSession(request);
  const access_token = session.get("accessToken");

  if (!access_token) {
    const code = new URL(request.url).searchParams.get("code");
    if (!code) {
      throw redirect(discordAuthUrl(client_id));
    }

    const authData = await login({
      request,
      client_id,
      client_secret,
      code,
      headers,
    });

    session.set("accessToken", authData.access_token);
    session.set("refreshToken", authData.refresh_token);
    session.set("tokenType", authData.token_type);
    session.set("expirationDate", Date.now() + authData.expires_in);

    return authData;
  }

  const expirationDate = session.get("expirationDate");
  if (Date.now() > expirationDate) {
    const refresh_token = session.get("refreshToken");
    const data = await login({
      request,
      client_id,
      client_secret,
      refresh_token,
      headers,
    });

    return data;
  }
  const token_type = session.get("tokenType");
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
