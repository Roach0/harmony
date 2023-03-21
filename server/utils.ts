import type { Socket } from "socket.io";
import {
  DISCORD_SESSION_KEY,
  getSessionFromSocket,
  USER_SESSION_KEY,
} from "~/session.server";
import type { DiscordUserData, Message } from "~/types";

export interface Queue {
  members: {
    [key: string]: {
      lobby: string;
      position: number;
      room?: string;
      peer?: Socket;
    };
  };
  lobbies: { [key: string]: Socket[] };
  rooms: {
    [key: string]: {
      memberIds: string[];
      messages: Message[];
    };
  };
}

export const getDiscordId = async (socket: Socket) => {
  const session = await getSessionFromSocket(socket);
  const discordId: string = session.get(DISCORD_SESSION_KEY);
  if (!discordId) {
    socket.emit("join-room", { error: "user not found" });
  }
  return discordId;
};

export const getDiscordUserData = async (socket: Socket) => {
  const session = await getSessionFromSocket(socket);
  const discordUserData: DiscordUserData = session.get(
    "discord_user_data"
  ) as DiscordUserData;
  if (!discordUserData) {
    socket.emit("join-room", { error: "user not found" });
  }
  return discordUserData;
};

export const getUserId = async (socket: Socket) => {
  const session = await getSessionFromSocket(socket);
  const userId: string = session.get(USER_SESSION_KEY);
  if (!userId) {
    socket.emit("join-room", { error: "user not found" });
  }
  return userId;
};

export const log = (arr: string | any[]) => {
  console.log("Queue: ");
  for (let i = arr.length; i--; ) {
    console.log(arr[i].id);
  }
  console.log("\n");
};
