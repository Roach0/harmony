export const discordApiUrl = "https://discord.com/api";

export const getRedirectUri = (request: Request, tunnel?: boolean) =>
  tunnel
    ? request.url.split("?")[0].replace("http", "https")
    : request.url.split("?")[0].substring(0, request.url.indexOf("/app") + 4);

export const discordAuthUrl = (redirectUri: string) =>
  encodeURI(
    `${discordApiUrl}/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=identify`
  );

export const discordPhotoUrl = (discordId: string, avatar: string) =>
  `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`;
