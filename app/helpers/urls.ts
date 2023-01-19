export const discordAuthUrl = (clientId: string) =>
  `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapp&response_type=code&scope=identify`;
