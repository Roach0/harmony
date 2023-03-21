export interface DiscordUserData {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  accent_color?: number;
  locale: string;
}

export interface Message {
  id?: string;
  userId: string;
  message: string;
  pending?: boolean;
}
