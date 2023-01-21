export const discordApiUrl = "https://discord.com/api";

export const discordAuthUrl = (clientId: string, hostUrl?: string) =>
  `${discordApiUrl}/oauth2/authorize?client_id=${clientId}&redirect_uri=http%3A%2F%2F${hostUrl}%3A3000%2Fapp&response_type=code&scope=identify`;

export const discordPhotoUrl = (discordId: string, avatar: string) =>
  `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`;
